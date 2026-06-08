// Signature pad logic
(function () {
  const canvas = document.getElementById('sig-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let drawing = false;
  let hasSignature = false;

  function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const w = wrapper.clientWidth;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = w * ratio;
    canvas.height = 140 * ratio;
    canvas.style.width = w + 'px';
    canvas.style.height = '140px';
    ctx.scale(ratio, ratio);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function start(e) {
    e.preventDefault();
    drawing = true;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasSignature = true;
  }

  function stop(e) {
    if (!drawing) return;
    e.preventDefault();
    drawing = false;
    ctx.beginPath();
    if (hasSignature) {
      document.getElementById('signatureData').value = canvas.toDataURL('image/png');
    }
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stop);
  canvas.addEventListener('mouseleave', stop);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stop, { passive: false });

  document.getElementById('clearSig').addEventListener('click', function () {
    const ratio = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    hasSignature = false;
    document.getElementById('signatureData').value = '';
  });
})();
