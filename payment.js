// Convert a file input to base64
function fileToBase64(input) {
  return new Promise((resolve) => {
    const file = input.files && input.files[0];
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type,
      data: reader.result.split(',')[1],
    });
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

document.getElementById('paymentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = e.target;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // At least one payment option must be selected
  const anyChecked = ['payAdmissionZelle','payFirstWeekZelle','payAdmissionCash','payFirstWeekCash']
    .some(name => form.elements[name] && form.elements[name].checked);
  if (!anyChecked) {
    alert('Please select at least one payment option.');
    return;
  }

  // Zelle options require an attachment
  const admissionZelleChecked = form.elements['payAdmissionZelle'] && form.elements['payAdmissionZelle'].checked;
  const firstWeekZelleChecked = form.elements['payFirstWeekZelle'] && form.elements['payFirstWeekZelle'].checked;
  const admissionZelleFile    = document.getElementById('admissionZelleFile');
  const firstWeekZelleFile    = document.getElementById('firstWeekZelleFile');

  if (admissionZelleChecked && (!admissionZelleFile || !admissionZelleFile.files.length)) {
    alert('Please attach your Zelle confirmation for the admission fee payment.');
    admissionZelleFile && admissionZelleFile.focus();
    return;
  }
  if (firstWeekZelleChecked && (!firstWeekZelleFile || !firstWeekZelleFile.files.length)) {
    alert('Please attach your Zelle confirmation for the first week fee payment.');
    firstWeekZelleFile && firstWeekZelleFile.focus();
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  // Collect text fields
  const data = Object.fromEntries(new FormData(form).entries());

  // Attach Zelle confirmation files as base64
  if (admissionZelleChecked && admissionZelleFile) {
    const result = await fileToBase64(admissionZelleFile);
    if (result) data['admissionZelleFile'] = result;
  }
  if (firstWeekZelleChecked && firstWeekZelleFile) {
    const result = await fileToBase64(firstWeekZelleFile);
    if (result) data['firstWeekZelleFile'] = result;
  }

  try {
    const res = await fetch('/.netlify/functions/send-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      document.getElementById('success-banner').style.display = 'block';
      form.reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const body = await res.json().catch(() => ({}));
      alert('There was a problem submitting: ' + (body.message || 'Please try again or email us directly.'));
    }
  } catch (err) {
    alert('Network error. Please check your connection and try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Payment Information';
  }
});
