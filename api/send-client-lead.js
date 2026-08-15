const { isValidEmail, sendEmail } = require('./_lib/mailer');
const { leadEmail, autoReply } = require('./_lib/client-templates');

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
    brand: {
      name: 'Balogh Márk E.V',
      monogram: 'BM',
      tagline: 'Villanyszerelés & biztonságtechnika',
      phone: '+36 70 433 1928',
      signerName: 'Balogh Márk',
      contactLine: 'Kemenesmagasi \u00b7 +36 70 433 1928',
      colors: {
        headerBg: '#0A0B0D',
        headerInk: '#EDECE7',
        accent: '#C9863F',
        // Vilagos hatteren a rezszin tul halvany a SZOVEGHEZ (kb. 2.6:1),
        // ezert a linkekhez es cimkekhez sotetebb valtozat kell.
        accentStrong: '#8A5A18',
        accentTint: '#FBF3E8',
      },
    },
  },
  // Vegpont-teszthez: CSAK a sajat cimunkre kuld, tehat nem lehet vele
  // ugyfelet zaklatni. Deploy utan ezzel ellenorizzuk, hogy a Resend-lanc
  // vegig mukodik, anelkul hogy egy valodi ugyfel postafiokjaba kuldenenk
  // teszt-levelet.
  '_teszt': {
    to: 'Peter.veszpremi@polarisweb.hu',
    label: 'Polarisweb teszt',
    brand: {
      name: 'Balogh Márk E.V',
      monogram: 'BM',
      tagline: 'Villanyszerelés & biztonságtechnika',
      phone: '+36 70 433 1928',
      signerName: 'Balogh Márk',
      contactLine: 'Kemenesmagasi \u00b7 +36 70 433 1928',
      colors: {
        headerBg: '#0A0B0D',
        headerInk: '#EDECE7',
        accent: '#C9863F',
        accentStrong: '#8A5A18',
        accentTint: '#FBF3E8',
      },
    },
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

  try {
    const lead = leadEmail({
      brand: cfg.brand,
      name, phone: hasPhone ? phone : '', email: hasEmail ? email : '',
      service, message,
    });
    await sendEmail({
      to: [cfg.to],
      subject: lead.subject,
      html: lead.html,
      // Csak akkor van ertelme, ha a latogato adott email cimet.
      replyTo: hasEmail ? email : undefined,
    });

    // Visszaigazolas a LATOGATONAK, csak ha adott email cimet. Ha ez elhasal,
    // az ugyfel ertesitese akkor is megtortent -> ne bukjon el az egesz keres.
    if (hasEmail) {
      try {
        const reply = autoReply({ brand: cfg.brand, name, service });
        await sendEmail({
          to: [String(email).trim()],
          subject: reply.subject,
          html: reply.html,
          replyTo: cfg.to,
        });
      } catch (autoErr) {
        console.error('send-client-lead auto-reply error:', autoErr);
      }
    }

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
