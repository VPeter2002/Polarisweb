const { escapeHtml } = require('./mailer');

function wrapEmail(bodyHtml) {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
      <div style="padding: 8px 0 24px;">
        <span style="font-size: 20px; font-weight: 800;">polarisweb</span>
      </div>
      ${bodyHtml}
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;">
      <p style="font-size: 12px; color: #999;">Ezt az e-mailt a noreply@polarisweb.hu cím küldte automatikusan. Ha válaszol rá, Veszprémi Péter kapja meg üzenetét.</p>
    </div>
  `;
}

function contactAutoReply({ name }) {
  const safeName = escapeHtml(name);
  return {
    subject: 'Megkaptuk üzenetét — polarisweb',
    html: wrapEmail(`
      <h2 style="margin: 0 0 16px;">Köszönjük, ${safeName}!</h2>
      <p>Ez egy automatikus visszaigazolás: megkaptuk kapcsolatfelvételi üzenetét, és <strong>1 munkanapon belül</strong> válaszolunk rá.</p>
      <p>Ha időközben bármi eszébe jut, nyugodtan válaszoljon erre a levélre.</p>
      <p style="margin-top: 24px;">Üdvözlettel,<br>Veszprémi Péter<br>polarisweb</p>
    `),
  };
}

function quoteAutoReply({ name }) {
  const safeName = escapeHtml(name);
  return {
    subject: 'Megkaptuk ajánlatkérését — polarisweb',
    html: wrapEmail(`
      <h2 style="margin: 0 0 16px;">Köszönjük, ${safeName}!</h2>
      <p>Ez egy automatikus visszaigazolás: megkaptuk ajánlatkérését. Péter és csapata <strong>1 munkanapon belül</strong> jelentkezik egy személyre szabott javaslattal.</p>
      <p>Ha időközben bármi eszébe jut, nyugodtan válaszoljon erre a levélre.</p>
      <p style="margin-top: 24px;">Üdvözlettel,<br>Veszprémi Péter<br>polarisweb</p>
    `),
  };
}

module.exports = { contactAutoReply, quoteAutoReply };
