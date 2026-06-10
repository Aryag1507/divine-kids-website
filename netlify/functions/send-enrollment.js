const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const CENTER_EMAIL = 'Divinekids4soul@gmail.com';

function v(val) { return (val && String(val).trim()) || '—'; }
function checked(val) { return val === 'on' || val === 'yes' || val === true ? 'Yes' : 'No'; }

// ── Build comprehensive PDF ──────────────────────────────────────────────────
function buildPdf(d) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 45, size: 'letter', bufferPages: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width - 90;
    const ORANGE = '#e8720c';
    const DARK   = '#2a1f0e';
    const MUTED  = '#7a5c3a';
    const LGRAY  = '#f5f0ea';
    let y = 45;

    const checkY = (needed = 40) => {
      if (y + needed > doc.page.height - 45) { doc.addPage(); y = 45; }
    };

    const title = (text) => {
      checkY(30);
      doc.fillColor(ORANGE).fontSize(18).font('Helvetica-Bold').text(text, 45, y);
      y = doc.y + 4;
    };

    const subtitle = (text) => {
      checkY(16);
      doc.fillColor(MUTED).fontSize(9).font('Helvetica').text(text, 45, y);
      y = doc.y + 8;
    };

    const sectionHeader = (text) => {
      checkY(26);
      doc.rect(45, y, W, 20).fill(ORANGE);
      doc.fillColor('#fff').fontSize(10).font('Helvetica-Bold').text(text, 51, y + 5, { width: W - 10 });
      y += 24;
    };

    const subHeader = (text) => {
      checkY(18);
      doc.rect(45, y, W, 16).fill(LGRAY);
      doc.fillColor(DARK).fontSize(9.5).font('Helvetica-Bold').text(text, 51, y + 3, { width: W - 10 });
      y += 20;
    };

    const field = (question, answer, indent = 0) => {
      const qWidth = 200 - indent;
      const aX = 45 + indent + qWidth + 6;
      const aWidth = W - qWidth - 6 - indent;
      checkY(16);
      const startY = y;
      doc.fillColor(MUTED).fontSize(8.5).font('Helvetica-Bold')
         .text(question, 45 + indent, y, { width: qWidth });
      const qH = doc.y - startY;
      doc.fillColor(DARK).fontSize(8.5).font('Helvetica')
         .text(v(answer), aX, startY, { width: aWidth });
      const aH = doc.y - startY;
      y = startY + Math.max(qH, aH) + 4;
    };

    const multiCheck = (question, items) => {
      checkY(14);
      doc.fillColor(MUTED).fontSize(8.5).font('Helvetica-Bold').text(question, 45, y);
      y = doc.y + 2;
      const selected = items.filter(i => i.val).map(i => i.label);
      doc.fillColor(DARK).fontSize(8.5).font('Helvetica')
         .text(selected.length ? selected.join(', ') : '—', 45, y, { width: W });
      y = doc.y + 4;
    };

    const note = (text) => {
      checkY(20);
      doc.rect(45, y, W, 1).fill('#e0cdb8');
      y += 5;
      doc.fillColor(MUTED).fontSize(7.5).font('Helvetica-Oblique').text(text, 45, y, { width: W });
      y = doc.y + 6;
    };

    const divider = () => {
      checkY(10);
      doc.rect(45, y, W, 0.5).fill('#e0cdb8');
      y += 8;
    };

    // ── Cover ─────────────────────────────────────────────────────────────────
    title('Divine Kids — Child Enrollment Form');
    subtitle(`Submitted: ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}`);
    divider();

    // ── Section 1 ─────────────────────────────────────────────────────────────
    sectionHeader('Section 1 — General Information');
    field("Operation's Name", d.operationName || 'Divine Kids');
    field("Child's Full Name", d.childFullName);
    field("Child's Date of Birth", d.childDOB);
    field('Child Lives With', d.childLivesWith);
    field("Child's Home Address", d.childAddress);
    field('Date of Admission', d.dateAdmission);
    field('Date of Withdrawal', d.dateWithdrawal);

    subHeader('Parent or Guardian 1');
    field('Name', d.parent1Name);
    field('Email', d.parent1Email);
    field('Phone', d.parent1Phone);
    field('Employer', d.parent1Employer);
    field('Address (if different)', d.parent1Address);

    subHeader('Parent or Guardian 2');
    field('Name', d.parent2Name);
    field('Email', d.parent2Email);
    field('Phone', d.parent2Phone);
    field('Employer', d.parent2Employer);
    field('Address (if different)', d.parent2Address);

    field('Parent 2 Phone', d.parent2Phone);
    field("Guardian's Phone", d.guardianPhone);
    field('Custody Documents on File', v(d.custodyDocs));

    subHeader('Emergency Contact (when parent/guardian cannot be reached)');
    field('Name', d.ec1Name);
    field('Relationship', d.ec1Relation);
    field('Phone', d.ec1Phone);
    field('Address', d.ec1Address);

    subHeader('Authorized Persons to Pick the Child');
    note('Children will only be released to a parent/guardian or designated person after verification of ID.');
    field('Person 1', d.pu1Name ? `${v(d.pu1Name)} — ${v(d.pu1Phone)}` : '—');
    field('Person 2', d.pu2Name ? `${v(d.pu2Name)} — ${v(d.pu2Phone)}` : '—');
    field('Person 3', d.pu3Name ? `${v(d.pu3Name)} — ${v(d.pu3Phone)}` : '—');

    // ── Section 2 ─────────────────────────────────────────────────────────────
    sectionHeader('Section 2 — Consent Information');

    subHeader('1. Transportation');
    note('I give consent for my child to be transported and supervised by the operation\'s employees.');
    multiCheck('Consent given for:', [
      { label: 'For emergency care',      val: d.transportEmergency },
      { label: 'On field trips',          val: d.transportFieldTrips },
      { label: 'To and from school',      val: d.transportSchool },
    ]);

    subHeader('2. Field Trips');
    field('Decision', d.fieldTrips);
    field('Comments', d.fieldTripsComments);

    subHeader('3. Water Activities');
    multiCheck('Activities consented to:', [
      { label: 'Water table play',   val: d.waterTablePlay },
      { label: 'Sprinkler play',     val: d.waterSprinkler },
      { label: 'Wading pools',       val: d.waterWading },
      { label: 'Swimming pools',     val: d.waterSwimming },
      { label: 'Aquatic playgrounds',val: d.waterAquatic },
    ]);
    field('Is your child a competent swimmer?', d.competentSwimmer);
    field('Does your child have any physical/health/behavioral condition that would put them at risk while swimming?', d.swimmingRisk);

    subHeader('4. Receipt of Written Operational Policies');
    note('Parent acknowledges receipt of the facility\'s operational policies for the following:');
    multiCheck('Policies acknowledged:', [
      { label: 'Discipline and guidance',             val: d.policyDiscipline },
      { label: 'Procedures for release of children',  val: d.policyRelease },
      { label: 'Suspension and expulsion',             val: d.policySuspension },
      { label: 'Illness and exclusion criteria',       val: d.policyIllness },
      { label: 'Emergency plans',                      val: d.policyEmergency },
      { label: 'Dispensing medications',               val: d.policyMedications },
      { label: 'Conducting health checks',             val: d.policyHealthChecks },
      { label: 'Immunization requirements',            val: d.policyImmunization },
      { label: 'Safe sleep',                           val: d.policySafeSleep },
      { label: 'Meals and food service',               val: d.policyMeals },
      { label: 'Parents discuss concerns with director', val: d.policyDiscussConcerns },
      { label: 'Visit center without prior approval',  val: d.policyVisitCenter },
      { label: 'Parent participation in activities',   val: d.policyParticipate },
      { label: 'Supporting inclusive services',        val: d.policyInclusive },
      { label: 'Indoor/outdoor physical activity',     val: d.policyPhysicalActivity },
      { label: 'CCR/DFPS/Child Abuse Hotline contacts',val: d.policyCCR },
    ]);

    subHeader('5. Meals');
    multiCheck('Meals to be served:', [
      { label: 'None',           val: d.mealNone },
      { label: 'Breakfast',      val: d.mealBreakfast },
      { label: 'Morning snack',  val: d.mealMorningSnack },
      { label: 'Lunch',          val: d.mealLunch },
      { label: 'Afternoon snack',val: d.mealAfternoonSnack },
      { label: 'Supper',         val: d.mealSupper },
      { label: 'Evening snack',  val: d.mealEveningSnack },
    ]);

    subHeader('6. Days and Times in Care');
    const days = [
      ['Monday', d.monAM, d.monPM], ['Tuesday', d.tueAM, d.tuePM],
      ['Wednesday', d.wedAM, d.wedPM], ['Thursday', d.thuAM, d.thuPM],
      ['Friday', d.friAM, d.friPM], ['Saturday', d.satAM, d.satPM],
      ['Sunday', d.sunAM, d.sunPM],
    ];
    days.forEach(([day, am, pm]) => {
      if (am || pm) field(day, `AM: ${v(am)}  |  PM: ${v(pm)}`);
    });

    subHeader('7. Receipt of Parent\'s Rights');
    field('Acknowledged', checked(d.parentRightsAck));

    subHeader('8. Child\'s Special Care Needs');
    multiCheck('Needs checked:', [
      { label: 'Environmental allergies',       val: d.needEnvAllergies },
      { label: 'Food intolerances',             val: d.needFoodIntolerance },
      { label: 'Existing illness',              val: d.needExistingIllness },
      { label: 'Previous serious illness',      val: d.needPreviousIllness },
      { label: 'Injuries/hospitalizations',     val: d.needInjuries },
      { label: 'Activity limitations',          val: d.needActivityLimits },
      { label: 'Accommodations/modifications',  val: d.needAccommodations },
      { label: 'Adaptive equipment',            val: d.needAdaptiveEquip },
      { label: 'Symptoms/complications',        val: d.needComplications },
      { label: 'Long-term medications',         val: d.needMedications },
    ]);
    field('Other needs', d.specialNeedsOther);
    field('Explanation', d.specialNeedsExplain);
    field('Diagnosed food allergies?', d.foodAllergies);

    subHeader('9. School-Age Children');
    field('School Name', d.schoolName);
    field('School Phone', d.schoolPhone);
    multiCheck('Permissions:', [
      { label: 'Walk to/from school',      val: d.permWalkHome },
      { label: 'Ride a bus',               val: d.permRideBus },
      { label: 'Release to sibling (<18)', val: d.permSiblingRelease },
    ]);
    field('Authorized pick-up/drop-off locations', d.pickupLocations);

    // ── Section 3 ─────────────────────────────────────────────────────────────
    sectionHeader('Section 3 — Authorization For Emergency Medical Attention');
    note('In the event I cannot be reached, I authorize the person in charge to take my child to:');
    field('Physician Name', d.physicianName);
    field('Physician Phone', d.physicianPhone);
    field('Physician Address', d.physicianAddress);
    field('Emergency Care Facility', d.emergencyFacilityName);
    field('Facility Phone', d.emergencyFacilityPhone);
    field('Facility Address', d.emergencyFacilityAddress);
    field('Consent to secure emergency medical care', checked(d.emergencyMedConsent));
    field('Parent/Guardian Name (Sec. 3)', d.nameSec3);
    field('Date', d.sigSec3Date);

    // ── Section 3B ────────────────────────────────────────────────────────────
    sectionHeader('Section 3B — Child\'s Medical Insurance Information');
    note('The Center does not carry liability insurance; therefore, child\'s medical insurance is required for emergencies.');
    field('Insurance Card Attached', v(d.insuranceCardAttached));
    field('Insurance Company', d.insuranceCompany);
    field('Policy / Member ID', d.insurancePolicyNum);
    field('Policy Holder', d.insuranceHolder);
    field('Insurance Phone', d.insurancePhone);

    // ── Section 4 ─────────────────────────────────────────────────────────────
    sectionHeader('Section 4 — Requirements for Exclusion from Compliance');
    field('Selection', d.exclusionCompliance === 'immunization_affidavit'
      ? 'Affidavit declining immunizations attached'
      : d.exclusionCompliance === 'vision_hearing_affidavit'
      ? 'Affidavit re: vision/hearing screening conflict attached'
      : '—');

    // ── Section 5 ─────────────────────────────────────────────────────────────
    sectionHeader('Section 5 — Vision Exam Results');
    field('Right Eye 20/', d.visionRightEye);
    field('Left Eye 20/', d.visionLeftEye);
    field('Result', d.visionResult);
    field('Printed Name', d.nameVision);
    field('Date', d.sigVisionDate);

    // ── Section 6 ─────────────────────────────────────────────────────────────
    sectionHeader('Section 6 — Hearing Exam Results');
    field('Right Ear Result', d.hearingRightResult);
    field('Left Ear Result', d.hearingLeftResult);
    field('Printed Name', d.nameHearing);
    field('Date', d.sigHearingDate);

    // ── Section 7 ─────────────────────────────────────────────────────────────
    sectionHeader('Section 7 — Admission Requirement');
    const admMap = {
      signed_copy_attached: 'Signed copy of healthcare professional statement is attached',
      religious_conflict:   'Religious conflict affidavit attached',
      within_12_months:     'Child examined within past year; statement to be submitted within 12 months',
    };
    field('Selection', admMap[d.admissionReq] || v(d.admissionReq));
    field('Parent/Guardian Name (Sec. 7)', d.nameSec7Parent);
    field('Date', d.sigSec7ParentDate);

    // ── Section 9 ─────────────────────────────────────────────────────────────
    sectionHeader('Section 9 — Vaccination Records');
    field('Records', d.vaccinationRecords === 'attached' ? 'Attached' : 'Will provide on first day');

    // ── Section 10 ────────────────────────────────────────────────────────────
    sectionHeader('Section 10 — Varicella for Chickenpox');
    field('Chickenpox disease date (if applicable)', d.chickenpoxDate);
    field('Printed Name', d.nameVaricella);
    field('Date', d.sigVaricellaDate);

    // ── Section 11 ────────────────────────────────────────────────────────────
    sectionHeader('Section 11 — Additional Information About Immunizations');
    field('Reference', 'www.dshs.state.tx.us/immunize/public.shtm');

    // ── Section 12 ────────────────────────────────────────────────────────────
    sectionHeader('Section 12 — Gang Free Zone');
    note('Under Texas Penal Code, any area within 1,000 feet of a child care center is a gang-free zone.');

    // ── Photo Consent ─────────────────────────────────────────────────────────
    sectionHeader('Photo & Media Consent');
    note('Center activities may be photographed/video-recorded. Parent consent for child to appear in digital and printed media.');
    field('Consent', v(d.photoConsent));

    // ── Section 14 ────────────────────────────────────────────────────────────
    sectionHeader('Section 14 — Acknowledgment & Electronic Signature');
    note('By typing their full name, the parent/guardian electronically signed this form, acknowledging they have read and agree to the Center\'s parent handbook and all operational policies.');
    field('Handbook Acknowledged', checked(d.handbookAck));
    field('Electronic Signature (Full Name)', d.signerName);
    field('Date Signed', d.sigDate);

    // ── Footer ────────────────────────────────────────────────────────────────
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(pages.start + i);
      doc.fillColor(MUTED).fontSize(7.5).font('Helvetica')
         .text(`Divine Kids — Child Enrollment Form  |  Page ${i + 1} of ${pages.count}`,
               45, doc.page.height - 30, { width: W, align: 'center' });
    }

    doc.flushPages();
    doc.end();
  });
}

