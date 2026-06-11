const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const CENTER_EMAIL = 'Divinekids4soul@gmail.com';

function v(val) { return (val && String(val).trim()) || '—'; }
function checked(val) { return val === 'on' || val === 'yes' || val === true ? 'Yes' : 'No'; }

// ── Build comprehensive PDF — every word from the enrollment form ─────────────
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

    // Title block
    checkY(40);
    doc.fillColor(ORANGE).fontSize(16).font('Helvetica-Bold').text('Divine Kids — Child Enrollment Form', 45, y, {width:W});
    y = doc.y + 2;
    doc.fillColor(MUTED).fontSize(8).font('Helvetica')
       .text('Please complete all sections. A confirmation will be emailed to you upon submission.', 45, y, {width:W});
    y = doc.y + 2;
    doc.fillColor(MUTED).fontSize(8).font('Helvetica')
       .text('Submitted: '+new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}), 45, y, {width:W});
    y = doc.y + 8;
    doc.rect(45,y,W,1).fill('#e0cdb8'); y+=8;

    // Helpers
    const SH = (t) => { checkY(22); doc.rect(45,y,W,18).fill(ORANGE); doc.fillColor('#fff').fontSize(9.5).font('Helvetica-Bold').text(t,51,y+4,{width:W-12}); y+=22; };
    const SUB = (t) => { checkY(16); doc.rect(45,y,W,14).fill('#fff3e8'); doc.fillColor(ORANGE).fontSize(8.5).font('Helvetica-Bold').text(t,51,y+3,{width:W-12}); y+=17; };
    const NOTE = (t) => { checkY(20); doc.fillColor(MUTED).fontSize(7.5).font('Helvetica-Oblique').text(t,45,y,{width:W}); y=doc.y+4; };
    const STMT = (t) => { checkY(20); doc.fillColor(DARK).fontSize(8).font('Helvetica').text(t,45,y,{width:W}); y=doc.y+4; };
    const QA = (q,a) => {
      checkY(14);
      const aStr = (a && typeof a === 'string' && a.trim()) ? a.trim() : (a ? String(a) : '---');
      const sy=y;
      doc.fillColor(MUTED).fontSize(8).font('Helvetica-Bold').text(q,45,y,{width:200});
      const qh=doc.y-sy;
      doc.fillColor(DARK).fontSize(8).font('Helvetica').text(aStr,255,sy,{width:W-210});
      const ah=doc.y-sy; y=sy+Math.max(qh,ah)+3;
    };
    const RADIO = (label, selected) => {
      checkY(14);
      const prefix = selected ? '(X)' : '( )';
      const sy = y;
      doc.fillColor(selected ? ORANGE : MUTED).fontSize(8).font('Helvetica-Bold')
         .text(prefix, 52, y, {width:24});
      doc.fillColor(selected ? DARK : MUTED).fontSize(8).font(selected ? 'Helvetica-Bold' : 'Helvetica')
         .text(label, 80, sy, {width:W-35}); y=doc.y+3;
    };
    const CHECK = (label, isChecked) => {
      checkY(14);
      const prefix = isChecked ? '[X]' : '[ ]';
      const sy = y;
      doc.fillColor(isChecked ? ORANGE : MUTED).fontSize(8).font('Helvetica-Bold')
         .text(prefix, 52, y, {width:24});
      doc.fillColor(isChecked ? DARK : MUTED).fontSize(8).font(isChecked ? 'Helvetica-Bold' : 'Helvetica')
         .text(label, 80, sy, {width:W-35}); y=doc.y+3;
    };
    const DIV = () => { checkY(6); doc.rect(45,y,W,0.5).fill('#e8d5be'); y+=6; };

    // ═══ SECTION 1 ═══════════════════════════════════════════════════════════
    SH('Section 1 — General Information');
    QA("Operation's Name", d.operationName||'Divine Kids');
    QA("Child's Full Name", d.childFullName);
    QA("Child's Date of Birth", d.childDOB);
    STMT('Child Lives With:');
    RADIO('Both parents', d.childLivesWith==='Both parents');
    RADIO('Mom', d.childLivesWith==='Mom');
    RADIO('Dad', d.childLivesWith==='Dad');
    RADIO('Guardian', d.childLivesWith==='Guardian');
    QA("Child's Home Street Address, City, State and ZIP Code", d.childAddress);
    QA('Date of Admission', d.dateAdmission);
    QA('Date of Withdrawal', d.dateWithdrawal);
    DIV();
    SUB('Parent or Guardian 1');
    QA('Name of Parent or Guardian 1', d.parent1Name);
    QA('Address of Parent or Guardian 1, if different from child\'s', d.parent1Address);
    QA('Email Address', d.parent1Email);
    QA('Employer', d.parent1Employer);
    DIV();
    SUB('Parent or Guardian 2');
    QA('Name of Parent or Guardian 2', d.parent2Name);
    QA('Address of Parent or Guardian 2, if different from child\'s', d.parent2Address);
    QA('Email Address', d.parent2Email);
    QA('Employer', d.parent2Employer);
    DIV();
    SUB('Phone Numbers Where Parents or Guardian May Be Reached While Child Is in Care');
    QA('Parent 1 Area Code and Phone No.', d.parent1Phone);
    QA('Parent 2 Area Code and Phone No.', d.parent2Phone);
    QA("Guardian's Area Code and Phone No.", d.guardianPhone);
    DIV();
    STMT('Custody Documents on File?');
    RADIO('Yes', d.custodyDocs==='Yes');
    RADIO('No', d.custodyDocs==='No');
    QA('Custody Document Attached', d.custodyDocFile ? 'Yes (see attachment)' : '—');
    DIV();
    SUB('In Case of an Emergency, When the Parent or Guardian Cannot Be Reached, Call:');
    QA('Name of Emergency Contact', d.ec1Name);
    QA('Relationship', d.ec1Relation);
    QA('Area Code and Phone No.', d.ec1Phone);
    QA('Street Address, City, State and ZIP Code', d.ec1Address);
    DIV();
    SUB('Authorized Persons to Pick the Child');
    NOTE('I authorize the program to release my child to leave the program only with the following persons. Please list name and phone number for each. Children will only be released to a parent or guardian or to a person designated by the parent or guardian after verification of ID.');
    QA('Person 1 — Name', d.pu1Name); QA('Person 1 — Phone', d.pu1Phone);
    QA('Person 2 — Name', d.pu2Name); QA('Person 2 — Phone', d.pu2Phone);
    QA('Person 3 — Name', d.pu3Name); QA('Person 3 — Phone', d.pu3Phone);

    // ═══ SECTION 2 ═══════════════════════════════════════════════════════════
    SH('Section 2 — Consent Information');

    SUB('1. Transportation');
    STMT('I give consent for my child to be transported and supervised by the operation\'s employees. Check all that apply.');
    CHECK('For emergency care', !!d.transportEmergency);
    CHECK('On field trips', !!d.transportFieldTrips);
    CHECK('To and from school', !!d.transportSchool);
    DIV();

    SUB('2. Field Trips');
    RADIO('I give consent for my child to participate in field trips.', d.fieldTrips==='I give consent for my child to participate in field trips.');
    RADIO('I do not give consent for my child to participate in field trips.', d.fieldTrips==='I do not give consent for my child to participate in field trips.');
    QA('Comments', d.fieldTripsComments);
    DIV();

    SUB('3. Water Activities');
    STMT('I give consent for my child to participate in the following water activities. Check all that apply.');
    CHECK('Water table play', !!d.waterTablePlay);
    CHECK('Sprinkler play', !!d.waterSprinkler);
    CHECK('Wading pools', !!d.waterWading);
    CHECK('Swimming pools', !!d.waterSwimming);
    CHECK('Aquatic playgrounds', !!d.waterAquatic);
    STMT('Is your child a competent swimmer?');
    RADIO('Yes', d.competentSwimmer==='Yes');
    RADIO('No', d.competentSwimmer==='No');
    NOTE('If no, your child is required to wear a life jacket while in or near a swimming pool.');
    STMT('Does your child have any physical, health, behavioral or other condition that would put them at risk while swimming?');
    RADIO('Yes', d.swimmingRisk==='Yes');
    RADIO('No', d.swimmingRisk==='No');
    NOTE('If yes, your child is required to wear a life jacket while in or near a swimming pool.');
    NOTE('Note: A competent swimmer can enter and exit a pool safely on their own, tread water or float on their back for one minute, and swim 25 yards with no assistance.');
    DIV();

    SUB('4. Receipt of Written Operational Policies');
    STMT('I acknowledge receipt of the facility\'s operational policies, including those for the following. Check all that apply.');
    CHECK('Discipline and guidance', !!d.policyDiscipline);
    CHECK('Procedures for release of children', !!d.policyRelease);
    CHECK('Suspension and expulsion', !!d.policySuspension);
    CHECK('Illness and exclusion criteria', !!d.policyIllness);
    CHECK('Emergency plans', !!d.policyEmergency);
    CHECK('Procedures for dispensing medications', !!d.policyMedications);
    CHECK('Procedures for conducting health checks', !!d.policyHealthChecks);
    CHECK('Immunization requirements for children', !!d.policyImmunization);
    CHECK('Safe sleep', !!d.policySafeSleep);
    CHECK('Meals and food service practices', !!d.policyMeals);
    CHECK('Procedures for parents to discuss concerns with the director', !!d.policyDiscussConcerns);
    CHECK('Procedures to visit the center without securing prior approval', !!d.policyVisitCenter);
    CHECK('Procedures for parents to participate in activities', !!d.policyParticipate);
    CHECK('Procedures for supporting inclusive services', !!d.policyInclusive);
    CHECK('Promotion of indoor and outdoor physical activity including criteria for extreme weather conditions', !!d.policyPhysicalActivity);
    CHECK('Procedures for parents to contact program Regulation (CCR), DFPS, Child Abuse Hotline and CCR website', !!d.policyCCR);
    DIV();

    SUB('5. Meals');
    STMT('I understand the following meals will be served to my child while in care. Check all that apply.');
    CHECK('None', !!d.mealNone);
    CHECK('Breakfast', !!d.mealBreakfast);
    CHECK('Morning snack', !!d.mealMorningSnack);
    CHECK('Lunch', !!d.mealLunch);
    CHECK('Afternoon snack', !!d.mealAfternoonSnack);
    CHECK('Supper', !!d.mealSupper);
    CHECK('Evening snack', !!d.mealEveningSnack);
    DIV();

    SUB('6. Days and Times in Care');
    STMT('My child is normally in care on the following days and times.');
    [['Monday',d.monAM,d.monPM],['Tuesday',d.tueAM,d.tuePM],['Wednesday',d.wedAM,d.wedPM],
     ['Thursday',d.thuAM,d.thuPM],['Friday',d.friAM,d.friPM],['Saturday',d.satAM,d.satPM],
     ['Sunday',d.sunAM,d.sunPM]].forEach(([day,am,pm]) => QA(day, 'A.M.: '+(am||'—')+'  |  P.M.: '+(pm||'—')));
    DIV();

    SUB('7. Receipt of Parent\'s Rights');
    CHECK('I acknowledge that I have received a written copy of the Parent\'s Handbook that includes my rights and responsibilities as a parent or guardian of a child enrolled at this facility.', d.parentRightsAck==='on'||!!d.parentRightsAck);
    DIV();

    SUB('8. Child\'s Special Care Needs');
    STMT('Check all that apply.');
    CHECK('Environmental allergies', !!d.needEnvAllergies);
    CHECK('Limitations or restrictions on child\'s activities', !!d.needActivityLimits);
    CHECK('Food intolerances', !!d.needFoodIntolerance);
    CHECK('Reasonable accommodations or modifications', !!d.needAccommodations);
    CHECK('Existing illness', !!d.needExistingIllness);
    CHECK('Adaptive equipment, include instructions below', !!d.needAdaptiveEquip);
    CHECK('Previous serious illness', !!d.needPreviousIllness);
    CHECK('Symptoms or indications of complications', !!d.needComplications);
    CHECK('Injuries and hospitalizations in the past 12 months', !!d.needInjuries);
    CHECK('Medications prescribed for continuous long-term use', !!d.needMedications);
    QA('Other:', d.specialNeedsOther);
    QA('Explain any needs selected above:', d.specialNeedsExplain);
    STMT('Does your child have diagnosed food allergies?');
    RADIO('Yes', d.foodAllergies==='Yes');
    RADIO('No', d.foodAllergies==='No');
    NOTE('The Food Allergy Emergency Plan found on the Important Forms page must be filled and submitted before the first day of the child attending the program.');
    DIV();

    SUB('9. School-Age Children');
    QA('My child attends the following school', d.schoolName);
    QA('School Area Code and Phone No.', d.schoolPhone);
    STMT('My child has permission to:');
    CHECK('Walk to or from school or home', !!d.permWalkHome);
    CHECK('Ride a bus', !!d.permRideBus);
    CHECK('Be released to the care of their sibling younger than 18 years old', !!d.permSiblingRelease);
    QA('Authorized pick up or drop off locations other than the child\'s address:', d.pickupLocations);
    CHECK('Child\'s required immunizations, vision and hearing screening are current and on file at their school.', !!d.immunizationCurrent);

    // ═══ SECTION 3A ══════════════════════════════════════════════════════════
    SH('Section 3A — Authorization For Emergency Medical Attention');
    NOTE('In the event I cannot be reached to arrange for emergency medical care, I authorize the person in charge to take my child to:');
    QA('Name of Physician', d.physicianName);
    QA('Area Code and Phone No.', d.physicianPhone);
    QA('Street Address, City, State and ZIP Code', d.physicianAddress);
    QA('Name of Emergency Care Facility', d.emergencyFacilityName);
    QA('Area Code and Phone No.', d.emergencyFacilityPhone);
    QA('Street Address, City, State and ZIP Code', d.emergencyFacilityAddress);
    CHECK('I give consent for the facility to secure any and all necessary emergency medical care for my child.', d.emergencyMedConsent==='on'||!!d.emergencyMedConsent);
    QA('Parent or Legal Guardian (printed name)', d.nameSec3);
    QA('Date', d.sigSec3Date);

    // ═══ SECTION 3B ══════════════════════════════════════════════════════════
    SH('Section 3B — Child\'s Medical Insurance Information');
    NOTE('The Center does not carry liability insurance; therefore, the child\'s medical insurance is required for medical emergencies when parents or an alternative contact cannot be reached, and it is necessary for taking the child to a medical facility.');
    STMT('Medical Insurance Card Attached:');
    RADIO('Yes', d.insuranceCardAttached==='Yes');
    RADIO('No — I will submit when dropping my child off for the first time', d.insuranceCardAttached==='No');
    QA('Insurance Company Name', d.insuranceCompany);
    QA('Policy / Member ID Number', d.insurancePolicyNum);
    QA('Policy Holder Name', d.insuranceHolder);
    QA('Insurance Contact Phone', d.insurancePhone);
    QA('Insurance Card Attached', d.insuranceCardFile ? 'Yes (see attachment)' : '—');
    QA('Parent or Legal Guardian (printed name)', d.nameSec3B);
    QA('Date', d.sigSec3BDate);

    // ═══ SECTION 4 ═══════════════════════════════════════════════════════════
    SH('Section 4 — Requirements for Exclusion from Compliance');
    RADIO('I have attached a signed and dated affidavit stating that I decline immunizations by reason of conscience, including religious belief, on the form described by Health and Safety Code Section 161.0041 submitted no later than the 90th day after the affidavit is notarized.', d.exclusionCompliance==='immunization_affidavit');
    RADIO('I have attached a signed and dated affidavit stating that the vision or hearing screening conflicts with the tenets or practices of a church or religious denomination that I am an adherent or member of.', d.exclusionCompliance==='vision_hearing_affidavit');
    QA('Affidavit Attached', d.affidavitFile ? 'Yes (see attachment)' : '—');

    // ═══ SECTION 5 ═══════════════════════════════════════════════════════════
    SH('Section 5 — Vision Exam Results');
    QA('Right Eye 20/', d.visionRightEye);
    QA('Left Eye 20/', d.visionLeftEye);
    STMT('Result:');
    RADIO('Pass', d.visionResult==='Pass');
    RADIO('Fail', d.visionResult==='Fail');
    QA('Printed Name', d.nameVision);
    QA('Date Signed', d.sigVisionDate);

    // ═══ SECTION 6 ═══════════════════════════════════════════════════════════
    SH('Section 6 — Hearing Exam Results');
    SUB('Right Ear');
    QA('1000 Hz', d.hearingRight1000); QA('2000 Hz', d.hearingRight2000); QA('4000 Hz', d.hearingRight4000);
    STMT('Pass or Fail:');
    RADIO('Pass', d.hearingRightResult==='Pass'); RADIO('Fail', d.hearingRightResult==='Fail');
    SUB('Left Ear');
    QA('1000 Hz', d.hearingLeft1000); QA('2000 Hz', d.hearingLeft2000); QA('4000 Hz', d.hearingLeft4000);
    STMT('Pass or Fail:');
    RADIO('Pass', d.hearingLeftResult==='Pass'); RADIO('Fail', d.hearingLeftResult==='Fail');
    QA('Printed Name', d.nameHearing);
    QA('Date Signed', d.sigHearingDate);

    // ═══ SECTION 7 ═══════════════════════════════════════════════════════════
    SH('Section 7 — Admission Requirement');
    NOTE('If your child does not attend pre-kindergarten or school away from the program, one of the following must be presented when your child is admitted to the program or within one week of admission.');
    RADIO('A signed and dated copy of a health care professional\'s statement is attached, which states that the healthcare professional has examined the above named child within the past year and finds the child is able to take part in the program.', d.admissionReq==='signed_copy_attached');
    RADIO('Medical diagnosis and treatment conflict with the tenets and practices of a recognized religious organization, which I adhere to or am a member of. I have attached a signed and dated affidavit stating this.', d.admissionReq==='religious_conflict');
    RADIO('My child has been examined within the past year by a health care professional and is able to participate in the program. Within 12 months of admission, I will obtain a health care professional\'s signed statement and submit it to the program.', d.admissionReq==='within_12_months');
    QA('Supporting Statement / Affidavit Attached', d.admissionDocFile ? 'Yes (see attachment)' : '—');
    QA('Parent or Legal Guardian (printed name)', d.nameSec7Parent);
    QA('Date Signed', d.sigSec7ParentDate);

    // ═══ SECTION 8 ═══════════════════════════════════════════════════════════
    SH('Section 8 — Vaccine Information');
    NOTE('The following vaccines require multiple doses over time. Provide the date your child received each dose.');
    const vaccines = [
      ['Hepatitis B', [['Birth (first dose)', d.hepB1],['1–2 months (second dose)', d.hepB2],['6–18 months (third dose)', d.hepB3]]],
      ['Rotavirus', [['2 months (first dose)', d.rota1],['4 months (second dose)', d.rota2],['6 months (third dose)', d.rota3]]],
      ['Diphtheria, Tetanus, Pertussis', [['2 months (first dose)', d.dtap1],['4 months (second dose)', d.dtap2],['6 months (third dose)', d.dtap3],['15–18 months (fourth dose)', d.dtap4],['4–6 years (fifth dose)', d.dtap5]]],
      ['Haemophilus Influenza Type B', [['2 months (first dose)', d.hib1],['4 months (second dose)', d.hib2],['6 months (third dose)', d.hib3],['12–15 months (fourth dose)', d.hib4]]],
      ['Pneumococcal', [['2 months (first dose)', d.pcv1],['4 months (second dose)', d.pcv2],['6 months (third dose)', d.pcv3],['12–15 months (fourth dose)', d.pcv4]]],
      ['Inactivated Poliovirus', [['2 months (first dose)', d.ipv1],['4 months (second dose)', d.ipv2],['6–18 months (third dose)', d.ipv3],['4–6 years (fourth dose)', d.ipv4]]],
      ['Influenza', [['Yearly, starting at 6 months. Two doses given at least four weeks apart are recommended for children who are getting the vaccine for the first time and for some other children in this age group.', d.flu1]]],
      ['Measles, Mumps, Rubella', [['12–15 months (first dose)', d.mmr1],['4–6 years (second dose)', d.mmr2]]],
      ['Varicella (Chickenpox)', [['12–15 months (first dose)', d.var1],['4–6 years (second dose)', d.var2]]],
      ['Hepatitis A', [['12–23 months (first dose)', d.hepA1],['The second dose should be given six to 18 months after the first dose.', d.hepA2]]],
    ];
    vaccines.forEach(([name, doses]) => { SUB(name); doses.forEach(([sched, date]) => QA(sched, date)); });

    // ═══ SECTION 9 ═══════════════════════════════════════════════════════════
    SH('Section 9 — Vaccination Records');
    NOTE('Please attach a copy of vaccination records from your public health personnel\'s office.');
    RADIO('I am attaching a copy of my child\'s vaccination records below.', d.vaccinationRecords==='attached');
    RADIO('Records will be provided when my child is dropped off at the program for the first time.', d.vaccinationRecords==='on_first_day');
    QA('Vaccination Records Attached', d.vaccinationRecordsFile ? 'Yes (see attachment)' : '—');

    // ═══ SECTION 10 ══════════════════════════════════════════════════════════
    SH('Section 10 — Varicella for Chickenpox');
    NOTE('Varicella, the vaccine for chickenpox, is not required if your child has had chickenpox disease. If your child has had chickenpox, complete the statement below.');
    QA('My child had varicella disease, chickenpox, on or about [date] and does not need varicella vaccine.', d.chickenpoxDate);
    QA('Printed Name', d.nameVaricella);
    QA('Date Signed', d.sigVaricellaDate);

    // ═══ SECTION 11 ══════════════════════════════════════════════════════════
    SH('Section 11 — Additional Information About Immunizations');
    STMT('For more information about immunizations, visit the Texas Department of State Health Services website at www.dshs.state.tx.us/immunize/public.shtm.');

    // ═══ SECTION 12 ══════════════════════════════════════════════════════════
    SH('Section 12 — Gang Free Zone');
    STMT('Under the Texas Penal Code, any area within 1,000 feet of a program is a gang-free zone, where criminal offenses related to organized criminal activity are subject to harsher penalties.');

    // ═══ PHOTO CONSENT ═══════════════════════════════════════════════════════
    SH('Photo & Media Consent');
    STMT('I acknowledge that Center activities may be photographed or video-recorded from time to time and give my consent for my child to appear in digital and printed media used to promote the Center.');
    STMT('Please select one:');
    RADIO('I consent', d.photoConsent==='I consent');
    RADIO('I do not consent', d.photoConsent==='I do not consent');

    // ═══ SECTION 14 ══════════════════════════════════════════════════════════
    SH('Section 14 — Signatures');
    STMT('By signing the enrollment form, I acknowledge that I have read and understand the Center\'s parent handbook and agree to follow all the operational policies stated in the handbook.');
    CHECK('I have read and agree to the Center\'s parent handbook and all operational policies.', d.handbookAck==='on'||!!d.handbookAck);
    STMT('By typing your full name below, you are signing this form electronically. Your typed name is legally equivalent to a handwritten (wet) signature and confirms your agreement to all statements in this enrollment form.');
    QA('Full Name (Electronic Signature)', d.signerName);
    QA('Date Signed', d.sigDate);

    // ═══ FOOTER ══════════════════════════════════════════════════════════════
    const pages = doc.bufferedPageRange();
    for (let i=0; i<pages.count; i++) {
      doc.switchToPage(pages.start+i);
      doc.fillColor(MUTED).fontSize(7).font('Helvetica')
         .text('Divine Kids — Child Enrollment Form  |  Page '+(i+1)+' of '+pages.count,
               45, doc.page.height-28, {width:W, align:'center'});
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
  const schedDays = ['mon','tue','wed','thu','fri','sat','sun'].map(day => { const am=d[day+'AM'],pm=d[day+'PM']; return `${day.charAt(0).toUpperCase()+day.slice(1)}: AM ${v(am)} / PM ${v(pm)}`; }).join(' | ');
  const specialNeeds = [d.needEnvAllergies&&'Env. allergies',d.needFoodIntolerance&&'Food intolerance',d.needExistingIllness&&'Existing illness',d.needPreviousIllness&&'Previous illness',d.needInjuries&&'Injuries',d.needActivityLimits&&'Activity limits',d.needAccommodations&&'Accommodations',d.needAdaptiveEquip&&'Adaptive equip',d.needComplications&&'Complications',d.needMedications&&'Long-term meds'].filter(Boolean).join(', ') || '—';

  const greeting = isCenter
    ? `<p style="margin:0 0 10px;">New enrollment form submitted for <strong>${childName}</strong>. Full details below. A PDF copy is attached.</p>`
    : `<p style="margin:0 0 6px;">Dear ${v(d.parent1Name ? d.parent1Name.split(' ')[0] : 'Parent')},</p>
       <p style="margin:0 0 10px;">Thank you for submitting the enrollment form for <strong>${childName}</strong>. A complete PDF copy is attached for your records.</p>`;

  const vaccineRows = [
    ['Hepatitis B',                    [['Birth (first dose)', d.hepB1],['1–2 months (second dose)', d.hepB2],['6–18 months (third dose)', d.hepB3]]],
    ['Rotavirus',                      [['2 months (first dose)', d.rota1],['4 months (second dose)', d.rota2],['6 months (third dose)', d.rota3]]],
    ['Diphtheria, Tetanus, Pertussis', [['2 months (first dose)', d.dtap1],['4 months (second dose)', d.dtap2],['6 months (third dose)', d.dtap3],['15–18 months (fourth dose)', d.dtap4],['4–6 years (fifth dose)', d.dtap5]]],
    ['Haemophilus Influenza Type B',   [['2 months (first dose)', d.hib1],['4 months (second dose)', d.hib2],['6 months (third dose)', d.hib3],['12–15 months (fourth dose)', d.hib4]]],
    ['Pneumococcal',                   [['2 months (first dose)', d.pcv1],['4 months (second dose)', d.pcv2],['6 months (third dose)', d.pcv3],['12–15 months (fourth dose)', d.pcv4]]],
    ['Inactivated Poliovirus',         [['2 months (first dose)', d.ipv1],['4 months (second dose)', d.ipv2],['6–18 months (third dose)', d.ipv3],['4–6 years (fourth dose)', d.ipv4]]],
    ['Influenza',                      [['Yearly starting at 6 months', d.flu1]]],
    ['Measles, Mumps, Rubella',        [['12–15 months (first dose)', d.mmr1],['4–6 years (second dose)', d.mmr2]]],
    ['Varicella (Chickenpox)',         [['12–15 months (first dose)', d.var1],['4–6 years (second dose)', d.var2]]],
    ['Hepatitis A',                    [['12–23 months (first dose)', d.hepA1],['6 months after first dose (second dose)', d.hepA2]]],
  ].map(([name, doses]) =>
    `<tr><td colspan="2" style="background:#fff3e8;font-weight:700;font-size:10px;padding:4px 10px;color:#e8720c;">${name}</td></tr>` +
    doses.map(([sched, date]) => row(sched, date)).join('')
  ).join('');

  const admMap = { signed_copy_attached: 'Signed copy of healthcare professional statement attached', religious_conflict: 'Religious conflict affidavit attached', within_12_months: 'Child examined within past year; statement to be submitted within 12 months' };

  const tableRows = `
    ${sec("Section 1 — General Information", `
      ${row("Operation's Name", d.operationName || 'Divine Kids')}
      ${row("Child's Full Name", d.childFullName)}
      ${row("Date of Birth", d.childDOB)}
      ${row("Child Lives With", d.childLivesWith)}
      ${row("Home Address", d.childAddress)}
      ${row("Date of Admission", d.dateAdmission)}
      ${row("Date of Withdrawal", d.dateWithdrawal)}
      ${row("Custody Docs on File", d.custodyDocs)}
      ${row("Custody Document Attached", d.custodyDocFile ? "Yes (attached)" : "—")}
    `)}
    ${sec("Parent / Guardian 1", `
      ${row("Name", d.parent1Name)}
      ${row("Email", d.parent1Email)}
      ${row("Phone", d.parent1Phone)}
      ${row("Employer", d.parent1Employer)}
      ${row("Address (if different)", d.parent1Address)}
    `)}
    ${sec("Parent / Guardian 2", `
      ${row("Name", d.parent2Name)}
      ${row("Email", d.parent2Email)}
      ${row("Phone", d.parent2Phone)}
      ${row("Employer", d.parent2Employer)}
      ${row("Address (if different)", d.parent2Address)}
    `)}
    ${sec("Phone Numbers", `
      ${row("Parent 1 Phone", d.parent1Phone)}
      ${row("Parent 2 Phone", d.parent2Phone)}
      ${row("Guardian's Phone", d.guardianPhone)}
    `)}
    ${sec("Emergency Contact (when parent/guardian cannot be reached)", `
      ${row("Name", d.ec1Name)}
      ${row("Relationship", d.ec1Relation)}
      ${row("Phone", d.ec1Phone)}
      ${row("Address", d.ec1Address)}
    `)}
    ${sec("Authorized Persons to Pick the Child", `
      ${row("Person 1 Name", d.pu1Name)}
      ${row("Person 1 Phone", d.pu1Phone)}
      ${row("Person 2 Name", d.pu2Name)}
      ${row("Person 2 Phone", d.pu2Phone)}
      ${row("Person 3 Name", d.pu3Name)}
      ${row("Person 3 Phone", d.pu3Phone)}
    `)}
    ${sec("Section 2.1 — Transportation Consent", `
      ${row("For emergency care", checked(d.transportEmergency))}
      ${row("On field trips", checked(d.transportFieldTrips))}
      ${row("To and from school", checked(d.transportSchool))}
    `)}
    ${sec("Section 2.2 — Field Trips", `
      ${row("Decision", d.fieldTrips)}
      ${row("Comments", d.fieldTripsComments)}
    `)}
    ${sec("Section 2.3 — Water Activities", `
      ${row("Water table play", checked(d.waterTablePlay))}
      ${row("Sprinkler play", checked(d.waterSprinkler))}
      ${row("Wading pools", checked(d.waterWading))}
      ${row("Swimming pools", checked(d.waterSwimming))}
      ${row("Aquatic playgrounds", checked(d.waterAquatic))}
      ${row("Is your child a competent swimmer?", d.competentSwimmer)}
      ${row("Does your child have any condition putting them at risk while swimming?", d.swimmingRisk)}
    `)}
    ${sec("Section 2.4 — Receipt of Written Operational Policies", `
      ${row("Discipline and guidance", checked(d.policyDiscipline))}
      ${row("Procedures for release of children", checked(d.policyRelease))}
      ${row("Suspension and expulsion", checked(d.policySuspension))}
      ${row("Illness and exclusion criteria", checked(d.policyIllness))}
      ${row("Emergency plans", checked(d.policyEmergency))}
      ${row("Procedures for dispensing medications", checked(d.policyMedications))}
      ${row("Procedures for conducting health checks", checked(d.policyHealthChecks))}
      ${row("Immunization requirements for children", checked(d.policyImmunization))}
      ${row("Safe sleep", checked(d.policySafeSleep))}
      ${row("Meals and food service practices", checked(d.policyMeals))}
      ${row("Procedures for parents to discuss concerns with director", checked(d.policyDiscussConcerns))}
      ${row("Procedures to visit center without prior approval", checked(d.policyVisitCenter))}
      ${row("Procedures for parents to participate in activities", checked(d.policyParticipate))}
      ${row("Procedures for supporting inclusive services", checked(d.policyInclusive))}
      ${row("Promotion of indoor and outdoor physical activity", checked(d.policyPhysicalActivity))}
      ${row("Procedures to contact CCR, DFPS, Child Abuse Hotline", checked(d.policyCCR))}
    `)}
    ${sec("Section 2.5 — Meals", `
      ${row("None", checked(d.mealNone))}
      ${row("Breakfast", checked(d.mealBreakfast))}
      ${row("Morning snack", checked(d.mealMorningSnack))}
      ${row("Lunch", checked(d.mealLunch))}
      ${row("Afternoon snack", checked(d.mealAfternoonSnack))}
      ${row("Supper", checked(d.mealSupper))}
      ${row("Evening snack", checked(d.mealEveningSnack))}
    `)}
    ${sec("Section 2.6 — Days & Times in Care", `
      ${row("Monday", `AM: ${v(d.monAM)} / PM: ${v(d.monPM)}`)}
      ${row("Tuesday", `AM: ${v(d.tueAM)} / PM: ${v(d.tuePM)}`)}
      ${row("Wednesday", `AM: ${v(d.wedAM)} / PM: ${v(d.wedPM)}`)}
      ${row("Thursday", `AM: ${v(d.thuAM)} / PM: ${v(d.thuPM)}`)}
      ${row("Friday", `AM: ${v(d.friAM)} / PM: ${v(d.friPM)}`)}
      ${row("Saturday", `AM: ${v(d.satAM)} / PM: ${v(d.satPM)}`)}
      ${row("Sunday", `AM: ${v(d.sunAM)} / PM: ${v(d.sunPM)}`)}
    `)}
    ${sec("Section 2.7 — Receipt of Parent's Rights", `
      ${row("I acknowledge I have received a written copy of the Parent's Handbook including my rights and responsibilities", checked(d.parentRightsAck))}
    `)}
    ${sec("Section 2.8 — Child's Special Care Needs", `
      ${row("Environmental allergies", checked(d.needEnvAllergies))}
      ${row("Food intolerances", checked(d.needFoodIntolerance))}
      ${row("Existing illness", checked(d.needExistingIllness))}
      ${row("Previous serious illness", checked(d.needPreviousIllness))}
      ${row("Injuries and hospitalizations in past 12 months", checked(d.needInjuries))}
      ${row("Limitations or restrictions on activities", checked(d.needActivityLimits))}
      ${row("Reasonable accommodations or modifications", checked(d.needAccommodations))}
      ${row("Adaptive equipment", checked(d.needAdaptiveEquip))}
      ${row("Symptoms or indications of complications", checked(d.needComplications))}
      ${row("Medications prescribed for continuous long-term use", checked(d.needMedications))}
      ${row("Other", d.specialNeedsOther)}
      ${row("Explanation", d.specialNeedsExplain)}
      ${row("Does your child have diagnosed food allergies?", d.foodAllergies)}
    `)}
    ${sec("Section 2.9 — School-Age Children", `
      ${row("School Name", d.schoolName)}
      ${row("School Phone", d.schoolPhone)}
      ${row("Permission: Walk to/from school or home", checked(d.permWalkHome))}
      ${row("Permission: Ride a bus", checked(d.permRideBus))}
      ${row("Permission: Released to sibling under 18", checked(d.permSiblingRelease))}
      ${row("Authorized pick-up/drop-off locations", d.pickupLocations)}
      ${row("Immunizations/vision/hearing current and on file at school", checked(d.immunizationCurrent))}
    `)}
    ${sec("Section 3 — Authorization For Emergency Medical Attention", `
      ${row("Physician Name", d.physicianName)}
      ${row("Physician Phone", d.physicianPhone)}
      ${row("Physician Address", d.physicianAddress)}
      ${row("Emergency Care Facility", d.emergencyFacilityName)}
      ${row("Facility Phone", d.emergencyFacilityPhone)}
      ${row("Facility Address", d.emergencyFacilityAddress)}
      ${row("I give consent for facility to secure emergency medical care", checked(d.emergencyMedConsent))}
      ${row("Parent/Guardian Printed Name (Sec. 3)", d.nameSec3)}
      ${row("Date Signed", d.sigSec3Date)}
    `)}
    ${sec("Section 3B — Child's Medical Insurance Information", `
      ${row("Medical Insurance Card Attached", d.insuranceCardAttached === "No" ? "No — will submit on first day" : v(d.insuranceCardAttached))}
      ${row("Insurance Company", d.insuranceCompany)}
      ${row("Policy / Member ID Number", d.insurancePolicyNum)}
      ${row("Policy Holder Name", d.insuranceHolder)}
      ${row("Insurance Contact Phone", d.insurancePhone)}
      ${row("Parent/Guardian Printed Name (Sec. 3B)", d.nameSec3B)}
      ${row("Date Signed", d.sigSec3BDate)}
    `)}
    ${sec("Section 4 — Requirements for Exclusion from Compliance", `
      ${row("Selection", admMap[d.exclusionCompliance] || '—')}
    `)}
    ${sec("Section 5 — Vision Exam Results", `
      ${row("Right Eye 20/", d.visionRightEye)}
      ${row("Left Eye 20/", d.visionLeftEye)}
      ${row("Result", d.visionResult)}
      ${row("Printed Name", d.nameVision)}
      ${row("Date Signed", d.sigVisionDate)}
    `)}
    ${sec("Section 6 — Hearing Exam Results", `
      ${row("Right Ear — 1000 Hz", d.hearingRight1000)}
      ${row("Right Ear — 2000 Hz", d.hearingRight2000)}
      ${row("Right Ear — 4000 Hz", d.hearingRight4000)}
      ${row("Right Ear — Pass or Fail", d.hearingRightResult)}
      ${row("Left Ear — 1000 Hz", d.hearingLeft1000)}
      ${row("Left Ear — 2000 Hz", d.hearingLeft2000)}
      ${row("Left Ear — 4000 Hz", d.hearingLeft4000)}
      ${row("Left Ear — Pass or Fail", d.hearingLeftResult)}
      ${row("Printed Name", d.nameHearing)}
      ${row("Date Signed", d.sigHearingDate)}
    `)}
    ${sec("Section 7 — Admission Requirement", `
      ${row("Selection", admMap[d.admissionReq] || v(d.admissionReq))}
      ${row("Parent/Guardian Printed Name (Sec. 7)", d.nameSec7Parent)}
      ${row("Date Signed", d.sigSec7ParentDate)}
    `)}
    ${sec("Section 8 — Vaccine Information", vaccineRows)}
    ${sec("Section 9 — Vaccination Records", `
      ${row("Records", d.vaccinationRecords === 'attached' ? 'Attached with this form' : 'Will provide on first day of program')}
    `)}
    ${sec("Section 10 — Varicella for Chickenpox", `
      ${row("Chickenpox disease date (if applicable)", d.chickenpoxDate)}
      ${row("Printed Name", d.nameVaricella)}
      ${row("Date Signed", d.sigVaricellaDate)}
    `)}
    ${sec("Section 11 — Additional Information About Immunizations", `
      ${row("Reference", 'www.dshs.state.tx.us/immunize/public.shtm')}
    `)}
    ${sec("Section 12 — Gang Free Zone", `
      ${row("Notice", 'Any area within 1,000 feet of a Preschool and After-School Program is a gang-free zone under Texas Penal Code.')}
    `)}
    ${sec("Photo & Media Consent", `
      ${row("I give consent for my child to appear in digital and printed media used to promote the Center", d.photoConsent)}
    `)}
    ${sec("Section 14 — Acknowledgment & Electronic Signature", `
      ${row("Handbook acknowledged and all operational policies agreed to", checked(d.handbookAck))}
      ${row("Electronic Signature (Full Name)", d.signerName)}
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
  const fileFields = { insuranceCardFile:'Insurance-Card', affidavitFile:'Affidavit', admissionDocFile:'Admission-Document', vaccinationRecordsFile:'Vaccination-Records', custodyDocFile:'Custody-Document' };
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
