// Compress images and convert to base64
function fileToBase64(input) {
  return new Promise((resolve) => {
    const file = input.files && input.files[0];
    if (!file) return resolve(null);

    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result.split(',')[1] });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1000;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        resolve({ name: file.name.replace(/\.[^.]+$/, '.jpg'), type: 'image/jpeg', data: compressed.split(',')[1] });
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
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
    dkAlert('Please select at least one payment option.');
    return;
  }

  // Zelle options require an attachment
  const admissionZelleChecked = form.elements['payAdmissionZelle'] && form.elements['payAdmissionZelle'].checked;
  const firstWeekZelleChecked = form.elements['payFirstWeekZelle'] && form.elements['payFirstWeekZelle'].checked;
  const admissionZelleFile    = document.getElementById('admissionZelleFile');
  const firstWeekZelleFile    = document.getElementById('firstWeekZelleFile');

  if (admissionZelleChecked && (!admissionZelleFile || !admissionZelleFile.files.length)) {
    dkAlert('Please attach your Zelle confirmation for the admission fee payment.');
    admissionZelleFile && admissionZelleFile.focus();
    return;
  }
  if (firstWeekZelleChecked && (!firstWeekZelleFile || !firstWeekZelleFile.files.length)) {
    dkAlert('Please attach your Zelle confirmation for the first week fee payment.');
    firstWeekZelleFile && firstWeekZelleFile.focus();
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  // Payment form fields
  const data = Object.fromEntries(new FormData(form).entries());

  // Pull full enrollment data (text + files) from sessionStorage
  try {
    const saved = sessionStorage.getItem('enrollmentData');
    if (saved) data.enrollmentData = JSON.parse(saved);
  } catch (_) {}

  // Compress and attach Zelle confirmation files
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
      sessionStorage.removeItem('enrollmentData');
      form.reset();
      window.location.href = 'index.html';
    } else {
      const body = await res.json().catch(() => ({}));
      dkAlert('There was a problem submitting: ' + (body.message || 'Please try again or email us directly.'));
    }
  } catch (err) {
    dkAlert('Network error. Please check your connection and try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Payment Information';
  }
});
