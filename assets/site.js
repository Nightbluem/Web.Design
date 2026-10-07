/* Ortak davranışlar: dil, pafta menüsü, nişangah imleç + antet koordinatı,
   sayfa geçiş perdesi, görünür olunca çizim, sayaçlar, form. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function sstore(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }

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

  /* Nişangah imleç + antetteki koordinat */
  var xy = document.getElementById('tb-xy');
  if (!reduce && window.matchMedia && matchMedia('(pointer: fine)').matches) {
    var xh = document.createElement('div');
    xh.className = 'crosshair'; xh.setAttribute('aria-hidden', 'true');
    xh.innerHTML = '<div class="h"></div><div class="v"></div><div class="box"></div><div class="tag"></div>';
    document.body.appendChild(xh); root.classList.add('has-xh');
    var H = xh.children[0], V = xh.children[1], B = xh.children[2], T = xh.children[3], mx = -100, my = -100, ticking = false;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!ticking) { ticking = true; requestAnimationFrame(function () {
        ticking = false;
        var snap = e.target.closest && e.target.closest('a, button, summary, input, select, textarea, [data-snap]');
        var x = mx, y = my;
        if (snap) { var r = snap.getBoundingClientRect(); if (r.width < 400 && r.height < 120) { x = r.left + r.width / 2; y = r.top + r.height / 2; } }
        xh.classList.toggle('snap', !!snap);
        H.style.transform = 'translateY(' + y + 'px)'; V.style.transform = 'translateX(' + x + 'px)';
        B.style.left = x + 'px'; B.style.top = y + 'px';
        T.style.left = x + 'px'; T.style.top = y + 'px';
        var gx = ((mx + window.scrollX) / 10).toFixed(1), gy = ((my + window.scrollY) / 10).toFixed(1);
        T.textContent = 'X ' + gx + '  Y ' + gy;
        if (xy) xy.textContent = 'X ' + gx + ' · Y ' + gy;
      }); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { xh.style.opacity = 0; });
    document.addEventListener('pointerenter', function () { xh.style.opacity = 1; });
  }

  /* Antet görünürlüğü */
  function tb() { root.classList.toggle('tb-on', window.scrollY > window.innerHeight * .6); }
  window.addEventListener('scroll', tb, { passive: true }); tb();

  /* Sayfa geçiş perdesi */
  var wipe = document.createElement('div'); wipe.className = 'wipe'; wipe.setAttribute('aria-hidden', 'true');
  wipe.innerHTML = '<span class="mono"></span>';
  document.body.appendChild(wipe);
  var incoming = sstore('wipe');
  if (incoming && !reduce) { wipe.firstChild.textContent = incoming; wipe.classList.add('out'); sstore('wipe', null); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || reduce || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === '_blank') return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|https?:)/.test(href) || !/\.html|^\.\/?(#|$)/.test(href)) return;
    e.preventDefault();
    sstore('wipe', (a.dataset.sheet || 'A-000') + ' → ' + (a.dataset.label || ''));
    wipe.firstChild.textContent = sstore('wipe') || '';
    wipe.classList.remove('out'); wipe.classList.add('in');
    setTimeout(function () { location.href = a.href; }, 420);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) { wipe.classList.remove('in'); } });

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
