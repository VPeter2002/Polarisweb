const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendEmail({ subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.TO_EMAIL;
  if (!apiKey || !toEmail) {
    const err = new Error('Missing RESEND_API_KEY or TO_EMAIL environment variable');
    err.code = 'CONFIG_MISSING';
    throw err;
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'polarisweb <onboarding@resend.dev>',
      to: [toEmail],
      reply_to: replyTo,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    const err = new Error(`Resend error ${res.status}: ${errText}`);
    err.code = 'RESEND_FAILED';
    throw err;
  }

  return res.json();
}

module.exports = { escapeHtml, sendEmail };
