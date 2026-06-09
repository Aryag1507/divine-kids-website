/**
 * Divine Kids — Enrollment Form Auto-Fill Test
 *
 * HOW TO USE:
 * 1. Open the enrollment form in your browser (localhost or live site)
 * 2. Open browser DevTools (right-click → Inspect → Console tab)
 * 3. Paste the entire contents of this file and press Enter
 * 4. The form will be filled automatically — then click Submit
 */

(function fillForm() {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else { console.warn('Not found:', id); }
  };
  const radio = (name, val) => {
    const el = document.querySelector(`input[name="${name}"][value="${val}"]`);
    if (el) { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); }
    else { console.warn('Radio not found:', name, val); }
  };
  const check = (name) => {
    const el = document.querySelector(`input[name="${name}"]`);
    if (el) el.checked = true;
    else { console.warn('Checkbox not found:', name); }
  };

  // ── Section 1 — General Information ───────────────────────────────────────
  set('childFullName',  'Emma Johnson');
  set('childDOB',       '2021-03-15');
  radio('childLivesWith', 'Both parents');
  set('childAddress',   '123 Oak Street, Houston, TX 77001');
  set('dateAdmission',  '2026-08-10');

  // Parent 1
  set('parent1Name',     'Sarah Johnson');
  set('parent1Email',    'test@example.com');
  set('parent1Employer', 'ABC Company');

  // Parent 2
  set('parent2Name',     'Mark Johnson');
  set('parent2Email',    'mark@example.com');
  set('parent2Employer', 'XYZ Corp');

  // Phones
  set('parent1Phone',  '832-555-1234');
  set('parent2Phone',  '832-555-5678');
  radio('custodyDocs', 'No');

  // Emergency contact
  set('ec1Name',     'Linda Smith');
  set('ec1Relation', 'Grandmother');
  set('ec1Phone',    '832-555-9999');
  set('ec1Address',  '456 Pine Ave, Houston TX 77002');

  // Authorized pick-up
  set('pu1Name',  'Linda Smith');
  set('pu1Phone', '832-555-9999');

  // ── Section 2 — Consent ───────────────────────────────────────────────────
  check('transportEmergency');
  check('transportFieldTrips');
  radio('fieldTrips', 'I give consent for my child to participate in field trips.');
  check('waterTablePlay');
  check('waterSprinkler');
  radio('competentSwimmer', 'No');
  radio('swimmingRisk',     'No');

  // Operational policies
  ['policyDiscipline','policyRelease','policySuspension','policyIllness',
   'policyEmergency','policyMedications','policyHealthChecks','policyImmunization',
   'policySafeSleep','policyMeals'].forEach(check);

  // Meals
  check('mealBreakfast');
  check('mealMorningSnack');
  check('mealLunch');
  check('mealAfternoonSnack');

  // Schedule
  ['mon','tue','wed','thu','fri'].forEach(d => {
    set(d + 'AM', '7:30');
    set(d + 'PM', '5:30');
  });

  check('parentRightsAck');
  radio('foodAllergies', 'No');

  // School-age
  set('schoolName', 'N/A');

  // ── Section 3 — Emergency Medical ────────────────────────────────────────
  set('physicianName',            'Dr. Anjali Patel');
  set('physicianPhone',           '713-555-0001');
  set('physicianAddress',         '500 Medical Dr, Houston TX 77030');
  set('emergencyFacilityName',    "Texas Children's Hospital");
  set('emergencyFacilityPhone',   '713-555-0002');
  set('emergencyFacilityAddress', '6621 Fannin St, Houston TX 77030');
  check('emergencyMedConsent');
  set('nameSec3',    'Sarah Johnson');
  set('sigSec3Date', '2026-06-08');

  // ── Section 3B — Insurance ────────────────────────────────────────────────
  radio('insuranceCardAttached', 'Yes');
  set('insuranceCompany',   'Blue Cross Blue Shield');
  set('insurancePolicyNum', 'BCB123456');
  set('insuranceHolder',    'Sarah Johnson');
  set('insurancePhone',     '800-555-2583');

  // ── Section 5 — Vision ───────────────────────────────────────────────────
  set('visionRightEye', '20');
  set('visionLeftEye',  '20');
  radio('visionResult', 'Pass');
  set('nameVision',    'Sarah Johnson');
  set('sigVisionDate', '2026-06-08');

  // ── Section 6 — Hearing ──────────────────────────────────────────────────
  set('hearingRight1000', '20'); set('hearingRight2000', '20'); set('hearingRight4000', '20');
  set('hearingLeft1000',  '20'); set('hearingLeft2000',  '20'); set('hearingLeft4000',  '20');
  radio('hearingRightResult', 'Pass');
  radio('hearingLeftResult',  'Pass');
  set('nameHearing',    'Sarah Johnson');
  set('sigHearingDate', '2026-06-08');

  // ── Section 7 — Admission ────────────────────────────────────────────────
  radio('admissionReq', 'signed_copy_attached');
  set('nameSec7Parent',    'Sarah Johnson');
  set('sigSec7ParentDate', '2026-06-08');

  // ── Section 9 — Vaccination Records ─────────────────────────────────────
  radio('vaccinationRecords', 'on_first_day');

  // ── Photo Consent ────────────────────────────────────────────────────────
  radio('photoConsent', 'I consent');

  // ── Section 14 — Final Signature ─────────────────────────────────────────
  check('handbookAck');
  set('signerName', 'Sarah Johnson');
  set('sigDate',    '2026-06-08');

  window.scrollTo({ top: 0, behavior: 'smooth' });
  console.log('✅ Form filled! Review then click Submit.');
})();
