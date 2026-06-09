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
  submitBtn.textContent = 'Saving…';

  // Collect all text fields
  const data = Object.fromEntries(new FormData(form).entries());

  // Collect and compress all file attachments
  const fileFields = ['insuranceCardFile', 'affidavitFile', 'admissionDocFile', 'vaccinationRecordsFile'];
  for (const fieldName of fileFields) {
    const input = document.getElementById(fieldName) || form.elements[fieldName];
    if (input) {
      const result = await fileToBase64(input);
      if (result) data[fieldName] = result;
    }
  }

  // Save everything to sessionStorage — no email sent yet
  // Payment page will send ONE combined email with everything
  try {
    sessionStorage.setItem('enrollmentData', JSON.stringify(data));
  } catch (err) {
    // sessionStorage full (files too large) — save text only
    const textOnly = Object.fromEntries(
      Object.entries(data).filter(([k]) => !fileFields.includes(k))
    );
    sessionStorage.setItem('enrollmentData', JSON.stringify(textOnly));
  }

  form.reset();
  submitBtn.disabled = false;
  submitBtn.textContent = 'Submit Enrollment Form';
  window.location.href = 'payment.html';
});
