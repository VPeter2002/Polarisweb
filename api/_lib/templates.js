const { escapeHtml } = require('./mailer');

function wrapEmail(bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Manrope', Roboto, sans-serif; background: #f8f8f8; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { padding: 40px 32px 24px; background: linear-gradient(135deg, #fafafa 0%, #fff 100%); border-bottom: 1px solid #efefef; }
    .brand-logo { display: flex; align-items: center; gap: 12px; }
    .mark { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #6366f1 0%, #f59e0b 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 20px; flex-shrink: 0; }
    .brand-text { font-size: 22px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.02em; margin: 0; }
    .content { padding: 48px 32px 40px; color: #3a3a3a; line-height: 1.8; }
    .content h2 { font-family: 'Instrument Serif', Georgia, serif; font-size: 32px; font-weight: 400; margin: 0 0 20px 0; color: #1a1a1a; letter-spacing: -0.005em; }
    .content p { margin: 0 0 16px 0; font-size: 16px; color: #555; }
    .eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6366f1; margin-bottom: 12px; }
    .footer { padding: 32px; border-top: 1px solid #efefef; background: #fafafa; font-size: 13px; color: #999; line-height: 1.6; }
    .footer p { margin: 0 0 8px 0; }
    .footer strong { color: #555; }
    @media (max-width: 480px) {
      .wrapper { width: 100%; }
      .header { padding: 32px 24px 20px; }
      .content { padding: 32px 24px; }
      .content h2 { font-size: 24px; }
      .footer { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand-logo">
        <div class="mark">★</div>
        <div class="brand-text">polarisweb</div>
      </div>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>Ezt az e-mailt a <strong>noreply@polarisweb.hu</strong> cím küldte. Ha válaszol, Veszprémi Péter kapja meg üzenetét.</p>
      <p>© 2026 polarisweb. Minden jog fenntartva.</p>
    </div>
  </div>
</body>
</html>`;
}

function contactAutoReply({ name }) {
  const safeName = escapeHtml(name);
  return {
    subject: 'Megkaptuk üzenetét — polarisweb',
    html: wrapEmail(`
      <div class="eyebrow">Visszaigazolás</div>
      <h2>Köszönjük, ${safeName}!</h2>
      <p>Ez egy automatikus visszaigazolás: <strong>megkaptuk kapcsolatfelvételi üzenetét</strong>, és 1 munkanapon belül válaszolunk rá.</p>
      <p>Ha időközben bármi eszébe jut, nyugodtan <a href="mailto:peter.veszpremi@polarisweb.hu" style="color: #6366f1; text-decoration: none; font-weight: 600;">keressen minket</a>.</p>
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #efefef;">
        <p style="font-size: 14px; margin-bottom: 4px;">Üdvözlettel,</p>
        <p style="font-size: 14px; color: #1a1a1a; font-weight: 600; margin: 0;">Veszprémi Péter</p>
        <p style="font-size: 12px; color: #999; margin: 2px 0 0 0;">polarisweb</p>
      </div>
    `),
  };
}

function quoteAutoReply({ name }) {
  const safeName = escapeHtml(name);
  return {
    subject: 'Megkaptuk ajánlatkérését — polarisweb',
    html: wrapEmail(`
      <div class="eyebrow">Visszaigazolás</div>
      <h2>Köszönjük, ${safeName}!</h2>
      <p>Ez egy automatikus visszaigazolás: <strong>megkaptuk ajánlatkérését</strong>. Péter és csapata 1 munkanapon belül jelentkezik egy személyre szabott javaslattal.</p>
      <p>Ha időközben bármi eszébe jut, nyugodtan <a href="mailto:peter.veszpremi@polarisweb.hu" style="color: #6366f1; text-decoration: none; font-weight: 600;">válaszoljon erre a levélre</a>.</p>
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #efefef;">
        <p style="font-size: 14px; margin-bottom: 4px;">Üdvözlettel,</p>
        <p style="font-size: 14px; color: #1a1a1a; font-weight: 600; margin: 0;">Veszprémi Péter</p>
        <p style="font-size: 12px; color: #999; margin: 2px 0 0 0;">polarisweb</p>
      </div>
    `),
  };
}

module.exports = { contactAutoReply, quoteAutoReply };
