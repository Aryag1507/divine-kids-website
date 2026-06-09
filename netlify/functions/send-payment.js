const nodemailer = require('nodemailer');

const CENTER_EMAIL = 'Divinekids4soul@gmail.com';

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON' }) };
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
        <h2 style="color:#fff;margin:0;font-size:18px;">New Enrollment &amp; Payment Submission</h2>
        <p style="color:rgba(255,255,255,.85);margin:4px 0 0;font-size:12px;">Enrollment form and payment have both been completed.</p>
      </div>
      <div style="background:#fff;border:1px solid #f0d9c0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
        <p><strong>Child:</strong> ${childName}</p>
        <p><strong>Parent / Guardian:</strong> ${payerName}</p>
        <p><strong>Email:</strong> ${payerEmail}</p>
        <p style="margin-top:14px;"><strong>✅ Enrollment form submitted</strong></p>
        <p style="margin-top:10px;"><strong>Payment options selected:</strong></p>
        <p style="margin-top:6px;">${options}</p>
        ${attachments.length ? `<p style="margin-top:10px;font-size:.85rem;color:#555;">📎 ${attachments.length} file(s) attached to this email.</p>` : ''}
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

  // Build attachments from base64 Zelle confirmation files
  const attachments = [];
  const zelleFiles = {
    admissionZelleFile: 'Admission-Fee-Zelle-Confirmation',
    firstWeekZelleFile: 'First-Week-Fee-Zelle-Confirmation',
  };
  for (const [field, label] of Object.entries(zelleFiles)) {
    const f = body[field];
    if (f && f.data) {
      attachments.push({
        filename: f.name || `${label}.pdf`,
        content:  Buffer.from(f.data, 'base64'),
        contentType: f.type || 'application/octet-stream',
      });
    }
  }

  try {
    // One combined email to Divine Kids covering both enrollment + payment
    await transporter.sendMail({
      from: `"Divine Kids" <${process.env.SMTP_USER}>`,
      to: CENTER_EMAIL,
      subject: `[NEW ENROLLMENT] ${childName} — Enrollment & Payment Complete`,
      html: htmlCenter,
      attachments,
    });
    // Separate confirmation to parent
    if (payerEmail) {
      await transporter.sendMail({
        from: `"Divine Kids" <${process.env.SMTP_USER}>`,
        to: payerEmail,
        subject: 'Payment Information Received — Divine Kids',
        html: htmlParent,
        attachments,
      });
    }
  } catch (err) {
    console.error('Email error:', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to send email' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };
};
