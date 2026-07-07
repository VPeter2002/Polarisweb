const { escapeHtml } = require('./mailer');

/* Site palette (oklch → hex approximations from assets/css/style.css) */
const C = {
  bg: '#f4f1ea',        // --bg warm cream
  surface: '#fffdf9',   // --surface
  ink: '#2c2620',       // --ink warm near-black
  ink2: '#4a423b',      // --ink-2
  muted: '#7a7168',     // --muted
  border: '#e7e2d8',    // --border
  accent: '#5b5ff0',    // --accent blue-violet
  accentStrong: '#4548c9', // --accent-strong
  accentTint: '#ececfb',   // --accent-tint
  warm: '#e79a5c',      // --warm orange
};

/**
 * Renders the shared email shell. Table-based + inline styles so it survives
 * Gmail / Outlook / Apple Mail, which strip most <style> blocks.
 *
 * @param {object} opts
 * @param {string} opts.eyebrow  Small uppercase label above the heading
 * @param {string} opts.heading  Serif greeting (already escaped)
 * @param {string} opts.intro    Lead paragraph HTML
 * @param {string} opts.nextTitle  Title of the "what happens next" card
 * @param {string} opts.nextBody   Body of that card
 */
function wrapEmail({ eyebrow, heading, intro, nextTitle, nextBody }) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="hu">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light only">
  <title>Polarisweb</title>
</head>
<body style="margin:0; padding:0; background:${C.bg}; -webkit-font-smoothing:antialiased;">
  <!-- preheader (hidden preview text) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(nextTitle)} — Polarisweb</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background:${C.surface}; border:1px solid ${C.border}; border-radius:20px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:36px 40px 28px 40px; border-bottom:1px solid ${C.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                      <td style="width:40px; height:40px; border-radius:11px; background:linear-gradient(135deg,${C.accent},${C.warm}); text-align:center; vertical-align:middle; font-size:22px; line-height:40px; color:#ffffff; font-weight:700;">&#10022;</td>
                      <td style="padding-left:12px; vertical-align:middle; font-family:'Manrope',Segoe UI,Helvetica,Arial,sans-serif; font-size:21px; font-weight:800; letter-spacing:-0.02em; color:${C.ink};">Polarisweb</td>
                    </tr></table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:44px 40px 8px 40px;">
              <div style="font-family:'Manrope',Segoe UI,Helvetica,Arial,sans-serif; font-size:12px; font-weight:700; letter-spacing:0.09em; text-transform:uppercase; color:${C.accentStrong}; margin-bottom:14px;">${escapeHtml(eyebrow)}</div>
              <h1 style="margin:0 0 22px 0; font-family:Georgia,'Times New Roman',serif; font-size:34px; line-height:1.15; font-weight:400; letter-spacing:-0.01em; color:${C.ink};">${heading}</h1>
              <p style="margin:0 0 18px 0; font-family:'Manrope',Segoe UI,Helvetica,Arial,sans-serif; font-size:16px; line-height:1.75; color:${C.ink2};">${intro}</p>
            </td>
          </tr>

          <!-- "What happens next" card -->
          <tr>
            <td style="padding:16px 40px 8px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.accentTint}; border-radius:14px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <div style="font-family:'Manrope',Segoe UI,Helvetica,Arial,sans-serif; font-size:14px; font-weight:800; color:${C.accentStrong}; margin-bottom:6px;">${escapeHtml(nextTitle)}</div>
                    <div style="font-family:'Manrope',Segoe UI,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.65; color:${C.ink2};">${nextBody}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:28px 40px 40px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,${C.accent},${C.warm}); text-align:center; vertical-align:middle; font-family:'Manrope',Segoe UI,Helvetica,Arial,sans-serif; font-size:18px; font-weight:800; color:#ffffff; line-height:44px;">VP</td>
                <td style="padding-left:14px; vertical-align:middle;">
                  <div style="font-family:'Manrope',Segoe UI,Helvetica,Arial,sans-serif; font-size:15px; font-weight:700; color:${C.ink};">Veszprémi Péter</div>
                  <div style="font-family:'Manrope',Segoe UI,Helvetica,Arial,sans-serif; font-size:13px; color:${C.muted};">Alapító · Polarisweb</div>
                  <a href="mailto:peter.veszpremi@polarisweb.hu" style="font-family:'Manrope',Segoe UI,Helvetica,Arial,sans-serif; font-size:13px; color:${C.accentStrong}; text-decoration:none; font-weight:600;">peter.veszpremi@polarisweb.hu</a>
                </td>
              </tr></table>
            </td>
          </tr>

        </table>

        <!-- Footer -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
          <tr>
            <td style="padding:24px 40px; text-align:center; font-family:'Manrope',Segoe UI,Helvetica,Arial,sans-serif; font-size:12px; line-height:1.7; color:${C.muted};">
              Ezt az e-mailt a <strong style="color:${C.ink2};">noreply@polarisweb.hu</strong> cím küldte automatikusan.<br>
              Ha válaszol rá, Veszprémi Péter kapja meg üzenetét.<br>
              <span style="color:#b8b0a6;">© 2026 Polarisweb · Minden jog fenntartva</span>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function contactAutoReply({ name }) {
  const safeName = escapeHtml(name);
  return {
    subject: 'Megkaptuk üzenetét — Polarisweb',
    html: wrapEmail({
      eyebrow: 'Visszaigazolás',
      heading: `Köszönjük, ${safeName}!`,
      intro: 'Megkaptuk kapcsolatfelvételi üzenetét — ez egy automatikus visszaigazolás, hogy tudja, jó helyen landolt.',
      nextTitle: 'Mi történik most?',
      nextBody: 'Pár munkanapon belül személyesen jelentkezünk a válaszunkkal. Ha időközben bármi eszébe jut, egyszerűen válaszoljon erre a levélre.',
    }),
  };
}

function quoteAutoReply({ name }) {
  const safeName = escapeHtml(name);
  return {
    subject: 'Megkaptuk ajánlatkérését — Polarisweb',
    html: wrapEmail({
      eyebrow: 'Visszaigazolás',
      heading: `Köszönjük, ${safeName}!`,
      intro: 'Megkaptuk ajánlatkérését — ez egy automatikus visszaigazolás, hogy tudja, minden rendben megérkezett hozzánk.',
      nextTitle: 'Mi történik most?',
      nextBody: 'Péter és csapata pár munkanapon belül jelentkezik egy személyre szabott javaslattal, kötelezettség és szakzsargon nélkül. Ha addig bármi eszébe jut, válaszoljon erre a levélre.',
    }),
  };
}

module.exports = { contactAutoReply, quoteAutoReply };
