const { escapeHtml, isValidEmail, sendEmail } = require('./_lib/mailer');

/**
 * Ugyfel-oldalak ajanlatkero urlapja.
 *
 * Kulonbseg a send-contact / send-quote vegpontokhoz kepest: ott a cimzett
 * MINDIG Peti (TO_EMAIL). Itt a cimzett maga az UGYFEL, tehat kliensenkent mas.
 *
 * A cimzettet KIZAROLAG ez a szerveroldali tabla dontheti el. A bongeszo csak
 * egy kulcsot kuld. Ha a kerest elfogadnank cimzettel egyutt, a vegpont nyilt
 * spam-tovabbito lenne a mar hitelesitett polarisweb.hu domainunkon keresztul:
 * barki barkinek kuldhetne levelet a nevunkben. Uj ugyfelnel EZT a tablat kell
 * bovoiteni, nem a frontendet.
 */
const CLIENTS = {
  'balogh-mark-villany': {
    to: 'balogh.mark83@gmail.com',
    label: 'Balogh Márk E.V',
  },
  // Vegpont-teszthez: CSAK a sajat cimunkre kuld, tehat nem lehet vele
  // ugyfelet zaklatni. Deploy utan ezzel ellenorizzuk, hogy a Resend-lanc
  // vegig mukodik, anelkul hogy egy valodi ugyfel postafiokjaba kuldenenk
  // teszt-levelet.
  '_teszt': {
    to: 'Peter.veszpremi@polarisweb.hu',
    label: 'Polarisweb teszt',
  },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const { client, name, phone, email, service, message, website } = body;

  // Honeypot: valodi latogato sosem tolti ki. Csendes 200, hogy a bot ne tanuljon.
  if (website) {
    res.status(200).json({ ok: true });
    return;
  }

  const cfg = CLIENTS[String(client || '').trim()];
  if (!cfg) {
    res.status(400).json({ error: 'Ismeretlen ugyfel-azonosito.' });
    return;
  }

  const hasName = name && String(name).trim();
  const hasPhone = phone && String(phone).trim();
  const hasEmail = email && String(email).trim();

  // Legalabb EGY valodi elerhetoseg kell, kulonben az uzenet hasznalhatatlan:
  // az ugyfel nem tud visszajelezni.
  if (!hasName) {
    res.status(400).json({ error: 'A név megadása kötelező.' });
    return;
  }
  if (!hasPhone && !hasEmail) {
    res.status(400).json({ error: 'Adjon meg telefonszámot vagy e-mail címet, hogy vissza tudjunk jelezni.' });
    return;
  }
  if (hasEmail && !isValidEmail(email)) {
    res.status(400).json({ error: 'Kérjük, adjon meg egy érvényes e-mail címet.' });
    return;
  }

  const html = `
    <h2>Új ajánlatkérés a weboldalról</h2>
    <p><strong>Név:</strong> ${escapeHtml(name)}</p>
    <p><strong>Telefon:</strong> ${escapeHtml(hasPhone ? phone : '—')}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(hasEmail ? email : '—')}</p>
    <p><strong>Szolgáltatás:</strong> ${escapeHtml(service || '—')}</p>
    <hr>
    <p><strong>Üzenet:</strong><br>${escapeHtml(message || '—').replace(/\n/g, '<br>')}</p>
    <hr>
    <p style="color:#666;font-size:12px;">
      Ez az üzenet a ${escapeHtml(cfg.label)} weboldalának ajánlatkérő űrlapjáról érkezett.
    </p>
  `;

  try {
    await sendEmail({
      to: [cfg.to],
      subject: `Ajánlatkérés a weboldalról: ${service || 'egyéb'}`,
      html,
      // Csak akkor van ertelme, ha a latogato adott email cimet.
      replyTo: hasEmail ? email : undefined,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-client-lead handler error:', err);
    if (err.code === 'CONFIG_MISSING') {
      res.status(500).json({ error: 'A szerver nincs megfelelően konfigurálva.' });
      return;
    }
    res.status(500).json({ error: 'Az üzenet küldése nem sikerült. Kérjük, hívjon minket telefonon.' });
  }
};
