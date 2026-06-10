const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const CENTER_EMAIL = 'Divinekids4soul@gmail.com';

function v(val) { return (val && String(val).trim()) || '—'; }

// ── Build Payment PDF ────────────────────────────────────────────────────────
function buildPdf(d) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 45, size: 'letter', bufferPages: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W      = doc.page.width - 90;
    const ORANGE = '#e8720c';
    const DARK   = '#2a1f0e';
    const MUTED  = '#7a5c3a';
    const LGRAY  = '#fff8f0';
    let y = 45;

    const checkY = (needed = 30) => {
      if (y + needed > doc.page.height - 45) { doc.addPage(); y = 45; }
    };

    const sectionHeader = (text) => {
      checkY(26);
      doc.rect(45, y, W, 20).fill(ORANGE);
      doc.fillColor('#fff').fontSize(10).font('Helvetica-Bold').text(text, 51, y + 5, { width: W - 10 });
      y += 24;
    };

    const field = (question, answer) => {
      checkY(16);
      const startY = y;
      doc.fillColor(MUTED).fontSize(8.5).font('Helvetica-Bold').text(question, 45, y, { width: 220 });
      const qH = doc.y - startY;
      doc.fillColor(DARK).fontSize(8.5).font('Helvetica').text(v(answer), 275, startY, { width: W - 230 });
      const aH = doc.y - startY;
      y = startY + Math.max(qH, aH) + 4;
    };

    const checkField = (question, isChecked) => {
      checkY(14);
      const prefix = isChecked ? '[X]' : '[ ]';
      const sy = y;
      doc.fillColor(isChecked ? ORANGE : MUTED).fontSize(8.5).font('Helvetica-Bold')
         .text(prefix, 45, y, {width:28});
      doc.fillColor(isChecked ? DARK : MUTED).fontSize(8.5).font(isChecked ? 'Helvetica-Bold' : 'Helvetica')
         .text(question, 77, sy, {width:W-32});
      y = doc.y + 3;
    };

    const note = (text) => {
      checkY(18);
      doc.rect(45, y, W, 1).fill('#e0cdb8');
      y += 4;
      doc.fillColor(MUTED).fontSize(7.5).font('Helvetica-Oblique').text(text, 45, y, { width: W });
      y = doc.y + 6;
    };

    // ── Title ─────────────────────────────────────────────────────────────────
    doc.fillColor(ORANGE).fontSize(18).font('Helvetica-Bold').text('Divine Kids — Payment Information', 45, y);
    y = doc.y + 4;
    doc.fillColor(MUTED).fontSize(9).font('Helvetica')
       .text(`Submitted: ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}`, 45, y);
    y = doc.y + 10;
    doc.rect(45, y, W, 0.5).fill('#e0cdb8');
    y += 10;

    // ── Section 15 ────────────────────────────────────────────────────────────
    sectionHeader('Section 15 — Payment Information');
    note('Admission priority will be given to the child whose admission fee and first week fee has been received by the center.');
    field("Child's Full Name", d.paymentChildName);
    field('Parent / Guardian Name', d.payerName);
    field('Email Address', d.payerEmail);

    y += 6;
    doc.fillColor(MUTED).fontSize(8.5).font('Helvetica-Bold').text('Payment Options Selected:', 45, y);
    y = doc.y + 6;

    checkField('1. Admission fee has been paid through Zelle and confirmation is attached.', d.payAdmissionZelle === 'yes');
    checkField('2. First week fee has been paid through Zelle and confirmation is attached.', d.payFirstWeekZelle === 'yes');
    checkField('3. Admission fee has been paid through cash.', d.payAdmissionCash === 'yes');
    checkField('4. First week fee has been paid through cash.', d.payFirstWeekCash === 'yes');

    y += 8;
    if (d.payAdmissionZelle === 'yes' || d.payFirstWeekZelle === 'yes') {
      doc.fillColor(MUTED).fontSize(7.5).font('Helvetica-Oblique')
         .text('Note: Zelle confirmation screenshot(s) are attached to this email.', 45, y, { width: W });
      y = doc.y + 8;
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(pages.start + i);
      doc.fillColor(MUTED).fontSize(7.5).font('Helvetica')
         .text(`Divine Kids — Payment Information  |  Page ${i + 1} of ${pages.count}`,
               45, doc.page.height - 30, { width: W, align: 'center' });
    }

    doc.flushPages();
    doc.end();
  });
}

