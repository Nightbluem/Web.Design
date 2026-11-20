/* Ortak davranışlar: dil, menü, görünür olunca çizim, sayaçlar, form. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* Dil */
  function setLang(l) {
    root.lang = l;
    document.querySelectorAll('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === l)); });
    store('lang', l);
    document.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  }
  setLang(store('lang') === 'en' ? 'en' : 'tr');
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-lang]'); if (b) setLang(b.dataset.lang); });

  /* Pafta menüsü */
  var reg = document.getElementById('register'), opener = document.getElementById('menu-open');
  function openReg() { if (!reg) return; reg.hidden = false; opener.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; var f = reg.querySelector('a, button'); f && f.focus(); }
  function closeReg() { if (!reg || reg.hidden) return; reg.hidden = true; opener.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; opener.focus(); }
  if (opener) opener.addEventListener('click', openReg);
  document.querySelectorAll('[data-close-register]').forEach(function (b) { b.addEventListener('click', closeReg); });
  document.addEventListener('keydown', function (e) {
    if (!reg || reg.hidden) return;
    if (e.key === 'Escape') closeReg();
    if (e.key === 'Tab') {
      var f = reg.querySelectorAll('a, button'); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* Görünür olunca: .draw / .rise / [data-count] */
  function countUp(el) {
    var end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, suf = el.dataset.suffix || '';
    if (reduce || isNaN(end)) { el.textContent = (isNaN(end) ? el.dataset.count : end.toLocaleString(root.lang === 'en' ? 'en-GB' : 'tr-TR', { minimumFractionDigits: dec, maximumFractionDigits: dec })) + suf; return; }
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / 1400), v = end * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toLocaleString(root.lang === 'en' ? 'en-GB' : 'tr-TR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  var targets = document.querySelectorAll('.draw, .rise, [data-count]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('on'); if (en.target.dataset.count) countUp(en.target); io.unobserve(en.target);
    }); }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else targets.forEach(function (t) { t.classList.add('on'); if (t.dataset.count) countUp(t); });

  /* Örnek form */
  var form = document.getElementById('contact-form');
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); var m = document.getElementById('form-msg'); if (m) m.hidden = false; });
})();