// ── Build comprehensive HTML email ──────────────────────────────────────────
function buildHtml(d, isCenter) {
  const childName = v(d.childFullName);

  const row = (q, a) => `
    <tr>
      <td style="padding:5px 10px;font-weight:600;color:#555;width:220px;vertical-align:top;font-size:11px;background:#fafafa;">${q}</td>
      <td style="padding:5px 10px;color:#222;font-size:11px;">${v(a)}</td>
    </tr>`;

  const sec = (title, rows) => `
    <tr><td colspan="2" style="background:#e8720c;color:#fff;font-weight:700;font-size:11px;padding:7px 12px;">${title}</td></tr>
    ${rows}
    <tr><td colspan="2" style="height:6px;"></td></tr>`;

  const policies = [
    d.policyDiscipline && 'Discipline & guidance',
    d.policyRelease    && 'Release of children',
    d.policySuspension && 'Suspension/expulsion',
    d.policyIllness    && 'Illness/exclusion',
    d.policyEmergency  && 'Emergency plans',
    d.policyMedications && 'Dispensing medications',
    d.policyHealthChecks && 'Health checks',
    d.policyImmunization && 'Immunization requirements',
    d.policySafeSleep  && 'Safe sleep',
    d.policyMeals      && 'Meals/food service',
    d.policyDiscussConcerns && 'Parent concerns',
    d.policyVisitCenter && 'Visit center',
    d.policyParticipate && 'Parent participation',
    d.policyInclusive  && 'Inclusive services',
    d.policyPhysicalActivity && 'Physical activity',
    d.policyCCR        && 'CCR/DFPS contacts',
  ].filter(Boolean).join(', ') || '—';

  const transport = [d.transportEmergency, d.transportFieldTrips, d.transportSchool].filter(Boolean).join(', ') || '—';
  const waterActs = [d.waterTablePlay&&'Water table',d.waterSprinkler&&'Sprinkler',d.waterWading&&'Wading pools',d.waterSwimming&&'Swimming pools',d.waterAquatic&&'Aquatic'].filter(Boolean).join(', ') || '—';
  const meals = [d.mealNone&&'None',d.mealBreakfast&&'Breakfast',d.mealMorningSnack&&'Morning snack',d.mealLunch&&'Lunch',d.mealAfternoonSnack&&'Afternoon snack',d.mealSupper&&'Supper',d.mealEveningSnack&&'Evening snack'].filter(Boolean).join(', ') || '—';
  const schedDays = ['mon','tue','wed','thu','fri','sat','sun'].map(day => { const am=d[day+'AM'],pm=d[day+'PM']; return (am||pm)?`${day.charAt(0).toUpperCase()+day.slice(1)}: ${v(am)}–${v(pm)}`:null; }).filter(Boolean).join(' | ') || '—';
  const specialNeeds = [d.needEnvAllergies&&'Env. allergies',d.needFoodIntolerance&&'Food intolerance',d.needExistingIllness&&'Existing illness',d.needPreviousIllness&&'Previous illness',d.needInjuries&&'Injuries',d.needActivityLimits&&'Activity limits',d.needAccommodations&&'Accommodations',d.needAdaptiveEquip&&'Adaptive equip',d.needComplications&&'Complications',d.needMedications&&'Long-term meds'].filter(Boolean).join(', ') || '—';

  const greeting = isCenter
    ? `<p style="margin:0 0 10px;">New enrollment form submitted for <strong>${childName}</strong>. Full details below. A PDF copy is attached.</p>`
    : `<p style="margin:0 0 6px;">Dear ${v(d.parent1Name ? d.parent1Name.split(' ')[0] : 'Parent')},</p>
       <p style="margin:0 0 10px;">Thank you for submitting the enrollment form for <strong>${childName}</strong>. A complete PDF copy is attached for your records.</p>`;

  const tableRows = `
    ${sec("Section 1 — General Information", `
      ${row("Child's Full Name", d.childFullName)}
      ${row("Date of Birth", d.childDOB)}
      ${row("Child Lives With", d.childLivesWith)}
      ${row("Home Address", d.childAddress)}
      ${row("Date of Admission", d.dateAdmission)}
      ${row("Custody Docs on File", d.custodyDocs)}
    `)}
    ${sec("Parent / Guardian 1", `
      ${row("Name", d.parent1Name)}
      ${row("Email", d.parent1Email)}
      ${row("Phone", d.parent1Phone)}
      ${row("Employer", d.parent1Employer)}
      ${row("Address (if diff.)", d.parent1Address)}
    `)}
    ${sec("Parent / Guardian 2", `
      ${row("Name", d.parent2Name)}
      ${row("Email", d.parent2Email)}
      ${row("Phone", d.parent2Phone)}
      ${row("Employer", d.parent2Employer)}
    `)}
    ${sec("Emergency Contact", `
      ${row("Name", d.ec1Name)}
      ${row("Relationship", d.ec1Relation)}
      ${row("Phone", d.ec1Phone)}
      ${row("Address", d.ec1Address)}
    `)}
    ${sec("Authorized Persons to Pick the Child", `
      ${row("Person 1", d.pu1Name ? `${v(d.pu1Name)} — ${v(d.pu1Phone)}` : '—')}
      ${row("Person 2", d.pu2Name ? `${v(d.pu2Name)} — ${v(d.pu2Phone)}` : '—')}
      ${row("Person 3", d.pu3Name ? `${v(d.pu3Name)} — ${v(d.pu3Phone)}` : '—')}
    `)}
    ${sec("Section 2.1 — Transportation Consent", `${row("Consents", transport)}`)}
    ${sec("Section 2.2 — Field Trips", `
      ${row("Decision", d.fieldTrips)}
      ${row("Comments", d.fieldTripsComments)}
    `)}
    ${sec("Section 2.3 — Water Activities", `
      ${row("Activities", waterActs)}
      ${row("Competent Swimmer?", d.competentSwimmer)}
      ${row("Swimming Risk Condition?", d.swimmingRisk)}
    `)}
    ${sec("Section 2.4 — Receipt of Written Operational Policies", `
      ${row("Policies Acknowledged", policies)}
    `)}
    ${sec("Section 2.5 — Meals", `${row("Meals", meals)}`)}
    ${sec("Section 2.6 — Days & Times in Care", `${row("Schedule", schedDays)}`)}
    ${sec("Section 2.7 — Receipt of Parent's Rights", `${row("Acknowledged", checked(d.parentRightsAck))}`)}
    ${sec("Section 2.8 — Child's Special Care Needs", `
      ${row("Needs", specialNeeds)}
      ${row("Other", d.specialNeedsOther)}
      ${row("Explanation", d.specialNeedsExplain)}
      ${row("Diagnosed Food Allergies?", d.foodAllergies)}
    `)}
    ${sec("Section 2.9 — School-Age Children", `
      ${row("School", d.schoolName)}
      ${row("School Phone", d.schoolPhone)}
      ${row("Pick-up Locations", d.pickupLocations)}
    `)}
    ${sec("Section 3 — Emergency Medical Authorization", `
      ${row("Physician", d.physicianName)}
      ${row("Physician Phone", d.physicianPhone)}
      ${row("Physician Address", d.physicianAddress)}
      ${row("Emergency Facility", d.emergencyFacilityName)}
      ${row("Facility Phone", d.emergencyFacilityPhone)}
      ${row("Facility Address", d.emergencyFacilityAddress)}
      ${row("Emergency Medical Consent", checked(d.emergencyMedConsent))}
      ${row("Parent Name (Sec. 3)", d.nameSec3)}
      ${row("Date", d.sigSec3Date)}
    `)}
    ${sec("Section 3B — Medical Insurance", `
      ${row("Card Attached", d.insuranceCardAttached)}
      ${row("Company", d.insuranceCompany)}
      ${row("Policy / Member ID", d.insurancePolicyNum)}
      ${row("Policy Holder", d.insuranceHolder)}
      ${row("Insurance Phone", d.insurancePhone)}
    `)}
    ${sec("Section 4 — Exclusion from Compliance", `
      ${row("Selection", d.exclusionCompliance || '—')}
    `)}
    ${sec("Section 5 — Vision Exam", `
      ${row("Right Eye 20/", d.visionRightEye)}
      ${row("Left Eye 20/", d.visionLeftEye)}
      ${row("Result", d.visionResult)}
      ${row("Printed Name", d.nameVision)}
      ${row("Date", d.sigVisionDate)}
    `)}
    ${sec("Section 6 — Hearing Exam", `
      ${row("Right Ear", d.hearingRightResult)}
      ${row("Left Ear", d.hearingLeftResult)}
      ${row("Printed Name", d.nameHearing)}
      ${row("Date", d.sigHearingDate)}
    `)}
    ${sec("Section 7 — Admission Requirement", `
      ${row("Selection", d.admissionReq)}
      ${row("Parent Name (Sec. 7)", d.nameSec7Parent)}
      ${row("Date", d.sigSec7ParentDate)}
    `)}
    ${sec("Section 9 — Vaccination Records", `
      ${row("Records", d.vaccinationRecords === 'attached' ? 'Attached' : 'Will provide on first day')}
    `)}
    ${sec("Section 10 — Varicella", `
      ${row("Chickenpox Date (if applicable)", d.chickenpoxDate)}
      ${row("Printed Name", d.nameVaricella)}
    `)}
    ${sec("Photo & Media Consent", `${row("Consent", d.photoConsent)}`)}
    ${sec("Section 14 — Electronic Signature", `
      ${row("Handbook Acknowledged", checked(d.handbookAck))}
      ${row("Electronic Signature", d.signerName)}
      ${row("Date Signed", d.sigDate)}
    `)}`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;color:#222;">
      <div style="background:#e8720c;padding:20px 26px;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:19px;">Divine Kids — Enrollment Form</h1>
        <p style="color:rgba(255,255,255,.85);margin:4px 0 0;font-size:11px;">Submitted ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
      </div>
      <div style="background:#fff;border:1px solid #f0d9c0;border-top:none;padding:18px 26px;">${greeting}</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #f0d9c0;border-top:none;">${tableRows}</table>
      <div style="background:#fff8f0;border:1px solid #f0d9c0;border-top:none;padding:12px 26px;border-radius:0 0 8px 8px;font-size:10px;color:#7a5c3a;">
        <em>By submitting this form, the parent/guardian acknowledged reading and agreeing to the Center's parent handbook and all operational policies.</em>
      </div>
    </div>`;
}

// ── Handler ──────────────────────────────────────────────────────────────────
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

  // Generate PDF
  let pdfBuffer;
  try {
    pdfBuffer = await buildPdf(data);
  } catch (err) {
    console.error('PDF error:', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to generate PDF' }) };
  }

  // Build enrollment file attachments
  const attachments = [
    { filename: `Enrollment-Form-${v(data.childFullName).replace(/\s+/g,'-')}.pdf`, content: pdfBuffer, contentType: 'application/pdf' },
  ];
  const fileFields = { insuranceCardFile:'Insurance-Card', affidavitFile:'Affidavit', admissionDocFile:'Admission-Document', vaccinationRecordsFile:'Vaccination-Records' };
  for (const [field, label] of Object.entries(fileFields)) {
    const f = data[field];
    if (f && f.data) attachments.push({ filename: f.name || `${label}.pdf`, content: Buffer.from(f.data, 'base64'), contentType: f.type || 'application/pdf' });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const childName = v(data.childFullName);
  const subject   = `Enrollment Form — ${childName}`;

  try {
    await transporter.sendMail({ from: `"Divine Kids" <${process.env.SMTP_USER}>`, to: parentEmail, subject, html: buildHtml(data, false), attachments });
    await transporter.sendMail({ from: `"Divine Kids" <${process.env.SMTP_USER}>`, to: CENTER_EMAIL, subject: `[NEW ENROLLMENT] ${subject}`, html: buildHtml(data, true), attachments });
  } catch (err) {
    console.error('Email error:', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to send email' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };
};
