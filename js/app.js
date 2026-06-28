/* ── Hero canvas: futuristic data-grid background ──────────────────────── */
(function () {
  var canvas = document.getElementById('hero-bg');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var TEAL = '46,151,168';   // #2E97A8
  var GOLD = '196,149,45';   // #C4952D
  var GRID = 64;             // cell size px
  var particles = [];
  var waves = [];
  var raf;
  var t = 0;

  function resize() {
    canvas.width = canvas.offsetWidth || window.innerWidth;
    canvas.height = canvas.offsetHeight || 700;
    buildParticles();
  }

  function buildParticles() {
    particles = [];
    var cols = Math.ceil(canvas.width / GRID) + 1;
    var rows = Math.ceil(canvas.height / GRID) + 1;
    for (var i = 0; i < 18; i++) {
      var col = Math.floor(Math.random() * cols);
      var row = Math.floor(Math.random() * rows);
      var axis = Math.random() > .5 ? 'h' : 'v';
      particles.push({
        x: col * GRID,
        y: row * GRID,
        axis: axis,
        speed: (.3 + Math.random() * .5) * (Math.random() > .5 ? 1 : -1),
        size: 1.5 + Math.random() * 1.5,
        opacity: .25 + Math.random() * .45,
        color: Math.random() > .8 ? GOLD : TEAL
      });
    }
  }

  function spawnWave() {
    waves.push({ x: canvas.width / 2, y: canvas.height / 2, r: 0, max: Math.max(canvas.width, canvas.height) * .65 });
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(' + TEAL + ',0.055)';
    ctx.lineWidth = 1;
    var cols = Math.ceil(canvas.width / GRID) + 1;
    var rows = Math.ceil(canvas.height / GRID) + 1;
    for (var c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * GRID, 0);
      ctx.lineTo(c * GRID, canvas.height);
      ctx.stroke();
    }
    for (var r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * GRID);
      ctx.lineTo(canvas.width, r * GRID);
      ctx.stroke();
    }

    /* grid intersection dots */
    for (var c2 = 0; c2 <= cols; c2++) {
      for (var r2 = 0; r2 <= rows; r2++) {
        var pulse = .08 + .04 * Math.sin(t * .018 + c2 * .7 + r2 * .5);
        ctx.beginPath();
        ctx.arc(c2 * GRID, r2 * GRID, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + TEAL + ',' + pulse + ')';
        ctx.fill();
      }
    }
  }

  function drawWaves() {
    waves = waves.filter(function (w) { return w.r < w.max; });
    waves.forEach(function (w) {
      var progress = w.r / w.max;
      var alpha = (1 - progress) * 0.06;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(' + TEAL + ',' + alpha + ')';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      w.r += 1.4;
    });
  }

  function drawParticles() {
    particles.forEach(function (p) {
      if (p.axis === 'h') p.x += p.speed;
      else p.y += p.speed;

      /* wrap */
      if (p.x > canvas.width + GRID) p.x = -GRID;
      if (p.x < -GRID) p.x = canvas.width + GRID;
      if (p.y > canvas.height + GRID) p.y = -GRID;
      if (p.y < -GRID) p.y = canvas.height + GRID;

      /* snap to nearest grid line on perpendicular axis */
      var drawX = p.axis === 'h' ? p.x : Math.round(p.x / GRID) * GRID;
      var drawY = p.axis === 'v' ? p.y : Math.round(p.y / GRID) * GRID;

      /* glow */
      var grd = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, p.size * 4);
      grd.addColorStop(0, 'rgba(' + p.color + ',' + p.opacity + ')');
      grd.addColorStop(1, 'rgba(' + p.color + ',0)');
      ctx.beginPath();
      ctx.arc(drawX, drawY, p.size * 4, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      /* core dot */
      ctx.beginPath();
      ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.color + ',' + (p.opacity * 1.8) + ')';
      ctx.fill();
    });
  }

  /* rare diagonal scan line */
  var scanY = -200, scanActive = false;
  function drawScan() {
    if (!scanActive) return;
    var alpha = .03 * Math.max(0, 1 - Math.abs(scanY - canvas.height / 2) / (canvas.height / 2));
    ctx.fillStyle = 'rgba(' + TEAL + ',' + alpha + ')';
    ctx.fillRect(0, scanY - 2, canvas.width, 4);
    scanY += 2;
    if (scanY > canvas.height + 200) scanActive = false;
  }

  function frame() {
    t++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawWaves();
    drawParticles();
    drawScan();

    if (t % 320 === 0) spawnWave();
    if (t % 480 === 0) { scanY = -200; scanActive = true; }
    raf = requestAnimationFrame(frame);
  }

  resize();
  spawnWave();
  frame();

  var ro = new ResizeObserver(function () { resize(); });
  ro.observe(canvas.parentElement || canvas);
  window.addEventListener('resize', resize, { passive: true });

  /* pause when tab hidden */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(raf);
    else frame();
  });
})();

/* ── Scroll-triggered animate-in ─────────────────────────────────────────── */
(function () {
  var els = document.querySelectorAll('[data-animate]');
  if (!els.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('vc-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ── Metric value animated count-up ──────────────────────────────────────── */
(function () {
  var metrics = document.querySelectorAll('.vc-metric-value');
  if (!metrics.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      io.unobserve(el);
      el.classList.add('counted');
    });
  }, { threshold: 0.5 });
  metrics.forEach(function (el) { io.observe(el); });
})();

/* ── Nav scroll spy ──────────────────────────────────────────────────────── */
(function () {
  var links = document.querySelectorAll('.nav-link[data-section]');
  if (!links.length) return;
  var ids = Array.from(links).map(function (l) { return l.dataset.section; });
  var sections = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if (!sections.length) return;

  function setActive(id) {
    links.forEach(function (l) {
      l.classList.toggle('vc-active', l.dataset.section === id);
    });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) setActive(e.target.id);
    });
  }, { rootMargin: '-15% 0px -75% 0px', threshold: 0 });

  sections.forEach(function (s) { io.observe(s); });
})();
