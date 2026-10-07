/* İzometrik BIM model çizici (canvas, kütüphanesiz).
   BIMModel.mount(canvas, opts) -> { set(partial), destroy() }
   opts: { bays:[nx,ny], floors, stage:0..1, layers:{arc,str,mep}, seed, rot, clash:true, labels:true }
   Aşamalar: 0–.22 nokta bulutu · .18–.42 aks + kolon · .38–.62 döşeme · .58–.8 MEP · .78–1 cephe */
(function () {
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function css(name, el) { return getComputedStyle(el || document.documentElement).getPropertyValue(name).trim() || '#000'; }

  function mount(canvas, opts) {
    var o = Object.assign({ bays: [4, 3], floors: 6, stage: 1, layers: { arc: true, str: true, mep: true }, seed: 7, rot: 0, clash: true, labels: true, fh: 0.85 }, opts || {});
    var ctx = canvas.getContext('2d');
    var pts = null, raf = 0, W = 0, H = 0, dpr = 1;

    function buildPoints() {
      var r = rng(o.seed), nx = o.bays[0], ny = o.bays[1], hz = o.floors * o.fh, out = [];
      var n = Math.min(2600, 380 * o.floors);
      for (var i = 0; i < n; i++) {
        var f = r(), x, y, z;
        if (f < .3) { x = r() * nx; y = ny; z = r() * hz; }            // ön cephe
        else if (f < .55) { x = nx; y = r() * ny; z = r() * hz; }      // yan cephe
        else if (f < .7) { x = r() * nx; y = r() * ny; z = hz; }       // çatı
        else { x = r() * nx; y = r() * ny; z = Math.floor(r() * o.floors) * o.fh; } // döşemeler
        out.push([x + (r() - .5) * .06, y + (r() - .5) * .06, z + (r() - .5) * .04, r()]);
      }
      return out;
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, rect.width); H = Math.max(1, rect.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      draw();
    }

    function projector() {
      var nx = o.bays[0], ny = o.bays[1], hz = o.floors * o.fh;
      var cx = nx / 2, cy = ny / 2, c = Math.cos(o.rot), s = Math.sin(o.rot);
      var C30 = Math.cos(Math.PI / 6), S30 = .5;
      function raw(x, y, z) {
        var dx = x - cx, dy = y - cy, rx = dx * c - dy * s, ry = dx * s + dy * c;
        return [(rx - ry) * C30, (rx + ry) * S30 - z];
      }
      var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      [[0,0],[nx,0],[0,ny],[nx,ny]].forEach(function (p) { [0, hz + .3].forEach(function (z) {
        var q = raw(p[0], p[1], z); minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]); minY = Math.min(minY, q[1]); maxY = Math.max(maxY, q[1]);
      }); });
      var pad = Math.min(W, H) * .1;
      var k = Math.min((W - pad * 2) / (maxX - minX), (H - pad * 2) / (maxY - minY));
      var ox = (W - (maxX - minX) * k) / 2 - minX * k, oy = (H - (maxY - minY) * k) / 2 - minY * k;
      return function (x, y, z) { var q = raw(x, y, z); return [q[0] * k + ox, q[1] * k + oy]; };
    }

    function line(P, a, b, t) {
      var p = P(a[0], a[1], a[2]), q = P(b[0], b[1], b[2]);
      t = t == null ? 1 : t; if (t <= 0) return;
      ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t);
    }
    function poly(P, arr) { arr.forEach(function (v, i) { var p = P(v[0], v[1], v[2]); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath(); }

    function draw() {
      if (!W) return;
      var t = o.stage, L = o.layers, nx = o.bays[0], ny = o.bays[1], F = o.floors, fh = o.fh, hz = F * fh;
      var ink = css('--ink'), ink2 = css('--ink-2'), rule = css('--rule'), sig = css('--signal'), ok = css('--ok');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var P = projector();
      var lw = Math.max(.6, Math.min(W, H) / 520);

      // 1) Nokta bulutu
      var pc = seg(t, 0, .12) * (1 - seg(t, .3, .55));
      if (pc > 0 && L.arc !== false) {
        if (!pts) pts = buildPoints();
        ctx.fillStyle = ink2; ctx.globalAlpha = .75 * pc;
        var lim = Math.floor(pts.length * seg(t, 0, .2));
        for (var i = 0; i < lim; i++) { var q = P(pts[i][0], pts[i][1], pts[i][2]); ctx.fillRect(q[0], q[1], 1.3, 1.3); }
        ctx.globalAlpha = 1;
      }

      // 2) Zemin aksları
      var ax = seg(t, .16, .3);
      if (ax > 0) {
        ctx.strokeStyle = rule; ctx.lineWidth = lw; ctx.setLineDash([4, 4]); ctx.beginPath();
        for (var gx = 0; gx <= nx; gx++) line(P, [gx, -.6, 0], [gx, ny + .6, 0], ax);
        for (var gy = 0; gy <= ny; gy++) line(P, [-.6, gy, 0], [nx + .6, gy, 0], ax);
        ctx.stroke(); ctx.setLineDash([]);
        if (o.labels && ax > .9) {
          ctx.fillStyle = ink2; ctx.font = '500 ' + Math.max(9, lw * 10) + 'px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          for (gx = 0; gx <= nx; gx++) { var b = P(gx, -.95, 0); ctx.beginPath(); ctx.strokeStyle = ink2; ctx.arc(b[0], b[1], 8 * lw, 0, 7); ctx.stroke(); ctx.fillText(String.fromCharCode(65 + gx), b[0], b[1] + .5); }
          for (gy = 0; gy <= ny; gy++) { var b2 = P(-.95, gy, 0); ctx.beginPath(); ctx.arc(b2[0], b2[1], 8 * lw, 0, 7); ctx.stroke(); ctx.fillText(String(gy + 1), b2[0], b2[1] + .5); }
        }
      }

      // 3) Döşemeler (kat kat)
      var sl = seg(t, .36, .62);
      if (sl > 0 && L.str !== false) {
        var floorsShown = sl * (F + 1);
        for (var f = 0; f <= F; f++) {
          var a = clamp(floorsShown - f, 0, 1); if (a <= 0) break;
          var z = f * fh;
          ctx.globalAlpha = a;
          ctx.beginPath(); poly(P, [[0,0,z],[nx,0,z],[nx,ny,z],[0,ny,z]]);
          ctx.fillStyle = ink; ctx.globalAlpha = a * .06; ctx.fill();
          ctx.globalAlpha = a; ctx.strokeStyle = ink; ctx.lineWidth = lw * 1.1; ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // 4) Kolonlar
      var co = seg(t, .22, .5);
      if (co > 0 && L.str !== false) {
        ctx.strokeStyle = ink; ctx.lineWidth = lw * 1.6; ctx.beginPath();
        for (var cx = 0; cx <= nx; cx++) for (var cy = 0; cy <= ny; cy++) line(P, [cx, cy, 0], [cx, cy, hz], co);
        ctx.stroke();
      }

      // 5) MEP: şaft + her katta ana kanal
      var me = seg(t, .56, .8);
      var clashX = Math.max(1, Math.floor(nx / 2)), clashF = Math.max(1, Math.floor(F * .6));
      var resolved = seg(t, .9, 1);
      if (me > 0 && L.mep !== false) {
        ctx.strokeStyle = sig; ctx.lineWidth = lw * 2.2; ctx.lineCap = 'round'; ctx.beginPath();
        line(P, [nx - .35, .35, 0], [nx - .35, .35, hz], me);
        for (f = 1; f <= F; f++) {
          var fz = f * fh - .16 - (f === clashF ? .08 * (1 - resolved) : 0) + (f === clashF ? .0 : 0);
          var lift = (f === clashF) ? (1 - resolved) * 0 : 0;
          var dz = f * fh - .16 + lift;
          var p = clamp(me * (F + 1) - f, 0, 1);
          line(P, [nx - .35, .35, dz], [.35, .35, dz], p);
          line(P, [.35, .35, dz], [.35, ny - .35, dz], clamp(p * 2 - 1, 0, 1));
        }
        ctx.stroke();
        ctx.lineWidth = lw; ctx.globalAlpha = .55; ctx.beginPath();
        for (f = 1; f <= F; f++) { dz = f * fh - .3; line(P, [nx - .7, .7, dz], [nx - .7, ny - .5, dz], clamp(me * (F + 1) - f, 0, 1)); }
        ctx.stroke(); ctx.globalAlpha = 1;
      }

      // 6) Cephe
      var fa = seg(t, .76, 1);
      if (fa > 0 && L.arc !== false) {
        ctx.lineWidth = lw * .8; ctx.strokeStyle = ink2;
        var faces = [
          function (u, v) { return [u * nx, ny, v * hz]; },   // ön
          function (u, v) { return [nx, u * ny, v * hz]; }    // yan
        ];
        faces.forEach(function (fc, idx) {
          var cols = (idx ? ny : nx) * 3;
          ctx.beginPath(); poly(P, [fc(0,0), fc(1,0), fc(1,1), fc(0,1)]);
          ctx.fillStyle = ink; ctx.globalAlpha = .05 * fa; ctx.fill(); ctx.globalAlpha = .9 * fa;
          ctx.beginPath();
          for (var m = 0; m <= cols; m++) { var u = m / cols, a1 = fc(u, 0), a2 = fc(u, 1); line(P, a1, a2, fa); }
          for (var fl = 0; fl <= F; fl++) { var v = fl / F; line(P, fc(0, v), fc(1, v), fa); }
          ctx.stroke(); ctx.globalAlpha = 1;
        });
        // çatı parapeti
        ctx.strokeStyle = ink; ctx.lineWidth = lw * 1.4; ctx.beginPath(); poly(P, [[0,0,hz+.18],[nx,0,hz+.18],[nx,ny,hz+.18],[0,ny,hz+.18]]); ctx.globalAlpha = fa; ctx.stroke(); ctx.globalAlpha = 1;
      }

      // 7) Çakışma işareti
      if (o.clash && L.mep !== false && L.str !== false && t > .64) {
        var cp = P(clashX, .35, clashF * fh - .16);
        var col = resolved > .5 ? ok : sig;
        var r = 7 * lw + (resolved > .5 ? 0 : 3 * lw * Math.abs(Math.sin(performance.now() / 260)));
        ctx.strokeStyle = col; ctx.lineWidth = lw * 1.5; ctx.beginPath(); ctx.arc(cp[0], cp[1], r, 0, 7); ctx.stroke();
        if (o.labels) {
          var tx = cp[0] + 18 * lw, ty = cp[1] - 26 * lw;
          ctx.beginPath(); ctx.moveTo(cp[0] + r * .7, cp[1] - r * .7); ctx.lineTo(tx, ty); ctx.lineTo(tx + 120 * lw, ty); ctx.stroke();
          ctx.fillStyle = col; ctx.font = '600 ' + Math.max(9, lw * 10.5) + 'px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
          ctx.fillText(resolved > .5 ? 'CLASH #0142 · RESOLVED' : 'CLASH #0142 · MEP×STR', tx, ty - 4);
        }
        if (resolved <= .5 && !raf && !reduce()) pulse();
      }
    }

    function reduce() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
    var pulsing = false;
    function pulse() {
      if (pulsing) return; pulsing = true;
      (function loop() {
        if (!pulsing) return;
        if (o.stage < .9 && o.stage > .64 && visible) { draw(); requestAnimationFrame(loop); } else { pulsing = false; }
      })();
    }

    var visible = true, io = null;
    if ('IntersectionObserver' in window) { io = new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) draw(); }); io.observe(canvas); }
    var ro = ('ResizeObserver' in window) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas); else window.addEventListener('resize', resize);
    var mo = new MutationObserver(draw); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
    resize();

    return {
      set: function (p) { if (p.bays || p.floors || p.seed) pts = null; Object.assign(o, p); draw(); },
      get: function () { return o; },
      draw: draw,
      destroy: function () { pulsing = false; if (io) io.disconnect(); if (ro) ro.disconnect(); mo.disconnect(); }
    };
  }

  // Sahneyi zamanla oynat (0 -> 1)
  function play(model, ms, onStep) {
    var red = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (red) { model.set({ stage: 1 }); onStep && onStep(1); return; }
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / ms), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      model.set({ stage: e }); onStep && onStep(e);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  window.BIMModel = { mount: mount, play: play };
})();
