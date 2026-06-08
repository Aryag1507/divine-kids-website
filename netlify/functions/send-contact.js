const nodemailer = require('nodemailer');

const CENTER_EMAIL = 'Divinekids4soul@gmail.com';

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON' }) };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const htmlToCenter = `
    <div style="font-family:Arial,sans-serif;max-width:580px;color:#222;">
      <div style="background:#5b3ea1;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:18px;">New Contact Form Message</h2>
      </div>
      <div style="background:#fff;border:1px solid #e0d5f5;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
        <p><strong>Name:</strong> ${data.contactName || '—'}</p>
        <p><strong>Email:</strong> ${data.contactEmail || '—'}</p>
        <p><strong>Phone:</strong> ${data.contactPhone || '—'}</p>
        <p><strong>Message:</strong></p>
        <p style="background:#f9f6ff;padding:12px;border-radius:6px;white-space:pre-wrap;">${data.contactMessage || '—'}</p>
      </div>
    </div>
  `;

  const htmlToSender = `
    <div style="font-family:Arial,sans-serif;max-width:580px;color:#222;">
      <div style="background:#5b3ea1;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:18px;">We received your message!</h2>
      </div>
      <div style="background:#fff;border:1px solid #e0d5f5;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
        <p>Dear ${data.contactName || 'there'},</p>
        <p>Thank you for contacting Divine Kids. We have received your message and will get back to you as soon as possible.</p>
        <p>If your matter is urgent, you may also reach us directly at <a href="mailto:${CENTER_EMAIL}">${CENTER_EMAIL}</a>.</p>
        <p style="margin-top:20px;">Warm regards,<br/><strong>Divine Kids</strong></p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Divine Kids Website" <${process.env.SMTP_USER}>`,
      to: CENTER_EMAIL,
      subject: `Contact Form: Message from ${data.contactName || 'Website Visitor'}`,
      html: htmlToCenter,
      replyTo: data.contactEmail,
    });

    if (data.contactEmail) {
      await transporter.sendMail({
        from: `"Divine Kids" <${process.env.SMTP_USER}>`,
        to: data.contactEmail,
        subject: 'We received your message — Divine Kids',
        html: htmlToSender,
      });
    }
  } catch (err) {
    console.error('Email send error:', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to send email' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };
};
