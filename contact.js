// Contact form submission
document.getElementById('contactForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = e.target;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const res = await fetch('/.netlify/functions/send-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      document.getElementById('contact-success').style.display = 'block';
      form.reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert('There was a problem sending your message. Please email us directly at Divinekids4soul@gmail.com');
    }
  } catch (err) {
    alert('Network error. Please try again or email us at Divinekids4soul@gmail.com');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
  }
});
