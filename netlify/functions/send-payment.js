const nodemailer = require('nodemailer');

const CENTER_EMAIL = 'Divinekids4soul@gmail.com';

function val(v) { return v || '—'; }

function row(label, value) {
  return `<tr>
    <td style="padding:5px 12px;font-weight:600;color:#555;width:220px;vertical-align:top;font-size:12px;">${label}</td>
    <td style="padding:5px 12px;color:#222;font-size:12px;">${val(value)}</td>
  </tr>`;
}

function sec(title, rows) {
  return `
    <tr><td colspan="2" style="background:#e8720c;color:#fff;font-weight:700;font-size:12px;padding:7px 12px;">${title}</td></tr>
    ${rows}
    <tr><td colspan="2" style="padding:3px;"></td></tr>`;
}

function buildEnrollmentRows(d) {
  const checks = (...keys) => keys.filter(k => d[k]).map(k => d[k]).join(', ') || '—';
  const transport = [d.transportEmergency, d.transportFieldTrips, d.transportSchool].filter(Boolean).join(', ') || '—';
  const waterActs = [d.waterTablePlay, d.waterSprinkler, d.waterWading, d.waterSwimming, d.waterAquatic].filter(Boolean).join(', ') || '—';
  const meals = [d.mealNone&&'None', d.mealBreakfast&&'Breakfast', d.mealMorningSnack&&'Morning snack',
    d.mealLunch&&'Lunch', d.mealAfternoonSnack&&'Afternoon snack', d.mealSupper&&'Supper', d.mealEveningSnack&&'Evening snack'
  ].filter(Boolean).join(', ') || '—';
  const schedule = ['mon','tue','wed','thu','fri','sat','sun'].map(day => {
    const am = d[day+'AM'], pm = d[day+'PM'];
    return (am||pm) ? `${day.charAt(0).toUpperCase()+day.slice(1)}: ${am||'—'} – ${pm||'—'}` : null;
  }).filter(Boolean).join(' | ') || '—';

  return `
    ${sec("Section 1 — General Information", `
      ${row('Child Name', d.childFullName)}
      ${row('Date of Birth', d.childDOB)}
      ${row('Child Lives With', d.childLivesWith)}
      ${row('Child Address', d.childAddress)}
      ${row('Date of Admission', d.dateAdmission)}
      ${row('Custody Docs on File', d.custodyDocs)}
    `)}
    ${sec("Parent / Guardian 1", `
      ${row('Name', d.parent1Name)}
      ${row('Email', d.parent1Email)}
      ${row('Phone', d.parent1Phone)}
      ${row('Employer', d.parent1Employer)}
      ${row('Address', d.parent1Address)}
    `)}
    ${sec("Parent / Guardian 2", `
      ${row('Name', d.parent2Name)}
      ${row('Email', d.parent2Email)}
      ${row('Phone', d.parent2Phone)}
      ${row('Employer', d.parent2Employer)}
    `)}
    ${sec("Emergency Contact", `
      ${row('Name', d.ec1Name)}
      ${row('Relationship', d.ec1Relation)}
      ${row('Phone', d.ec1Phone)}
      ${row('Address', d.ec1Address)}
    `)}
    ${sec("Authorized Release Persons", `
      ${row('Person 1', d.pu1Name ? `${d.pu1Name} — ${val(d.pu1Phone)}` : '—')}
      ${row('Person 2', d.pu2Name ? `${d.pu2Name} — ${val(d.pu2Phone)}` : '—')}
      ${row('Person 3', d.pu3Name ? `${d.pu3Name} — ${val(d.pu3Phone)}` : '—')}
    `)}
    ${sec("Medical Insurance", `
      ${row('Card Attached', d.insuranceCardAttached)}
      ${row('Insurance Company', d.insuranceCompany)}
      ${row('Policy / Member ID', d.insurancePolicyNum)}
      ${row('Policy Holder', d.insuranceHolder)}
      ${row('Insurance Phone', d.insurancePhone)}
    `)}
    ${sec("Section 2 — Consent", `
      ${row('Transportation', transport)}
      ${row('Field Trips', d.fieldTrips)}
      ${row('Water Activities', waterActs)}
      ${row('Competent Swimmer', d.competentSwimmer)}
      ${row('Swimming Risk', d.swimmingRisk)}
      ${row('Meals', meals)}
      ${row('Schedule', schedule)}
      ${row('Food Allergies', d.foodAllergies)}
    `)}
    ${sec("Section 3 — Emergency Medical", `
      ${row('Physician', d.physicianName)}
      ${row('Physician Phone', d.physicianPhone)}
      ${row('Physician Address', d.physicianAddress)}
      ${row('Emergency Facility', d.emergencyFacilityName)}
      ${row('Facility Phone', d.emergencyFacilityPhone)}
      ${row('Emergency Med Consent', d.emergencyMedConsent === 'on' ? 'Yes' : 'No')}
    `)}
    ${sec("Section 5 — Vision", `
      ${row('Right Eye 20/', d.visionRightEye)}
      ${row('Left Eye 20/', d.visionLeftEye)}
      ${row('Result', d.visionResult)}
    `)}
    ${sec("Section 6 — Hearing", `
      ${row('Right Ear Result', d.hearingRightResult)}
      ${row('Left Ear Result', d.hearingLeftResult)}
    `)}
    ${sec("Section 7 — Admission", `
      ${row('Selection', d.admissionReq)}
    `)}
    ${sec("Section 9 — Vaccination Records", `
      ${row('Records', d.vaccinationRecords === 'attached' ? 'Attached' : 'Will provide on first day')}
    `)}
    ${sec("Photo & Media Consent", `
      ${row('Consent', d.photoConsent)}
    `)}
    ${sec("Acknowledgment", `
      ${row('Handbook Acknowledged', d.handbookAck === 'on' ? 'Yes' : 'No')}
      ${row('Electronically Signed By', d.signerName)}
      ${row('Date Signed', d.sigDate)}
    `)}`;
}

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
  const enrollment = body.enrollmentData || {};

  const paymentOptions = [
    body.payAdmissionZelle === 'yes' && '✅ Admission fee paid via Zelle (confirmation attached)',
    body.payFirstWeekZelle === 'yes' && '✅ First week fee paid via Zelle (confirmation attached)',
    body.payAdmissionCash  === 'yes' && '✅ Admission fee paid in cash',
    body.payFirstWeekCash  === 'yes' && '✅ First week fee paid in cash',
  ].filter(Boolean).join('<br/>') || '—';

  // Build attachments
  const attachments = [];
  const fileFields = {
    admissionZelleFile:     'Admission-Fee-Zelle-Confirmation',
    firstWeekZelleFile:     'First-Week-Fee-Zelle-Confirmation',
    insuranceCardFile:      'Insurance-Card',
    affidavitFile:          'Affidavit',
    admissionDocFile:       'Admission-Document',
    vaccinationRecordsFile: 'Vaccination-Records',
  };
  // Files may be on the payment body or nested inside enrollmentData
  const allData = { ...enrollment, ...body };
  for (const [field, label] of Object.entries(fileFields)) {
    const f = allData[field];
    if (f && f.data) {
      attachments.push({
        filename:    f.name || `${label}.pdf`,
        content:     Buffer.from(f.data, 'base64'),
        contentType: f.type || 'application/octet-stream',
      });
    }
  }

  const enrollmentRows = Object.keys(enrollment).length > 0
    ? buildEnrollmentRows(enrollment)
    : `<tr><td colspan="2" style="padding:12px;color:#888;font-size:12px;">Enrollment data not available.</td></tr>`;

  const htmlEmail = `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;color:#222;">
      <div style="background:#e8720c;padding:22px 28px;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Divine Kids — Enrollment &amp; Payment</h1>
        <p style="color:rgba(255,255,255,.85);margin:4px 0 0;font-size:12px;">Complete submission for ${childName}</p>
      </div>
      <div style="background:#fff;border:1px solid #f0d9c0;border-top:none;padding:20px 28px;">
        <p>The enrollment form and payment information have been submitted for <strong>${childName}</strong>.</p>
        ${attachments.length ? `<p style="font-size:.85rem;color:#555;">📎 ${attachments.length} file(s) attached.</p>` : ''}
      </div>

      <table style="width:100%;border-collapse:collapse;border:1px solid #f0d9c0;border-top:none;">
        <tr><td colspan="2" style="background:#2a1f0e;color:#fff;font-weight:700;font-size:13px;padding:9px 12px;">ENROLLMENT FORM DETAILS</td></tr>
        ${enrollmentRows}

        <tr><td colspan="2" style="background:#2a1f0e;color:#fff;font-weight:700;font-size:13px;padding:9px 12px;">PAYMENT INFORMATION</td></tr>
        ${sec("Section 15 — Payment", `
          ${row('Child Name', childName)}
          ${row('Parent / Guardian', payerName)}
          ${row('Email', payerEmail)}
          ${row('Payment Options', paymentOptions)}
        `)}
      </table>

      <div style="background:#fff8f0;border:1px solid #f0d9c0;border-top:none;padding:14px 28px;border-radius:0 0 8px 8px;font-size:11px;color:#7a5c3a;">
        <em>By submitting, the parent/guardian acknowledged reading and agreeing to the Center's parent handbook and all operational policies.</em>
      </div>
    </div>`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const mailOptions = {
    from:        `"Divine Kids" <${process.env.SMTP_USER}>`,
    subject:     `Enrollment & Payment — ${childName}`,
    html:        htmlEmail,
    attachments,
  };

  try {
    // Same email to both Divine Kids and the parent
    await transporter.sendMail({ ...mailOptions, to: CENTER_EMAIL });
    if (payerEmail) {
      await transporter.sendMail({ ...mailOptions, to: payerEmail });
    }
  } catch (err) {
    console.error('Email error:', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to send email' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };
};
