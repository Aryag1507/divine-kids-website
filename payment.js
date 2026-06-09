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

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  const formData = new FormData(form);

  try {
    const res = await fetch('/.netlify/functions/send-payment', {
      method: 'POST',
      body: formData,
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
