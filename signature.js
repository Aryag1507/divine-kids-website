// Initializes a signature pad on a given canvas element
function initSignaturePad(canvas, hiddenInput, clearBtn) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let drawing = false;

  function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const ratio = window.devicePixelRatio || 1;
    const w = wrapper.clientWidth;
    const h = parseInt(canvas.dataset.height || '120');
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(ratio, ratio);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
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
    if (hiddenInput) hiddenInput.value = canvas.toDataURL('image/png');
  }

  function stop(e) {
    if (!drawing) return;
    drawing = false;
    ctx.beginPath();
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stop);
  canvas.addEventListener('mouseleave', stop);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stop, { passive: false });

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      const ratio = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
      if (hiddenInput) hiddenInput.value = '';
    });
  }
}

// Initialize all signature pads on the page
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('canvas.sig-pad').forEach(function (canvas) {
    const id = canvas.id;
    const hiddenInput = id ? document.getElementById(id + '-data') : null;
    const clearBtn = id ? document.getElementById(id + '-clear') : null;
    initSignaturePad(canvas, hiddenInput, clearBtn);
  });
});
