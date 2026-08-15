const { escapeHtml } = require('./mailer');

/**
 * Ugyfel-oldalak email-sablonjai.
 *
 * Ket levelet general:
 *  - leadEmail:  az UGYFELNEK (pl. Mark) szolo ertesites az uj ajanlatkeresrol
 *  - autoReply:  a LATOGATONAK szolo visszaigazolas, az ugyfel arculataban
 *
 * VILAGOS hatteren dolgozunk akkor is, ha az adott weboldal sotet. A sotet
 * hatteru HTML-levelet sok kliens (kulonosen az Outlook es a Gmail sajat
 * sotet modja) ujraszinezi, es a vegeredmeny kiszamithatatlan. A markat az
 * akcens-szin es a fejlec-sav viszi, nem a teljes hatter.
 *
 * Tabla-alapu layout + inline stilusok: a <style> blokkot a legtobb levelezo
 * kidobja.
 */

/** Vilagos alapkeszlet, amit az ugyfel akcens-szine szemelyesit. */
const BASE = {
  bg: '#F2EFE9',
  surface: '#FFFFFF',
  ink: '#1C1F24',
  ink2: '#3D434C',
  muted: '#7A8089',
  border: '#E4DFD6',
};

function shell({ brand, preheader, eyebrow, heading, intro, blocks }) {
  const C = Object.assign({}, BASE, brand.colors);
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="hu">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light only">
  <title>${escapeHtml(brand.name)}</title>
</head>
<body style="margin:0; padding:0; background:${C.bg}; -webkit-font-smoothing:antialiased;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
    <tr><td align="center" style="padding:32px 16px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background:${C.surface}; border:1px solid ${C.border}; border-radius:14px; overflow:hidden;">

        <tr>
          <td style="padding:26px 36px; background:${C.headerBg}; ">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="width:44px; height:44px; border-radius:8px; background:${C.accent}; text-align:center; vertical-align:middle; font-family:Georgia,'Times New Roman',serif; font-size:19px; font-weight:700; color:${C.headerBg}; line-height:44px;">${escapeHtml(brand.monogram)}</td>
              <td style="padding-left:14px; vertical-align:middle;">
                <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:18px; font-weight:700; color:${C.headerInk}; letter-spacing:-0.01em;">${escapeHtml(brand.name)}</div>
                <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:12px; color:${C.accent}; letter-spacing:0.08em; text-transform:uppercase; padding-top:3px;">${escapeHtml(brand.tagline)}</div>
              </td>
            </tr></table>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 36px 4px 36px;">
            <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${C.accentStrong}; margin-bottom:12px;">${escapeHtml(eyebrow)}</div>
            <h1 style="margin:0 0 18px 0; font-family:Georgia,'Times New Roman',serif; font-size:28px; line-height:1.2; font-weight:400; color:${C.ink};">${heading}</h1>
            <p style="margin:0 0 8px 0; font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.7; color:${C.ink2};">${intro}</p>
          </td>
        </tr>

        ${blocks}

      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
        <tr><td style="padding:18px 36px 8px 36px; text-align:center; font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:12px; line-height:1.7; color:${C.muted};">
          ${escapeHtml(brand.name)} &middot; ${escapeHtml(brand.contactLine)}
        </td></tr>
        <tr><td style="padding:0 36px 26px 36px; text-align:center;">
          <span style="font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:10px; color:#B9B3AA; letter-spacing:0.02em;">Működteti a <a href="https://polarisweb.hu" style="color:#B9B3AA; text-decoration:none;">polarisweb.hu</a></span>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

/** Egy cimke-ertek sor a reszletek kartyaban. */
function row(label, valueHtml, C) {
  return `<tr>
    <td style="padding:9px 0; border-bottom:1px solid ${C.border}; font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:13px; color:${C.muted}; width:130px; vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:9px 0; border-bottom:1px solid ${C.border}; font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:15px; color:${C.ink}; font-weight:600;">${valueHtml}</td>
  </tr>`;
}

/** Az UGYFELNEK szolo ertesites az uj ajanlatkeresrol. */
function leadEmail({ brand, name, phone, email, service, message }) {
  const C = Object.assign({}, BASE, brand.colors);
  const safeName = escapeHtml(name);
  const telHref = phone ? String(phone).replace(/[^\d+]/g, '') : '';

  const rows = [
    row('Név', safeName, C),
    phone
      ? row('Telefon', `<a href="tel:${escapeHtml(telHref)}" style="color:${C.accentStrong}; text-decoration:none;">${escapeHtml(phone)}</a>`, C)
      : '',
    email
      ? row('E-mail', `<a href="mailto:${escapeHtml(email)}" style="color:${C.accentStrong}; text-decoration:none;">${escapeHtml(email)}</a>`, C)
      : '',
    row('Szolgáltatás', escapeHtml(service || 'Nincs megadva'), C),
  ].join('');

  const messageBlock = message
    ? `<tr><td style="padding:8px 36px 0 36px;">
         <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:${C.muted}; margin-bottom:8px;">Üzenet</div>
         <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.7; color:${C.ink2}; background:${C.accentTint}; border-left:3px solid ${C.accent}; padding:14px 16px; border-radius:0 6px 6px 0;">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
       </td></tr>`
    : '';

  const cta = phone
    ? `<tr><td style="padding:24px 36px 8px 36px;">
         <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
           <td style="background:${C.accent}; border-radius:6px;">
             <a href="tel:${escapeHtml(telHref)}" style="display:inline-block; padding:13px 26px; font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:15px; font-weight:700; color:${C.headerBg}; text-decoration:none;">Visszahívom: ${escapeHtml(phone)}</a>
           </td>
         </tr></table>
       </td></tr>`
    : '';

  return {
    subject: `Új ajánlatkérés a weboldalról: ${service || 'egyéb'}`,
    html: shell({
      brand,
      preheader: `${name} ajánlatkérést küldött a weboldalról`,
      eyebrow: 'Új ajánlatkérés',
      heading: `${safeName} keresi Önt.`,
      intro: 'Ez az üzenet a weboldal ajánlatkérő űrlapjáról érkezett. Az alábbi elérhetőségeken tud visszajelezni.',
      blocks: `
        <tr><td style="padding:8px 36px 0 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
        </td></tr>
        ${messageBlock}
        ${cta}
        <tr><td style="padding:24px 36px 32px 36px;"></td></tr>`,
    }),
  };
}

/** A LATOGATONAK szolo visszaigazolas, az ugyfel arculataban. */
function autoReply({ brand, name, service }) {
  const C = Object.assign({}, BASE, brand.colors);
  const safeName = escapeHtml(name);

  return {
    subject: `Megkaptam az üzenetét — ${brand.name}`,
    html: shell({
      brand,
      preheader: `Megkaptam az üzenetét, hamarosan jelentkezem. ${brand.name}`,
      eyebrow: 'Visszaigazolás',
      heading: `Köszönöm, ${safeName}!`,
      intro: 'Megkaptam az üzenetét a weboldalamról. Ez egy automatikus visszaigazolás, hogy tudja: megérkezett.',
      blocks: `
        <tr><td style="padding:12px 36px 0 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.accentTint}; border-radius:10px;">
            <tr><td style="padding:20px 22px;">
              <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:14px; font-weight:700; color:${C.accentStrong}; margin-bottom:6px;">Mi történik most?</div>
              <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.65; color:${C.ink2};">
                Átnézem, mire van szüksége, és hamarosan keresem a megadott elérhetőségen, hogy egyeztessünk időpontot és helyszínt.
                ${service ? `Amit megjelölt: <strong style="color:${C.ink};">${escapeHtml(service)}</strong>.` : ''}
              </div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:22px 36px 6px 36px;">
          <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.7; color:${C.ink2};">
            Ha sürgős, vagy időközben eszébe jut még valami, hívjon nyugodtan:
            <a href="tel:${escapeHtml(String(brand.phone).replace(/[^\d+]/g, ''))}" style="color:${C.accentStrong}; text-decoration:none; font-weight:700;">${escapeHtml(brand.phone)}</a>
          </div>
        </td></tr>
        <tr><td style="padding:26px 36px 34px 36px; border-top:1px solid ${C.border};">
          <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:15px; font-weight:700; color:${C.ink};">${escapeHtml(brand.signerName)}</div>
          <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif; font-size:13px; color:${C.muted}; padding-top:2px;">${escapeHtml(brand.tagline)}</div>
        </td></tr>`,
    }),
  };
}

module.exports = { leadEmail, autoReply };
