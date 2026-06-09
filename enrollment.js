// Convert a file input to base64
function fileToBase64(input) {
  return new Promise((resolve) => {
    const file = input.files && input.files[0];
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type,
      data: reader.result.split(',')[1], // base64 only
    });
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

document.getElementById('enrollmentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = e.target;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  if (!document.getElementById('handbookAck').checked) {
    dkAlert('Please acknowledge the parent handbook before submitting.');
    return;
  }
  const signerName = document.getElementById('signerName').value.trim();
  if (!signerName) {
    dkAlert('Please type your full name as your electronic signature before submitting.');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  // Collect text fields
  const data = Object.fromEntries(new FormData(form).entries());

  // Collect file attachments as base64
  const fileFields = ['insuranceCardFile', 'affidavitFile', 'admissionDocFile', 'vaccinationRecordsFile'];
  for (const fieldName of fileFields) {
    const input = document.getElementById(fieldName) || form.elements[fieldName];
    if (input) {
      const result = await fileToBase64(input);
      if (result) data[fieldName] = result;
    }
  }

  try {
    const res = await fetch('/.netlify/functions/send-enrollment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      // Save enrollment data for the payment page so both can be combined into one email
      sessionStorage.setItem('enrollmentData', JSON.stringify(data));
      form.reset();
      window.location.href = 'payment.html';
    } else {
      const body = await res.json().catch(() => ({}));
      dkAlert('There was a problem submitting the form: ' + (body.message || 'Please try again or email us directly.'));
    }
  } catch (err) {
    dkAlert('Network error. Please check your connection and try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Enrollment Form';
  }
});
