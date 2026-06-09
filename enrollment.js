// Enrollment form submission
document.getElementById('enrollmentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = e.target;

  // Basic validation
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  if (!document.getElementById('handbookAck').checked) {
    alert('Please acknowledge the parent handbook before submitting.');
    return;
  }
  const signerName = document.getElementById('signerName').value.trim();
  if (!signerName) {
    alert('Please type your full name as your electronic signature before submitting.');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const res = await fetch('/.netlify/functions/send-enrollment', {
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
      alert('There was a problem submitting the form: ' + (body.message || 'Please try again or email us directly.'));
    }
  } catch (err) {
    alert('Network error. Please check your connection and try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Enrollment Form';
  }
});
