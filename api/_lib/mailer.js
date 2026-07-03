const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function sendEmail({ subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.TO_EMAIL;
  if (!apiKey || !toEmail) {
    const err = new Error('Missing RESEND_API_KEY or TO_EMAIL environment variable');
    err.code = 'CONFIG_MISSING';
    throw err;
  }

  const payload = {
    from: 'polarisweb <noreply@polarisweb.hu>',
    to: [toEmail],
    subject,
    html,
  };
  // Only set reply_to when it's a valid address — an invalid one would
  // make Resend reject the whole email (422), losing the submission.
  if (isValidEmail(replyTo)) {
    payload.reply_to = replyTo.trim();
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    const err = new Error(`Resend error ${res.status}: ${errText}`);
    err.code = 'RESEND_FAILED';
    throw err;
  }

  return res.json();
}

module.exports = { escapeHtml, isValidEmail, sendEmail };
