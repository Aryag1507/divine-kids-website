const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const CENTER_EMAIL = 'Divinekids4soul@gmail.com';

function v(val) { return (val && String(val).trim()) || '—'; }

// ── Build Payment PDF — every word from the payment page ─────────────────────
function buildPdf(d) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 45, size: 'letter', bufferPages: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width - 90;
    const ORANGE = '#e8720c'; const DARK = '#2a1f0e'; const MUTED = '#7a5c3a';
    let y = 45;

    const checkY = (n=20) => { if (y+n > doc.page.height-45) { doc.addPage(); y=45; } };
    const SH = (t) => { checkY(22); doc.rect(45,y,W,18).fill(ORANGE); doc.fillColor('#fff').fontSize(9.5).font('Helvetica-Bold').text(t,51,y+4,{width:W-12}); y+=22; };
    const NOTE = (t) => { checkY(20); doc.fillColor(MUTED).fontSize(7.5).font('Helvetica-Oblique').text(t,45,y,{width:W}); y=doc.y+4; };
    const STMT = (t) => { checkY(20); doc.fillColor(DARK).fontSize(8).font('Helvetica').text(t,45,y,{width:W}); y=doc.y+4; };
    const QA = (q,a) => {
      checkY(14);
      const aStr = (a && typeof a === 'string' && a.trim()) ? a.trim() : (a ? String(a) : '---');
      const sy=y;
      doc.fillColor(MUTED).fontSize(8).font('Helvetica-Bold').text(q,45,y,{width:210});
      const qh=doc.y-sy;
      doc.fillColor(DARK).fontSize(8).font('Helvetica').text(aStr,265,sy,{width:W-220});
      const ah=doc.y-sy; y=sy+Math.max(qh,ah)+3;
    };
    const CHECK = (label, isChecked) => {
      checkY(14);
      const prefix = isChecked ? '[X]' : '[ ]';
      const sy = y;
      doc.fillColor(isChecked ? ORANGE : MUTED).fontSize(8).font('Helvetica-Bold').text(prefix,52,y,{width:28});
      doc.fillColor(isChecked ? DARK : MUTED).fontSize(8).font(isChecked ? 'Helvetica-Bold' : 'Helvetica').text(label,80,sy,{width:W-35});
      y=doc.y+3;
    };
    const DIV = () => { checkY(6); doc.rect(45,y,W,0.5).fill('#e8d5be'); y+=6; };

    // ── Title ─────────────────────────────────────────────────────────────────
    doc.fillColor(ORANGE).fontSize(16).font('Helvetica-Bold').text('Divine Kids — Payment Information', 45, y, {width:W});
    y = doc.y + 2;
    doc.fillColor(MUTED).fontSize(8).font('Helvetica').text('Complete your enrollment by submitting your payment details below.', 45, y, {width:W});
    y = doc.y + 2;
    doc.fillColor(MUTED).fontSize(8).font('Helvetica').text('Submitted: '+new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}), 45, y, {width:W});
    y = doc.y + 8;
    doc.rect(45,y,W,1).fill('#e0cdb8'); y+=8;

    // ── Section 15 ────────────────────────────────────────────────────────────
    SH('Section 15 — Payment Information');

    // Notice box text
    doc.rect(45,y,W,1).fill('#e8720c'); y+=2;
    STMT("Please refer to the Parent's Handbook on the Important Forms & Documents page for admission and weekly fee structure. Admission priority will be given to the child whose admission fee and first week fee has been received by the center.");
    doc.rect(45,y,W,1).fill('#e8720c'); y+=6;

    DIV();
    QA("Child's Full Name", d.paymentChildName);
    QA('Parent / Guardian Name', d.payerName);
    QA('Email Address', d.payerEmail);
    DIV();

    // Zelle section
    STMT('Pay the fee through Zelle');
    NOTE('Scan the QR code below with your banking app to send payment via Zelle. (QR code displayed on the payment page)');
    DIV();

    // Payment options
    STMT('Select all that apply:');
    y += 4;
    CHECK('1. Admission fee has been paid through Zelle and confirmation is attached.', d.payAdmissionZelle === 'yes');
    QA('   Zelle Confirmation Attached', d.admissionZelleFile ? 'Yes (see attachment)' : '---');
    y += 2;
    CHECK('2. First week fee has been paid through Zelle and confirmation is attached.', d.payFirstWeekZelle === 'yes');
    QA('   Zelle Confirmation Attached', d.firstWeekZelleFile ? 'Yes (see attachment)' : '---');
    y += 2;
    CHECK('3. Admission fee has been paid through cash.', d.payAdmissionCash === 'yes');
    y += 2;
    CHECK('4. First week fee has been paid through cash.', d.payFirstWeekCash === 'yes');

    // ── Footer ────────────────────────────────────────────────────────────────
    const pages = doc.bufferedPageRange();
    for (let i=0; i<pages.count; i++) {
      doc.switchToPage(pages.start+i);
      doc.fillColor(MUTED).fontSize(7).font('Helvetica')
         .text('Divine Kids — Payment Information  |  Page '+(i+1)+' of '+pages.count,
               45, doc.page.height-28, {width:W, align:'center'});
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