// ── Handler ──────────────────────────────────────────────────────────────────
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

  const childName  = body.paymentChildName || '—';
  const payerName  = body.payerName || '—';
  const payerEmail = body.payerEmail || '';

  const paymentOptions = [
    body.payAdmissionZelle === 'yes' && '✅ Admission fee paid via Zelle (confirmation attached)',
    body.payFirstWeekZelle === 'yes' && '✅ First week fee paid via Zelle (confirmation attached)',
    body.payAdmissionCash  === 'yes' && '✅ Admission fee paid in cash',
    body.payFirstWeekCash  === 'yes' && '✅ First week fee paid in cash',
  ].filter(Boolean).join('<br/>') || '—';

  // Generate PDF
  let pdfBuffer;
  try {
    pdfBuffer = await buildPdf(body);
  } catch (err) {
    console.error('PDF error:', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to generate PDF' }) };
  }

  // Build attachments: PDF + Zelle confirmations
  const attachments = [
    { filename: `Payment-${childName.replace(/\s+/g,'-')}.pdf`, content: pdfBuffer, contentType: 'application/pdf' },
  ];
  const zelleFiles = {
    admissionZelleFile: 'Admission-Fee-Zelle-Confirmation',
    firstWeekZelleFile: 'First-Week-Fee-Zelle-Confirmation',
  };
  for (const [field, label] of Object.entries(zelleFiles)) {
    const f = body[field];
    if (f && f.data) {
      attachments.push({
        filename:    f.name || `${label}.jpg`,
        content:     Buffer.from(f.data, 'base64'),
        contentType: f.type || 'image/jpeg',
      });
    }
  }

  const htmlCenter = `
    <div style="font-family:Arial,sans-serif;max-width:600px;color:#222;">
      <div style="background:#e8720c;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:18px;">Payment Received — ${childName}</h2>
        <p style="color:rgba(255,255,255,.85);margin:4px 0 0;font-size:12px;">A payment submission has been received. Full PDF attached.</p>
      </div>
      <div style="background:#fff;border:1px solid #f0d9c0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
        <p><strong>Child's Full Name:</strong> ${childName}</p>
        <p><strong>Parent / Guardian:</strong> ${payerName}</p>
        <p><strong>Email:</strong> ${payerEmail}</p>
        <p style="margin-top:14px;"><strong>Payment Options Selected:</strong><br/>${paymentOptions}</p>
        ${attachments.length > 1 ? `<p style="margin-top:10px;font-size:.85rem;color:#555;">📎 ${attachments.length - 1} Zelle confirmation(s) attached.</p>` : ''}
      </div>
    </div>`;

  const htmlParent = `
    <div style="font-family:Arial,sans-serif;max-width:600px;color:#222;">
      <div style="background:#e8720c;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:18px;">Payment Confirmation — Divine Kids</h2>
      </div>
      <div style="background:#fff;border:1px solid #f0d9c0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
        <p>Dear ${payerName},</p>
        <p>Thank you! We have received your payment information for <strong>${childName}</strong>. A PDF copy is attached for your records.</p>
        <p style="margin-top:10px;"><strong>Payment options submitted:</strong><br/>${paymentOptions}</p>
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
      subject: `[PAYMENT] ${childName} — Payment Submitted`,
      html: htmlCenter,
      attachments,
    });
    if (payerEmail) {
      await transporter.sendMail({
        from: `"Divine Kids" <${process.env.SMTP_USER}>`,
        to: payerEmail,
        subject: `Payment Confirmation — Divine Kids`,
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
