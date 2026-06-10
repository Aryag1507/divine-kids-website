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
      showConfirmation();
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

function showConfirmation() {
  const overlay = document.createElement('div');
  overlay.className = 'dk-modal-overlay';
  overlay.innerHTML = `
    <div class="dk-modal" role="dialog" aria-modal="true" style="max-width:480px;">
      <div class="dk-modal-header" style="background:#e8720c;">
        <span class="dk-modal-icon">✅</span>
        <span>Enrollment Complete!</span>
      </div>
      <div class="dk-modal-body" style="text-align:center;padding:28px 24px;">
        <div style="font-size:3rem;margin-bottom:12px;">🎉</div>
        <h3 style="color:var(--primary);margin-bottom:12px;font-size:1.2rem;">Thank You!</h3>
        <p style="margin-bottom:10px;">Your enrollment and payment information have been successfully submitted.</p>
        <p style="color:var(--muted);font-size:.875rem;">A confirmation email has been sent to you. We look forward to welcoming your child to <strong>Divine Kids</strong>!</p>
        <div style="margin-top:20px;padding:12px;background:#fff8f0;border-radius:8px;font-size:.85rem;color:var(--muted);">
          Redirecting you to the home page in <span id="countdown">5</span> seconds…
        </div>
      </div>
      <div class="dk-modal-footer" style="justify-content:center;">
        <button class="dk-modal-btn" id="confirmOkBtn">Go to Home Page</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const redirect = () => { overlay.remove(); window.location.href = 'index.html'; };

  document.getElementById('confirmOkBtn').addEventListener('click', redirect);

  // Countdown timer
  let seconds = 5;
  const countEl = document.getElementById('countdown');
  const timer = setInterval(() => {
    seconds--;
    if (countEl) countEl.textContent = seconds;
    if (seconds <= 0) { clearInterval(timer); redirect(); }
  }, 1000);
}
