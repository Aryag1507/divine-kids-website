// Custom alert replacement — use dkAlert(message) instead of alert()
function dkAlert(message, title) {
  title = title || 'Divine Kids';

  const overlay = document.createElement('div');
  overlay.className = 'dk-modal-overlay';
  overlay.innerHTML = `
    <div class="dk-modal" role="dialog" aria-modal="true">
      <div class="dk-modal-header">
        <span class="dk-modal-icon">⚠️</span>
        <span>${title}</span>
      </div>
      <div class="dk-modal-body">${message}</div>
      <div class="dk-modal-footer">
        <button class="dk-modal-btn">OK</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  return new Promise((resolve) => {
    const close = () => {
      overlay.remove();
      resolve();
    };
    overlay.querySelector('.dk-modal-btn').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
    // Focus the OK button for keyboard accessibility
    overlay.querySelector('.dk-modal-btn').focus();
  });
}
