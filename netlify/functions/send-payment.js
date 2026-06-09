const nodemailer = require('nodemailer');

const CENTER_EMAIL = 'Divinekids4soul@gmail.com';

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Parse multipart form data (Netlify passes it as body)
  // For file uploads we rely on the text fields; attachments are noted
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    // multipart — parse manually from text
    body = {};
    const raw = event.body || '';
    const pairs = raw.split('&');
    pairs.forEach(p => {
      const [k, v] = p.split('=');
      if (k) body[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
    });
  }

  const childName   = body.paymentChildName || '—';
  const payerName   = body.payerName || '—';
  const payerEmail  = body.payerEmail || '';

  const options = [
    body.payAdmissionZelle === 'yes'  && '✅ Admission fee paid via Zelle (confirmation attached)',
    body.payFirstWeekZelle === 'yes'  && '✅ First week fee paid via Zelle (confirmation attached)',
    body.payAdmissionCash  === 'yes'  && '✅ Admission fee paid in cash',
    body.payFirstWeekCash  === 'yes'  && '✅ First week fee paid in cash',
  ].filter(Boolean).join('<br/>') || '—';

  const htmlCenter = `
    <div style="font-family:Arial,sans-serif;max-width:600px;color:#222;">
      <div style="background:#e8720c;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:18px;">New Payment Submission</h2>
      </div>
      <div style="background:#fff;border:1px solid #f0d9c0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
        <p><strong>Child:</strong> ${childName}</p>
        <p><strong>Parent / Guardian:</strong> ${payerName}</p>
        <p><strong>Email:</strong> ${payerEmail}</p>
        <p style="margin-top:14px;"><strong>Payment Options Selected:</strong></p>
        <p style="margin-top:6px;">${options}</p>
        <p style="margin-top:14px;font-size:.85rem;color:#888;">Note: Any Zelle confirmation attachments were uploaded via the form. Please check the enrollment records for attached files.</p>
      </div>
    </div>`;

  const htmlParent = `
    <div style="font-family:Arial,sans-serif;max-width:600px;color:#222;">
      <div style="background:#e8720c;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:18px;">Payment Information Received</h2>
      </div>
      <div style="background:#fff;border:1px solid #f0d9c0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
        <p>Dear ${payerName},</p>
        <p>Thank you! We have received your payment information for <strong>${childName}</strong>.</p>
        <p style="margin-top:10px;"><strong>Payment options submitted:</strong><br/>${options}</p>
        <p style="margin-top:16px;">We will confirm receipt and be in touch soon. If you have any questions, contact us at <a href="mailto:${CENTER_EMAIL}">${CENTER_EMAIL}</a>.</p>
        <p style="margin-top:20px;">Warm regards,<br/><strong>Divine Kids</strong></p>
      </div>
    </div>`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"Divine Kids" <${process.env.SMTP_USER}>`,
      to: CENTER_EMAIL,
      subject: `[PAYMENT] ${childName} — Payment Information Submitted`,
      html: htmlCenter,
    });
    if (payerEmail) {
      await transporter.sendMail({
        from: `"Divine Kids" <${process.env.SMTP_USER}>`,
        to: payerEmail,
        subject: 'Payment Information Received — Divine Kids',
        html: htmlParent,
      });
    }
  } catch (err) {
    console.error('Email error:', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to send email' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };
};
