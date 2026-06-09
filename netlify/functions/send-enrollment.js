const nodemailer = require('nodemailer');

const CENTER_EMAIL = 'Divinekids4soul@gmail.com';

function val(v) { return v || '—'; }

function checks(d, keys) {
  const selected = keys.filter(k => d[k]).map(k => d[k]);
  return selected.length ? selected.join(', ') : '—';
}

function buildHtml(d, isCenter) {
  const childName = val(d.childFullName);

  const row = (label, value) =>
    `<tr><td style="padding:5px 12px;font-weight:600;color:#555;width:220px;vertical-align:top;font-size:12px;">${label}</td><td style="padding:5px 12px;color:#222;font-size:12px;">${val(value)}</td></tr>`;

  const sec = (title, rows) => `
    <tr><td colspan="2" style="background:#e8720c;color:#fff;font-weight:700;font-size:12px;padding:7px 12px;">${title}</td></tr>
    ${rows}
    <tr><td colspan="2" style="padding:3px;"></td></tr>`;

  const transport = [
    d.transportEmergency, d.transportFieldTrips, d.transportHome, d.transportSchool
  ].filter(Boolean).join(', ') || '—';

  const waterActs = [
    d.waterTablePlay, d.waterSprinkler, d.waterWading, d.waterSwimming, d.waterAquatic
  ].filter(Boolean).join(', ') || '—';

  const meals = [
    d.mealNone && 'None', d.mealBreakfast && 'Breakfast', d.mealMorningSnack && 'Morning snack',
    d.mealLunch && 'Lunch', d.mealAfternoonSnack && 'Afternoon snack',
    d.mealSupper && 'Supper', d.mealEveningSnack && 'Evening snack'
  ].filter(Boolean).join(', ') || '—';

  const schedule = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => {
    const am = d[`${day.toLowerCase()}AM`];
    const pm = d[`${day.toLowerCase()}PM`];
    return (am || pm) ? `${day}: ${am||'—'} – ${pm||'—'}` : null;
  }).filter(Boolean).join(' | ') || '—';

  const policies = [
    d.policyDiscipline && 'Discipline & guidance',
    d.policyRelease && 'Release of children',
    d.policySuspension && 'Suspension/expulsion',
    d.policyIllness && 'Illness/exclusion',
    d.policyEmergency && 'Emergency plans',
    d.policyMedications && 'Dispensing medications',
    d.policyHealthChecks && 'Health checks',
    d.policyImmunization && 'Immunization requirements',
    d.policySafeSleep && 'Safe sleep',
    d.policyMeals && 'Meals/food service',
    d.policyDiscussConcerns && 'Parent concerns',
    d.policyVisitCenter && 'Visit center',
    d.policyParticipate && 'Parent participation',
    d.policyInclusive && 'Inclusive services',
    d.policyPhysicalActivity && 'Physical activity',
    d.policyCCR && 'CCR/DFPS contacts'
  ].filter(Boolean).join(', ') || '—';

  const specialNeeds = [
    d.needEnvAllergies && 'Environmental allergies',
    d.needActivityLimits && 'Activity limitations',
    d.needFoodIntolerance && 'Food intolerances',
    d.needAccommodations && 'Accommodations/modifications',
    d.needExistingIllness && 'Existing illness',
    d.needAdaptiveEquip && 'Adaptive equipment',
    d.needPreviousIllness && 'Previous serious illness',
    d.needComplications && 'Complications',
    d.needInjuries && 'Injuries/hospitalizations',
    d.needMedications && 'Long-term medications',
    d.specialNeedsOther
  ].filter(Boolean).join(', ') || '—';

  const vaccines = [
    ['Hepatitis B', [d.hepB1, d.hepB2, d.hepB3]],
    ['Rotavirus', [d.rota1, d.rota2, d.rota3]],
    ['DTaP', [d.dtap1, d.dtap2, d.dtap3, d.dtap4, d.dtap5]],
    ['Hib', [d.hib1, d.hib2, d.hib3, d.hib4]],
    ['Pneumococcal', [d.pcv1, d.pcv2, d.pcv3, d.pcv4]],
    ['Poliovirus', [d.ipv1, d.ipv2, d.ipv3, d.ipv4]],
    ['Influenza', [d.flu1, d.flu2]],
    ['MMR', [d.mmr1, d.mmr2]],
    ['Varicella', [d.var1, d.var2]],
    ['Hepatitis A', [d.hepA1, d.hepA2]],
  ].map(([name, dates]) => {
    const filled = dates.filter(Boolean);
    return filled.length ? row(name, filled.join(', ')) : '';
  }).join('');

  const tableRows = `
    ${sec("Section 1 — General Information", `
      ${row('Child Name', childName)}
      ${row('Date of Birth', d.childDOB)}
      ${row('Child Lives With', d.childLivesWith)}
      ${row('Child Address', d.childAddress)}
      ${row('Date of Admission', d.dateAdmission)}
      ${row('Date of Withdrawal', d.dateWithdrawal)}
      ${row('Custody Docs on File', d.custodyDocs)}
    `)}
    ${sec("Parent / Guardian 1", `
      ${row('Name', d.parent1Name)}
      ${row('Address', d.parent1Address)}
      ${row('Email', d.parent1Email)}
      ${row('Phone', d.parent1Phone)}
      ${row('Employer', d.parent1Employer)}
    `)}
    ${sec("Parent / Guardian 2", `
      ${row('Name', d.parent2Name)}
      ${row('Address', d.parent2Address)}
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
    ${sec("Section 1A — Medical Insurance", `
      ${row('Card Attached', d.insuranceCardAttached)}
      ${row('Insurance Company', d.insuranceCompany)}
      ${row('Policy / Member ID', d.insurancePolicyNum)}
      ${row('Policy Holder', d.insuranceHolder)}
      ${row('Insurance Phone', d.insurancePhone)}
    `)}
    ${sec("Section 2 — Consent: Transportation", `${row('Consents', transport)}`)}
    ${sec("Section 2 — Consent: Field Trips", `
      ${row('Decision', d.fieldTrips)}
      ${row('Comments', d.fieldTripsComments)}
    `)}
    ${sec("Section 2 — Consent: Water Activities", `
      ${row('Activities', waterActs)}
      ${row('Competent Swimmer', d.competentSwimmer)}
      ${row('Swimming Risk Condition', d.swimmingRisk)}
    `)}
    ${sec("Section 2 — Operational Policies Acknowledged", `${row('Policies', policies)}`)}
    ${sec("Section 2 — Meals", `${row('Meals', meals)}`)}
    ${sec("Section 2 — Schedule", `${row('Days & Times', schedule)}`)}
    ${sec("Section 2 — Special Care Needs", `
      ${row('Needs', specialNeeds)}
      ${row('Explanation', d.specialNeedsExplain)}
      ${row('Diagnosed Food Allergies', d.foodAllergies)}
      ${row('Food Allergy Plan Date', d.foodAllergyPlanDate)}
    `)}
    ${sec("Section 2 — School-Age", `
      ${row('School Name', d.schoolName)}
      ${row('School Phone', d.schoolPhone)}
      ${row('Pick-up Locations', d.pickupLocations)}
    `)}
    ${sec("Section 3 — Emergency Medical Authorization", `
      ${row('Physician', d.physicianName)}
      ${row('Physician Phone', d.physicianPhone)}
      ${row('Physician Address', d.physicianAddress)}
      ${row('Emergency Facility', d.emergencyFacilityName)}
      ${row('Facility Phone', d.emergencyFacilityPhone)}
      ${row('Facility Address', d.emergencyFacilityAddress)}
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
    ${sec("Section 7 — Admission Requirement", `${row('Selection', d.admissionReq)}`)}
    ${vaccines ? sec("Section 8 — Vaccine Information", vaccines) : ''}
    ${sec("Photo & Media Consent", `${row('Consent', d.photoConsent)}`)}
    ${sec("Acknowledgment & Signature", `
      ${row('Handbook Acknowledged', d.handbookAck === 'on' ? 'Yes' : 'No')}
      ${row('Signed By', d.signerName)}
      ${row('Date Signed', d.sigDate)}
    `)}
  `;

  const greeting = isCenter
    ? `<p>A new enrollment form has been submitted for <strong>${childName}</strong>. Full details below.</p>`
    : `<p>Dear ${val(d.parent1Name ? d.parent1Name.split(' ')[0] : '')},</p>
       <p>Thank you for completing the enrollment form for <strong>${childName}</strong>. We have received your submission and our team will be in touch soon.</p>
       <p>A copy of your completed form is included below for your records.</p>`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;color:#222;">
      <div style="background:#e8720c;padding:22px 28px;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Divine Kids</h1>
        <p style="color:rgba(255,255,255,.85);margin:4px 0 0;font-size:12px;">Enrollment Form Submission</p>
      </div>
      <div style="background:#fff;border:1px solid #f0d9c0;border-top:none;padding:20px 28px;">
        ${greeting}
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #f0d9c0;border-top:none;">
        ${tableRows}
      </table>
      <div style="background:#fff8f0;border:1px solid #f0d9c0;border-top:none;padding:14px 28px;border-radius:0 0 8px 8px;font-size:11px;color:#7a5c3a;">
        <em>By signing, the parent/guardian acknowledged reading and agreeing to the Center's parent handbook and all operational policies.</em>
      </div>
    </div>`;
}

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

  const parentEmail = data.parent1Email;
  if (!parentEmail) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Parent email is required' }) };
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

  const childName = val(data.childFullName);
  const subject = `Enrollment Form — ${childName}`;

  // Build file attachments from base64 fields
  const fileFieldLabels = {
    insuranceCardFile:      'Insurance Card',
    affidavitFile:          'Affidavit',
    admissionDocFile:       'Admission Document',
    vaccinationRecordsFile: 'Vaccination Records',
  };
  const attachments = [];
  for (const [field, label] of Object.entries(fileFieldLabels)) {
    const f = data[field];
    if (f && f.data) {
      attachments.push({
        filename: f.name || `${label}.pdf`,
        content:  Buffer.from(f.data, 'base64'),
        contentType: f.type || 'application/octet-stream',
      });
    }
  }

  const mailBase = {
    from: `"Divine Kids" <${process.env.SMTP_USER}>`,
    subject,
    attachments,
  };

  try {
    // Only email the parent — Divine Kids will receive one combined email after payment is submitted
    await transporter.sendMail({ ...mailBase, to: parentEmail, html: buildHtml(data, false) });
  } catch (err) {
    console.error('Email send error:', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to send email' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };
};
