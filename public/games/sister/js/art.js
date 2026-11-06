/* 姐姐的不对劲 · art：代码画的插画
 * 所有画面和第 12 页（night-crowd）是同一套画法：墨黑到暗青的林子、雾里的细树干、漂移的雾、
 * 篝火的暖光和火星、红兜帽的剪影。不描边、不画照片细节，最后加颗粒和暗角。
 * 每个场景有固定的随机种子，同一个场景永远是同一个构图。画面里没有字。
 *
 * G.art.paint(name, ctx, w, h, t, opts) -> bool
 *   在 ctx 当前的坐标系里把场景画满 (0,0)–(w,h)。t 是秒数（火光闪动、雾漂移），静态场景忽略。
 *   opts.grain === false / opts.vignette === false：不加自带的颗粒 / 暗角（屏幕已经用了 NK.fx 时）。
 *   opts.fit === 'cover'：按场景自己的比例铺满再裁（横图放进竖屏时用），opts.fx / opts.fy（0–1，
 *   同 CSS object-position）决定露出哪一部分。默认是「构图」模式，见下面。
 * G.art.mount(el, name, opts) -> { canvas, stop() }
 *   在 el 里铺满一个 canvas（按 devicePixelRatio，最多 opts.dpr || 2 倍，跟着 el 的尺寸变）。有动画的
 *   场景用 requestAnimationFrame 播放（opts.fps || 30 帧/秒）；G.reducedMotion() 或 opts.still 时只画一帧。
 *   opts 同 paint，另有 opts.t：起始秒数。canvas 被移出文档后自己停下；stop() 停止，画面留着。
 * G.art.url(name, w, h, opts) -> 'data:image/jpeg;…'
 *   画一张 w×h 像素的静态图给 <img> 用（相册缩略图、聊天 / 朋友圈图片），按 name + 尺寸 + fit 缓存。
 *   省略 w, h 时用场景的默认尺寸。opts 只认 fit / fx / fy。
 * G.art.features(name, w, h, opts) -> { key: { x, y, r } | { x, y, w, h } }
 *   画面里可以放热点的东西，全部是 0–1 的比例：{x,y,r} 是圆心和半径（r 按宽度算），
 *   {x,y,w,h} 是左上角和宽高（裁在画面里）。w, h 省略时按场景默认尺寸（竖屏是 420×750）；
 *   用了 fit: 'cover' 就把同样的 opts 传进来。
 * G.art.size(name) -> { w, h }：默认尺寸（也就是比例）。G.art.names()：所有场景名。
 *
 * 构图：每个场景有设计尺寸（竖屏 420×750、横 800×600 / 960×540、方 600×600、封面 600×800）。
 * 换成别的比例时，天、林子、雾铺满整幅，主体按 k = min(w / W, h / H) 缩放，位置按 w、h 的比例摆，
 * 所以主体不会被裁掉。
 */
(function () {
  'use strict';

  var G = (window.G = window.G || {});
  var TAU = Math.PI * 2;
  var SCENES = {};
  var PX = 1; // canvas pixels per drawing unit (canvas blur radii are in canvas pixels)

  /* ---------- 小工具 ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seeded(seed) {
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }
  function hash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function rgba(c, a) { return 'rgba(' + c + ',' + clamp(a, 0, 1).toFixed(3) + ')'; }
  function rgb(r, g, b) { return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; }
  function canvas(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }
  function blur(x, v) { if ('filter' in x) x.filter = v > 0.05 ? 'blur(' + (v * PX).toFixed(2) + 'px)' : 'none'; }
  function lin(x, x0, y0, x1, y1, stops) {
    var g = x.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    return g;
  }
  /** Elliptical radial gradient blob; stops [[0, color], …]. */
  function blob(x, cx, cy, rx, ry, stops, op) {
    if (rx <= 0 || ry <= 0) return;
    x.save();
    if (op) x.globalCompositeOperation = op;
    x.translate(cx, cy);
    x.scale(rx, ry);
    var g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    x.fillStyle = g;
    x.beginPath();
    x.arc(0, 0, 1, 0, TAU);
    x.fill();
    x.restore();
  }
  function ell(x, cx, cy, rx, ry, rot) {
    x.beginPath();
    x.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, TAU);
    x.fill();
  }

  /* ---------- 柔光点（第 12 页的 sprite） ---------- */
  var sprites = {};
  function sprite(c) {
    if (sprites[c]) return sprites[c];
    var s = canvas(64, 64), x = s.getContext('2d');
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, rgba(c, 1));
    g.addColorStop(0.4, rgba(c, 0.42));
    g.addColorStop(1, rgba(c, 0));
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return (sprites[c] = s);
  }
  /** Additive soft light, stretched to rx × ry. */
  function glow(x, cx, cy, rx, ry, c, a) {
    if (a <= 0.002) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = Math.min(1, a);
    x.drawImage(sprite(c), cx - rx, cy - ry, rx * 2, ry * 2);
    x.restore();
  }

  /* ---------- 剪影：SVG 路径 → Path2D ---------- */
  var paths = {};
  function P(d, ox, oy, sx, sy, rot) {
    var base = paths[d] || (paths[d] = new Path2D(d));
    var p = new Path2D(), c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    if (sy == null) sy = Math.abs(sx);
    p.addPath(base, { a: c * sx, b: s * sx, c: -s * sy, d: c * sy, e: ox, f: oy });
    return p;
  }
  /** Fill shapes as one silhouette. rim { c, a, dx, dy, blur }: a light edge drawn first, offset toward the light. */
  function sil(x, shapes, ox, oy, sx, sy, rot, fill, rim) {
    var ps = shapes.map(function (d) { return P(d, ox, oy, sx, sy, rot); });
    if (rim) {
      [].concat(rim).forEach(function (r) {
        x.save();
        blur(x, r.blur || 0);
        x.globalCompositeOperation = 'lighter';
        x.fillStyle = rgba(r.c, r.a);
        x.translate(r.dx || 0, r.dy || 0);
        ps.forEach(function (p) { x.fill(p); });
        x.restore();
      });
    }
    if (fill) {
      x.fillStyle = fill;
      ps.forEach(function (p) { x.fill(p); });
    }
    return ps;
  }

  /**
   * 单独一层的剪影：shape(y) 用 y 当前的 fillStyle / strokeStyle 画出形状（fill、粗线都行），
   * 之后的光只落在形状上（source-atop）。o.fill 底色；o.rim { c, dx, dy, blur }：形状往 (dx, dy)
   * 挪开以后剩下的那条边是亮的（光从反方向来，没有描边）；o.shade(y) 再上光；o.alpha、o.op 合成用。
   */
  function cutout(x, w, h, shape, o) {
    var c = canvas(w * PX, h * PX), y = c.getContext('2d');
    y.scale(PX, PX);
    y.lineCap = y.lineJoin = 'round';
    y.fillStyle = y.strokeStyle = o.rim ? o.rim.c : o.fill;
    shape(y);
    y.globalCompositeOperation = 'source-atop';
    if (o.rim) {
      y.save();
      blur(y, o.rim.blur || 0);
      y.translate(o.rim.dx || 0, o.rim.dy || 0);
      y.fillStyle = y.strokeStyle = o.fill;
      shape(y);
      y.restore();
    }
    if (o.shade) { y.save(); o.shade(y); y.restore(); }
    x.save();
    if (o.op) x.globalCompositeOperation = o.op;
    x.globalAlpha = o.alpha == null ? 1 : o.alpha;
    x.drawImage(c, 0, 0, w, h);
    x.restore();
  }
  /** 只要亮边：在一张单独的图层 y 上画形状，再挖掉挪开 (dx, dy) 的形状。 */
  function rimOnly(y, shape, c, dx, dy, bl) {
    y.save();
    y.lineCap = y.lineJoin = 'round';
    y.fillStyle = y.strokeStyle = c;
    shape(y);
    y.globalCompositeOperation = 'destination-out';
    y.globalAlpha = 1;
    blur(y, bl || 0);
    y.translate(dx, dy);
    y.fillStyle = y.strokeStyle = '#000';
    shape(y);
    y.restore();
  }
  /** 一节圆头的粗线（手指、胳膊）：pts [[x, y], …]，宽 wd。 */
  function limb(x, pts, wd) {
    x.lineWidth = wd;
    x.beginPath();
    x.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]);
    x.stroke();
  }

  /* ---------- 颗粒、暗角 ---------- */
  var noise = null;
  function noiseTile() {
    if (noise) return noise;
    var c = canvas(160, 160), x = c.getContext('2d'), d = x.createImageData(160, 160), r = seeded(9157);
    for (var i = 0; i < d.data.length; i += 4) {
      var v = r() * 255 | 0;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 40 + (r() * 90 | 0);
    }
    x.putImageData(d, 0, 0);
    return (noise = c);
  }
  function grain(x, w, h, a, t) {
    var f = Math.floor((t || 0) / 0.12), ox = Math.floor(hash(f) * 160), oy = Math.floor(hash(f + 0.5) * 160);
    x.save();
    x.globalCompositeOperation = 'overlay';
    x.globalAlpha = a;
    x.fillStyle = x.createPattern(noiseTile(), 'repeat');
    x.translate(-ox, -oy);
    x.fillRect(ox, oy, w, h);
    x.globalCompositeOperation = 'lighter'; // a little lift so the grain also shows in the blacks
    x.globalAlpha = a * 0.09;
    x.fillRect(ox, oy, w, h);
    x.restore();
  }
  function vignette(x, w, h, a, c) {
    x.save();
    x.translate(w / 2, h * 0.54);
    x.scale(w * 0.8, h * 0.74);
    var g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0.42, rgba(c || '0,0,0', 0));
    g.addColorStop(1, rgba(c || '0,0,0', a));
    x.fillStyle = g;
    x.fillRect(-1, -1, 2, 2);
    x.restore();
  }

  /* ---------- 第 12 页的林子 ---------- */
  function trunk(x, cx, w, top, bot, lean) {
    x.beginPath();
    x.moveTo(cx - w / 2, bot);
    x.lineTo(cx - w * 0.32 + lean, top);
    x.lineTo(cx + w * 0.32 + lean, top);
    x.lineTo(cx + w / 2, bot);
    x.closePath();
    x.fill();
  }
  /**
   * 墨黑到暗青的底色、雾里的细树干、树冠、粗树干、地上的碎石（第 12 页 drawWoods）。
   * o.ground 地面高度（比例）；o.bg === false 只画树；o.thin / o.crowns / o.thick 数量；o.hx 雾光的横向位置。
   */
  function woods(x, w, h, k, rnd, o) {
    o = o || {};
    var f = o.ground || 0.66, gy = f * h, span = w / k / 420, i, n;
    if (o.bg !== false) {
      x.fillStyle = lin(x, 0, 0, 0, h, [[0, '#010203'], [f * 0.76, '#05090b'], [f, o.band || '#0a1113'], [Math.min(1, f + 0.06), '#060909'], [1, '#020303']]);
      x.fillRect(0, 0, w, h);
      blob(x, (o.hx == null ? 0.45 : o.hx) * w, gy * 0.94, w, w, [[0, 'rgba(60,80,86,' + (o.haze || 0.12) + ')'], [1, 'rgba(60,80,86,0)']]);
    }
    n = Math.round((o.thin == null ? 48 : o.thin) * span);
    for (i = 0; i < n; i++) {
      x.fillStyle = 'rgba(10,17,19,' + ((0.55 + rnd() * 0.4) * (o.alpha || 1)).toFixed(2) + ')';
      trunk(x, rnd() * w, (1.5 + rnd() * 4.5) * k, -20 * k + rnd() * h * 0.25, gy * (0.94 + rnd() * 0.075), (rnd() - 0.5) * 10 * k);
    }
    n = Math.round((o.crowns == null ? 26 : o.crowns) * span);
    for (i = 0; i < n; i++) {
      x.fillStyle = 'rgba(2,4,5,' + (0.6 + rnd() * 0.3).toFixed(2) + ')';
      ell(x, rnd() * w, rnd() * h * 0.28 - 20 * k, (40 + rnd() * 70) * k, (26 + rnd() * 40) * k);
    }
    n = Math.round((o.thick == null ? 9 : o.thick) * span);
    for (i = 0; i < n; i++) {
      x.fillStyle = 'rgba(3,6,7,.95)';
      trunk(x, rnd() * w, (9 + rnd() * 12) * k, -30 * k, gy * (1.03 + rnd() * 0.12), (rnd() - 0.5) * 16 * k);
    }
    n = Math.round((o.stones == null ? 140 : o.stones) * span * (1 - f) / 0.34);
    for (i = 0; i < n; i++) {
      x.fillStyle = 'rgba(' + (rnd() < 0.5 ? '20,22,20' : '0,0,0') + ',' + (0.25 + rnd() * 0.3).toFixed(2) + ')';
      ell(x, rnd() * w, gy * 1.03 + rnd() * (h - gy * 1.03), (2 + rnd() * 9) * k, (1 + rnd() * 2.5) * k);
    }
  }
  /** 画面边上虚化的大树干（第 12 页右边那棵）。side 1 右，-1 左。 */
  function edgeTrunk(x, w, h, k, rnd, side, o) {
    o = o || {};
    var wd = (o.wd || 100) * k, i;
    x.save();
    if (side < 0) { x.translate(w, 0); x.scale(-1, 1); }
    blur(x, (o.blur == null ? 3 : o.blur) * k);
    x.fillStyle = lin(x, w - wd * 1.1, 0, w, 0, [[0, '#000'], [0.25, o.lit || '#0b0907'], [0.6, '#050403'], [1, '#000']]);
    x.beginPath();
    x.moveTo(w - wd * 0.66, -10 * k);
    x.bezierCurveTo(w - wd * 0.82, h * 0.3, w - wd * 0.74, h * 0.6, w - wd * 0.96, h + 10 * k);
    x.lineTo(w + 10 * k, h + 10 * k);
    x.lineTo(w + 10 * k, -10 * k);
    x.closePath();
    x.fill();
    if (o.leaves) {
      x.fillStyle = 'rgba(0,0,0,.9)';
      for (i = 0; i < 18; i++) ell(x, w - rnd() * 170 * k, rnd() * 90 * k - 10 * k, (10 + rnd() * 16) * k, (4 + rnd() * 6) * k, rnd() * 3);
    }
    blur(x, 0);
    x.restore();
  }
  /** 远山：几条正弦叠出来的山脊，填到底。 */
  function ridge(x, w, h, k, rnd, y, amp, fill) {
    var a1 = rnd() * 6, a2 = rnd() * 6, a3 = rnd() * 6, f1 = 1.2 + rnd(), f2 = 2.6 + rnd() * 2, f3 = 6 + rnd() * 4;
    x.fillStyle = fill;
    x.beginPath();
    x.moveTo(0, h);
    for (var i = 0; i <= 80; i++) {
      var u = i / 80;
      x.lineTo(u * w, y + amp * k * (Math.sin(u * f1 * Math.PI + a1) * 0.55 + Math.sin(u * f2 * Math.PI + a2) * 0.3 + Math.sin(u * f3 * Math.PI + a3) * 0.12));
    }
    x.lineTo(w, h);
    x.closePath();
    x.fill();
  }
  /** 圆圆的一团树冠（几个椭圆叠起来）。 */
  function bush(x, cx, by, r, rnd, fill) {
    x.fillStyle = fill;
    for (var i = 0; i < 7; i++) {
      var a = Math.PI + (i / 6) * Math.PI;
      ell(x, cx + Math.cos(a) * r * 0.62, by - r * 0.45 + Math.sin(a) * r * 0.5, r * (0.42 + rnd() * 0.2), r * (0.38 + rnd() * 0.18));
    }
    ell(x, cx, by - r * 0.25, r * 0.85, r * 0.42);
  }
  /** 尖尖的针叶树。 */
  function pine(x, cx, by, hgt, wd, fill) {
    x.fillStyle = fill;
    x.beginPath();
    x.moveTo(cx, by - hgt);
    for (var i = 1; i <= 4; i++) {
      var y = by - hgt + hgt * i / 4, ww = wd * (0.35 + i * 0.16);
      x.lineTo(cx + ww, y);
      x.lineTo(cx + ww * 0.45, y - hgt * 0.05);
    }
    x.lineTo(cx + wd * 0.08, by);
    x.lineTo(cx - wd * 0.08, by);
    for (i = 4; i >= 1; i--) {
      var y2 = by - hgt + hgt * i / 4, w2 = wd * (0.35 + i * 0.16);
      x.lineTo(cx - w2 * 0.45, y2 - hgt * 0.05);
      x.lineTo(cx - w2, y2);
    }
    x.closePath();
    x.fill();
  }
  /** 草：一丛一丛的，高矮不齐，叶子往外散开（n 是叶子总数）。 */
  function weeds(x, x0, x1, gy, k, rnd, n, hmax, fill) {
    x.fillStyle = fill;
    var clumps = Math.max(1, Math.round(n / 7)), c, i;
    for (c = 0; c < clumps; c++) {
      var c0 = x0 + rnd() * (x1 - x0), ch = (0.3 + rnd() * rnd() * 0.7 + rnd() * 0.25) * hmax * k, m = 3 + (rnd() * 8 | 0), g0 = gy + (rnd() - 0.5) * 6 * k;
      for (i = 0; i < m; i++) {
        var off = (rnd() - 0.5) * 12 * k, cx = c0 + off, hh = ch * (0.35 + rnd() * 0.65);
        var lean = off * 1.6 + (rnd() - 0.5) * hh * 0.7, wd = (0.8 + rnd() * 1.5) * k;
        x.beginPath();
        x.moveTo(cx - wd, g0 + 2 * k);
        x.quadraticCurveTo(cx + lean * 0.2, g0 - hh * 0.6, cx + lean, g0 - hh);
        x.quadraticCurveTo(cx + lean * 0.2 + wd * 0.4, g0 - hh * 0.5, cx + wd, g0 + 2 * k);
        x.closePath();
        x.fill();
      }
    }
  }

  /* ---------- 雾 ---------- */
  /** 每团雾 { x, y（比例）, r, v（设计像素）, a, sy }；按 t 漂移，左右循环。 */
  function fog(x, w, h, k, list, t, c) {
    var S = sprite(c || '118,136,140');
    x.save();
    x.globalCompositeOperation = 'lighter';
    list.forEach(function (m) {
      var rx = m.r * k, ry = rx * m.sy, span = w + rx * 2;
      var px = (((m.x * w + m.v * k * t) % span) + span) % span - rx;
      x.globalAlpha = m.a;
      x.drawImage(S, px - rx, m.y * h - ry, rx * 2, ry * 2);
    });
    x.restore();
  }
  function fogList(r, n, y0, y1, r0, r1, a, sy) {
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push({ x: r(), y: y0 + r() * (y1 - y0), r: r0 + r() * (r1 - r0), v: (r() - 0.5) * 12, a: a * (0.7 + r() * 0.6), sy: sy || 0.5 });
    }
    return out;
  }

  /* ---------- 火（第 12 页的篝火，按 t 算，不需要状态） ---------- */
  function flick(t, s) {
    return 0.82 + 0.1 * Math.sin(t * 12.7 + s) + 0.06 * Math.sin(t * 29.3 + 2 + s) + 0.05 * hash(Math.floor(t * 18) + s * 31);
  }
  /** 火光照亮四周和地面。s 大小（1 = 第 12 页的火堆），L 亮度。 */
  function fireLight(x, cx, cy, s, L) {
    if (L <= 0) return;
    var R = 340 * s, g;
    x.save();
    x.globalCompositeOperation = 'lighter';
    g = x.createRadialGradient(cx, cy - 30 * s, 4 * s, cx, cy - 30 * s, R);
    g.addColorStop(0, rgba('255,140,60', 0.34 * L));
    g.addColorStop(0.3, rgba('190,60,20', 0.14 * L));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(cx - R, cy - 30 * s - R, R * 2, R * 2);
    x.translate(cx, cy + 6 * s);
    x.scale(1, 0.26);
    g = x.createRadialGradient(0, 0, 0, 0, 0, 240 * s);
    g.addColorStop(0, rgba('255,120,50', 0.3 * L));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.beginPath();
    x.arc(0, 0, 240 * s, 0, TAU);
    x.fill();
    x.restore();
  }
  function logs(x, cx, cy, s, L) {
    x.save();
    x.strokeStyle = 'rgb(' + (18 + 40 * L | 0) + ',8,4)';
    x.lineWidth = 4 * s;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(cx - 20 * s, cy + 4 * s); x.lineTo(cx + 6 * s, cy - 16 * s);
    x.moveTo(cx + 20 * s, cy + 4 * s); x.lineTo(cx - 6 * s, cy - 16 * s);
    x.moveTo(cx - 16 * s, cy + 6 * s); x.lineTo(cx + 16 * s, cy + 6 * s);
    x.stroke();
    x.restore();
  }
  /** 火焰粒子和飞起来的火星：每个粒子的位置由 t 直接算出来。 */
  function flames(x, cx, cy, s, t, L, seed, n, ne) {
    var SY = sprite('255,232,180'), SO = sprite('255,128,44'), SR = sprite('170,36,14');
    var i, max, cyc, gen, q, hs, age, px, py, r;
    x.save();
    x.globalCompositeOperation = 'lighter';
    for (i = 0; i < n; i++) {
      max = 0.45 + hash(seed + i * 3.1) * 0.55;
      cyc = t / max + hash(seed + i * 7.7);
      gen = Math.floor(cyc);
      q = cyc - gen;
      age = q * max;
      hs = seed + i * 13.3 + gen * 1.618;
      px = cx + ((hash(hs) - 0.5) * 26 * (0.4 + 0.6 * L) + (hash(hs + 1) - 0.5) * 12 * age + Math.sin(t * 9 + i) * 0.8) * s;
      py = cy + (-2 - (30 + hash(hs + 2) * 46) * (0.5 + 0.5 * L) * age - 9 * age * age) * s;
      r = (7 + hash(hs + 3) * 9) * (0.5 + 0.5 * L) * (1 - q * 0.55) * s;
      x.globalAlpha = (q < 0.12 ? q / 0.12 : 1) * (1 - q) * 0.6 * Math.min(1, L * 1.4);
      x.drawImage(q < 0.22 ? SY : q < 0.6 ? SO : SR, px - r, py - r * 1.3, r * 2, r * 2.6);
    }
    var es = Math.sqrt(s);
    for (i = 0; i < ne; i++) {
      max = 1.5 + hash(seed + i * 5.3) * 1.2;
      cyc = t / max + hash(seed + i * 9.1);
      gen = Math.floor(cyc);
      q = cyc - gen;
      age = q * max;
      hs = seed + 500 + i * 17.7 + gen * 2.71;
      px = cx + ((hash(hs) - 0.5) * 20 + (hash(hs + 1) - 0.5) * 20 * age + Math.sin(t * 3 + i) * 5 * age) * s;
      py = cy + (-20 - (50 + hash(hs + 2) * 50) * age) * s;
      x.globalAlpha = (1 - q) * 0.9 * L;
      x.drawImage(SO, px - 3 * es, py - 3 * es, 6 * es, 6 * es);
    }
    x.restore();
  }

  /* ---------- 红袍兜帽人（第 12 页的剪影） ---------- */
  function robePath(x, h) {
    var w = h * 0.34;
    x.beginPath();
    x.moveTo(-w * 0.55, 0);
    x.bezierCurveTo(-w * 0.5, -h * 0.3, -w * 0.44, -h * 0.58, -w * 0.4, -h * 0.7);
    x.bezierCurveTo(-w * 0.36, -h * 0.78, -w * 0.27, -h * 0.82, -w * 0.22, -h * 0.86);
    x.bezierCurveTo(-w * 0.2, -h * 0.97, -w * 0.08, -h * 1.02, 0, -h * 1.04);
    x.bezierCurveTo(w * 0.1, -h * 1.02, w * 0.2, -h * 0.97, w * 0.22, -h * 0.86);
    x.bezierCurveTo(w * 0.27, -h * 0.82, w * 0.36, -h * 0.78, w * 0.4, -h * 0.7);
    x.bezierCurveTo(w * 0.44, -h * 0.58, w * 0.5, -h * 0.3, w * 0.55, 0);
    x.quadraticCurveTo(0, h * 0.025, -w * 0.55, 0);
    x.closePath();
  }
  /**
   * (cx, by) 脚底，h 身高，lum 被火照亮的程度。
   * o.back：背对我们，逆光剪影 + 一圈火光；o.side：火在左（-1）/ 右（1），那一边更亮。
   */
  function hooded(x, cx, by, h, lum, o) {
    o = o || {};
    x.save();
    x.translate(cx, by);
    x.fillStyle = 'rgba(0,0,0,.5)';
    ell(x, 0, 0, h * 0.2, h * 0.035);
    if (!o.back) {
      if (o.side) { // 火那一边的一圈光
        x.save();
        blur(x, h * 0.004);
        x.translate(o.side * h * 0.012, -h * 0.004);
        robePath(x, h);
        x.fillStyle = rgba('255,140,70', 0.8 * lum);
        x.fill();
        x.restore();
      }
      robePath(x, h);
      var gr = x.createLinearGradient(0, -h, 0, 0);
      gr.addColorStop(0, rgb(34 + 110 * lum, 5 + 16 * lum, 4 + 10 * lum));
      gr.addColorStop(0.45, rgb(26 + 134 * lum, 4 + 24 * lum, 4 + 14 * lum));
      gr.addColorStop(1, rgb(12 + 40 * lum, 2 + 6 * lum, 2 + 4 * lum));
      x.fillStyle = gr;
      x.fill();
      if (o.side) {
        x.save();
        x.clip();
        x.fillStyle = lin(x, -o.side * h * 0.2, 0, o.side * h * 0.2, 0, [[0, 'rgba(0,0,0,.55)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']]);
        x.fillRect(-h, -h * 1.1, h * 2, h * 1.2);
        x.globalCompositeOperation = 'lighter';
        x.fillStyle = lin(x, 0, 0, o.side * h * 0.2, 0, [[0, 'rgba(0,0,0,0)'], [1, rgba('200,60,24', 0.45 * lum)]]);
        x.fillRect(-h, -h * 1.1, h * 2, h * 1.2);
        x.restore();
      }
      if (h > 120) blob(x, 0, -h * 0.85, h * 0.056, h * 0.07, [[0, 'rgba(3,0,0,.96)'], [0.6, 'rgba(4,0,0,.85)'], [1, 'rgba(4,0,0,0)']]);
      else { x.fillStyle = 'rgba(4,0,0,.92)'; ell(x, 0, -h * 0.855, h * 0.045, h * 0.056); }
      x.strokeStyle = 'rgba(0,0,0,.3)';
      x.lineWidth = Math.max(1, h * 0.008);
      x.beginPath();
      x.moveTo(-h * 0.03, -h * 0.62); x.lineTo(-h * 0.06, 0);
      x.moveTo(h * 0.04, -h * 0.58); x.lineTo(h * 0.07, 0);
      x.stroke();
    } else {
      robePath(x, h);
      x.strokeStyle = rgba('255,110,45', 0.55 * lum);
      x.lineWidth = Math.max(1.6, h * 0.013);
      x.stroke();
      x.fillStyle = rgb(14 + 30 * lum, 3 + 4 * lum, 2 + 2 * lum);
      x.fill();
    }
    x.restore();
  }
  /** 举在身侧的火把。 */
  function torch(x, cx, by, h, side, t, L) {
    var hx = cx + side * h * 0.12, hy = by - h * 0.58, tx = cx + side * h * 0.22, ty = by - h * 1.1, s = h / 300;
    x.save();
    x.strokeStyle = '#1a0b05';
    x.lineWidth = Math.max(1.2, h * 0.02);
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(hx, hy);
    x.lineTo(tx, ty);
    x.stroke();
    x.restore();
    glow(x, tx, ty - 8 * s, 80 * s, 80 * s, '255,130,50', 0.3 * L);
    flames(x, tx, ty, s * 0.85, t + cx * 0.013, 0.85 + 0.15 * L, (cx * 7) | 0, 22, 3);
  }

  /* ---------- 孔雀 ---------- */
  // 侧身站着、朝右的孔雀；脚底在 (0,0)，身长约 40。
  var PEA = 'M-18 -30C-12 -38 0 -40 8 -37C12 -36 13 -40 13.6 -46C14.2 -52 13.4 -58 15.6 -62.5C17 -65.6 21 -66 22.6 -63.6L27.6 -62.2L22.8 -60.8' +
    'C21 -59.6 19.6 -56 19.6 -51C19.6 -46 21.4 -41 21 -36C20.4 -28 14 -22 6 -21.4C-2 -20.8 -12 -22 -18 -30Z';
  var PEA_LEGS = 'M1.2 -22L2.8 -22L2.2 -12L3.6 0L2 0L0.6 -12ZM6.2 -22L7.8 -22L7.6 -12L9.6 0L8 0L6 -12Z';
  var PEA_TRAIN = 'M-14 -37C-34 -31 -56 -18 -76 -6C-82 -2 -86 0 -84 1.6C-80 2.4 -72 1 -62 -1.6C-44 -8 -28 -15 -12 -23Z';
  var PEA_DRAPE = 'M-14 -33C-25 -32 -32 -25 -34 -13C-37 10 -39 44 -46 84C-42 93 -25 96 -18 89C-16 52 -16 12 -10 -22Z';
  /**
   * (cx, by) 脚底，s 大小，dir 1 朝右 / -1 朝左。o.drape 尾羽从墙沿垂下来；o.col 颜色；o.eyes 尾羽上羽眼的亮度；
   * o.sheen 脖子上的冷光；o.rim 轮廓光（见 sil）。
   */
  function peacock(x, cx, by, s, dir, o) {
    o = o || {};
    var col = o.col || '#0b1416', i;
    sil(x, [o.drape ? PEA_DRAPE : PEA_TRAIN, PEA, PEA_LEGS], cx, by, s * dir, s, 0, col, o.rim);
    x.save();
    x.translate(cx, by);
    x.scale(s * dir, s);
    // 冠羽：几根细梗，顶上一点小扇
    x.strokeStyle = x.fillStyle = col;
    x.lineWidth = 0.5;
    for (i = 0; i < 6; i++) {
      var a = -2.25 + i * 0.15, ex = 19.4 + Math.cos(a) * 8, ey = -64.6 + Math.sin(a) * 8;
      x.beginPath(); x.moveTo(19.4, -64.6); x.lineTo(ex, ey); x.stroke();
      ell(x, ex, ey, 1.3, 0.8, a + Math.PI / 2);
    }
    if (o.eyes) {
      for (i = 0; i < 10; i++) {
        var u = (i + 1) / 11, px, py, side = i % 2 ? 1 : -1;
        if (o.drape) { px = -24 - u * 8 + side * (2 + u * 4); py = -12 + u * 94; }
        else { px = -24 - u * 52; py = -31 + u * 26 + side * 2.5; }
        blob(x, px, py, 2.4, 2.8, [[0, rgba('20,40,70', o.eyes)], [0.45, rgba('40,110,100', o.eyes * 0.8)], [0.75, rgba('110,95,55', o.eyes * 0.5)], [1, 'rgba(0,0,0,0)']]);
      }
    }
    if (o.sheen) blob(x, 17.5, -48, 4, 13, [[0, rgba('60,140,160', o.sheen)], [1, 'rgba(0,0,0,0)']], 'lighter');
    x.restore();
  }
  /** 一个羽眼：外圈古铜、绿、蓝绿，中间深蓝的心。(cx, cy) 中心，r 大小，a 朝向（羽毛的方向），lum 亮度。 */
  function eyeSpot(x, cx, cy, r, a, lum, o) {
    o = o || {};
    x.save();
    x.translate(cx, cy);
    x.rotate(a);
    x.scale(r * 1.18, r * 0.92);
    var g = x.createRadialGradient(0.14, 0, 0, 0, 0, 1);
    function c(r0, g0, b0, al) { return 'rgba(' + (r0 * lum | 0) + ',' + (g0 * lum | 0) + ',' + (b0 * lum | 0) + ',' + al + ')'; }
    g.addColorStop(0, c(10, 22, 58, 1));
    g.addColorStop(0.2, c(14, 30, 72, 1));
    g.addColorStop(0.3, c(32, 112, 140, 1));
    g.addColorStop(0.42, c(30, 120, 96, 1));
    if (o.cold) { // 冷光下看不出古铜色
      g.addColorStop(0.56, c(46, 104, 108, 1));
      g.addColorStop(0.7, c(30, 82, 78, 0.9));
    } else {
      g.addColorStop(0.56, c(118, 96, 48, 1));
      g.addColorStop(0.7, c(70, 96, 50, 0.9));
    }
    g.addColorStop(0.86, c(36, 76, 58, o.soft ? 0.25 : 0.5));
    g.addColorStop(1, c(30, 60, 50, 0));
    x.fillStyle = g;
    x.beginPath();
    x.arc(0, 0, 1, 0, TAU);
    x.fill();
    x.restore();
  }
  /**
   * 一根孔雀羽毛。(bx, by) 羽根，(ex, ey) 羽眼中心，wd 羽枝最长处，o.bend 弯曲，o.lum 亮度，o.n 羽枝数。
   */
  function feather(x, bx, by, ex, ey, wd, rnd, o) {
    o = o || {};
    var lum = o.lum == null ? 1 : o.lum;
    var dx = ex - bx, dy = ey - by, len = Math.sqrt(dx * dx + dy * dy);
    var nx = -dy / len, ny = dx / len, bend = (o.bend || 0) * len;
    var mx = bx + dx * 0.5 + nx * bend, my = by + dy * 0.5 + ny * bend;
    function pt(s) {
      var a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s;
      return [a * bx + b * mx + c * ex, a * by + b * my + c * ey];
    }
    function tan(s) {
      var tx = 2 * (1 - s) * (mx - bx) + 2 * s * (ex - mx), ty = 2 * (1 - s) * (my - by) + 2 * s * (ey - my), l = Math.sqrt(tx * tx + ty * ty);
      return [tx / l, ty / l];
    }
    var R = o.eye || wd * 0.6, n = o.n || 150, i, side;
    var te = tan(1), ang = Math.atan2(te[1], te[0]);
    x.save();
    x.lineCap = 'round';
    // 羽枝：下半截稀疏、分叉，上半截密
    for (side = -1; side <= 1; side += 2) {
      for (i = 0; i < n; i++) {
        var s = 0.05 + (i + rnd() * 0.8) / n * 0.86;
        if (s < 0.4 && rnd() < 0.45 - s) continue;
        var p = pt(s), tg = tan(s), nrm = [-tg[1] * side, tg[0] * side];
        var prof = s < 0.7 ? 0.2 + 0.8 * Math.sin(s / 0.7 * Math.PI / 2) : 1 - (s - 0.7) * 0.5;
        var L = wd * prof * (0.72 + rnd() * 0.4);
        var a = 1.05 - s * 0.45 + (rnd() - 0.5) * 0.2;
        var ca = Math.cos(a), sa = Math.sin(a);
        var dirx = tg[0] * ca + nrm[0] * sa, diry = tg[1] * ca + nrm[1] * sa;
        var qx = p[0] + dirx * L, qy = p[1] + diry * L;
        var cx2 = p[0] + dirx * L * 0.55 + tg[0] * L * 0.18, cy2 = p[1] + diry * L * 0.55 + tg[1] * L * 0.18;
        var warm = s < 0.5 ? 1 - s * 2 : 0;
        x.strokeStyle = 'rgba(' + ((40 + 50 * warm) * lum | 0) + ',' + ((95 + 10 * warm) * lum | 0) + ',' + ((88 - 40 * warm) * lum | 0) + ',' + ((0.16 + rnd() * 0.26) * (0.6 + s * 0.6)).toFixed(3) + ')';
        x.lineWidth = (0.5 + rnd() * 0.6) * (o.k || 1);
        x.beginPath();
        x.moveTo(p[0], p[1]);
        x.quadraticCurveTo(cx2, cy2, qx, qy);
        x.stroke();
      }
    }
    // 羽眼周围的密羽：一圈放射的细羽枝
    var c0 = [ex - te[0] * R * 0.2, ey - te[1] * R * 0.2];
    for (i = 0; i < 140; i++) {
      var aa = i / 140 * TAU, rr = R * (1.25 + rnd() * 0.25) * (1 + 0.22 * Math.cos(aa));
      var ux = Math.cos(aa), uy = Math.sin(aa);
      var wx = ux * Math.cos(ang) - uy * Math.sin(ang) * 0.82, wy = ux * Math.sin(ang) + uy * Math.cos(ang) * 0.82;
      x.strokeStyle = 'rgba(' + (50 * lum | 0) + ',' + (110 * lum | 0) + ',' + (84 * lum | 0) + ',' + (0.14 + rnd() * 0.2).toFixed(3) + ')';
      x.lineWidth = (0.5 + rnd() * 0.5) * (o.k || 1);
      x.beginPath();
      x.moveTo(c0[0] + wx * R * 0.3, c0[1] + wy * R * 0.3);
      x.lineTo(c0[0] + wx * rr, c0[1] + wy * rr);
      x.stroke();
    }
    eyeSpot(x, ex, ey, R, ang, lum);
    // 羽轴
    x.strokeStyle = 'rgba(' + (120 * lum | 0) + ',' + (130 * lum | 0) + ',' + (110 * lum | 0) + ',.5)';
    x.lineWidth = 1.6 * (o.k || 1);
    x.beginPath();
    x.moveTo(bx, by);
    x.quadraticCurveTo(mx, my, ex - te[0] * R * 0.6, ey - te[1] * R * 0.6);
    x.stroke();
    x.restore();
    return { ex: ex, ey: ey, R: R, ang: ang };
  }

  /* ---------- 人的剪影（脚底在 (0,0)，身高 100，用 y 当前的颜色画） ---------- */
  /** 背影：穿校服的女孩往前走。o.hair 'long' | 'short'；o.step 哪条腿在前（-1 左 / 1 右）；o.bag 书包挎在哪边。 */
  function girlBack(y, o) {
    var st = o.step || 1, i;
    limb(y, [[-3.6, -38], [-3.9, -20], [-4.1, st < 0 ? -6 : -2.4]], 4.6);
    limb(y, [[3.6, -38], [3.9, -20], [4.1, st > 0 ? -6 : -2.4]], 4.6);
    y.beginPath(); y.ellipse(-4.1, st < 0 ? -5 : -1.4, 2.7, 1.8, 0, 0, TAU); y.fill();
    y.beginPath(); y.ellipse(4.1, st > 0 ? -5 : -1.4, 2.7, 1.8, 0, 0, TAU); y.fill();
    // 百褶裙：下摆一点点锯齿
    y.beginPath();
    y.moveTo(-8.6, -57);
    y.lineTo(8.6, -57);
    y.lineTo(12.4, -36.6);
    for (i = 6; i >= -6; i--) y.lineTo(i * 2.05, -35.6 + (i % 2 ? 0.9 : 0));
    y.lineTo(-12.4, -36.6);
    y.closePath();
    y.fill();
    // 西装外套
    y.beginPath();
    y.moveTo(-10.4, -80.4);
    y.quadraticCurveTo(0, -83, 10.4, -80.4);
    y.quadraticCurveTo(12.2, -79.4, 11.6, -76);
    y.lineTo(10.2, -50.6);
    y.lineTo(-10.2, -50.6);
    y.lineTo(-11.6, -76);
    y.quadraticCurveTo(-12.2, -79.4, -10.4, -80.4);
    y.closePath();
    y.fill();
    limb(y, [[-10.8, -77], [-13.2, -65], [-13.8 + st * 0.6, -53]], 4.4);
    limb(y, [[10.8, -77], [13.2, -65], [13.8 + st * 0.6, -53]], 4.4);
    y.beginPath(); y.ellipse(-13.8 + st * 0.6, -51.4, 2, 2.6, 0, 0, TAU); y.fill();
    y.beginPath(); y.ellipse(13.8 + st * 0.6, -51.4, 2, 2.6, 0, 0, TAU); y.fill();
    if (o.bag) { // 斜挎的书包
      var b = o.bag;
      limb(y, [[-b * 8, -80], [b * 13, -60]], 1.4);
      y.beginPath();
      if (y.roundRect) y.roundRect(b > 0 ? 11 : -21, -62, 10, 11, 1.6); else y.rect(b > 0 ? 11 : -21, -62, 10, 11);
      y.fill();
    }
    limb(y, [[0, -87], [0, -80]], 5);
    y.beginPath(); y.ellipse(0, -91.4, 6.5, 7.6, 0, 0, TAU); y.fill();
    y.beginPath();
    if (o.hair === 'long') { // 长直发
      y.moveTo(-6.9, -92);
      y.bezierCurveTo(-7.6, -84, -8, -72, -7.4, -60.5);
      y.lineTo(7.4, -60.5);
      y.bezierCurveTo(8, -72, 7.6, -84, 6.9, -92);
    } else { // 短一点的头发，到下巴
      y.moveTo(-7.1, -92);
      y.bezierCurveTo(-7.8, -88, -8, -84, -7.4, -80.4);
      y.quadraticCurveTo(0, -79, 7.4, -80.4);
      y.bezierCurveTo(8, -84, 7.8, -88, 7.1, -92);
    }
    y.bezierCurveTo(6.2, -98, 3.6, -100.2, 0, -100.2);
    y.bezierCurveTo(-3.6, -100.2, -6.2, -98, -6.9, -92);
    y.closePath();
    y.fill();
  }
  /** 侧身朝右站着的女孩（短发，校服）。 */
  function girlSide(y) {
    limb(y, [[-1.8, -38], [-2.6, -20], [-3.8, -2.8]], 4.6);
    limb(y, [[2.2, -38], [3.8, -20], [5.8, -2.8]], 4.4);
    y.beginPath(); y.ellipse(-2.4, -1.6, 3.8, 1.8, 0, 0, TAU); y.fill();
    y.beginPath(); y.ellipse(7.2, -1.6, 3.6, 1.8, 0.1, 0, TAU); y.fill();
    y.beginPath(); // 裙子，后面的褶子撑开一点
    y.moveTo(-6.4, -57);
    y.lineTo(6, -57);
    y.lineTo(8.8, -36.4);
    y.lineTo(-10.4, -36);
    y.closePath();
    y.fill();
    y.beginPath(); // 外套
    y.moveTo(-5.6, -80.6);
    y.quadraticCurveTo(0, -82.6, 4.6, -81);
    y.quadraticCurveTo(7, -76, 6.6, -69);
    y.lineTo(5.6, -57);
    y.lineTo(6.8, -50.4);
    y.lineTo(-7.2, -50.4);
    y.quadraticCurveTo(-7.8, -66, -5.6, -80.6);
    y.closePath();
    y.fill();
    limb(y, [[0.2, -78], [2.4, -67], [6.4, -58]], 4);
    y.beginPath(); y.ellipse(7.6, -56, 2.2, 2.6, -0.6, 0, TAU); y.fill();
    limb(y, [[0.4, -87], [0.8, -80]], 3.8);
    y.beginPath(); // 头和侧脸
    y.moveTo(1, -99.4);
    y.bezierCurveTo(5, -99.4, 6.8, -96.6, 6.9, -93.4);
    y.lineTo(8.1, -90.2);
    y.lineTo(7, -89.6);
    y.quadraticCurveTo(7.4, -88, 6.4, -87.4);
    y.quadraticCurveTo(6.6, -85.4, 4.6, -84.8);
    y.quadraticCurveTo(2, -84.4, -0.6, -85.6);
    y.lineTo(-4.6, -88);
    y.bezierCurveTo(-6.4, -91, -6, -99.4, 1, -99.4);
    y.closePath();
    y.fill();
    y.beginPath(); // 头发到下巴，刘海
    y.moveTo(-6.6, -92.6);
    y.bezierCurveTo(-7, -98, -3, -101, 1.4, -100.6);
    y.bezierCurveTo(5.4, -100.2, 7.4, -97.6, 7, -94.6);
    y.lineTo(5.4, -94.4);
    y.bezierCurveTo(4, -93.6, 3.2, -91.4, 3, -88.6);
    y.lineTo(-1.6, -83.4);
    y.quadraticCurveTo(-5.6, -83.2, -7.2, -85.2);
    y.quadraticCurveTo(-7.4, -89, -6.6, -92.6);
    y.closePath();
    y.fill();
  }
  function at(px, py, sx, sy, fn) { return function (y) { y.save(); y.translate(px, py); y.scale(sx, sy); fn(y); y.restore(); }; }

  /* ======================================================================
   * 场景
   * ====================================================================== */
  // def: { w, h, seed, motion, still, init(rnd) -> d,
  //        back(x, w, h, k, d, rnd), live(x, w, h, k, d, t, part), front(...), over(x, w, h, k, d, t, part),
  //        parts: { name: fn(x, w, h, k, d, rnd) }（缓存的图层，live/over 里用 part(name) 取，可以按亮度叠上去）,
  //        feat(w, h, k, d) -> 像素坐标, grain, vig, vigC }
  function scene(name, def) { def.name = name; SCENES[name] = def; }
  function data(S) { return S.d || (S.d = S.init ? S.init(seeded(S.seed + 1)) : {}); }

  /* ---------- 封面：雾里的孔雀羽毛 ---------- */
  scene('feather-fog', {
    w: 600, h: 800, seed: 3301, motion: true, still: 2,
    init: function (r) { return { fog: fogList(r, 12, 0.1, 0.98, 170, 360, 0.085, 0.42) }; },
    geo: function (w, h, k) {
      var ex = w * 0.72, ey = h * 0.35, len = 610 * k;
      return { ex: ex, ey: ey, bx: ex - 0.22 * len, by: ey + 0.975 * len, wd: 118 * k, R: 50 * k };
    },
    back: function (x, w, h, k, d, r) {
      x.fillStyle = lin(x, 0, 0, 0, h, [[0, '#020405'], [0.55, '#050c0c'], [1, '#081312']]);
      x.fillRect(0, 0, w, h);
      blob(x, w * 0.7, h, w * 1.1, h * 0.8, [[0, 'rgba(38,66,62,.55)'], [0.5, 'rgba(16,30,29,.3)'], [1, 'rgba(0,0,0,0)']]);
      // 雾里很淡的远树
      blur(x, 2.5 * k);
      woods(x, w, h, k, r, { bg: false, ground: 0.9, thin: 22, crowns: 10, thick: 0, stones: 0, alpha: 0.5 });
      blur(x, 0);
      blob(x, w * 0.28, h * 0.62, w * 0.6, h * 0.22, [[0, 'rgba(90,110,108,.12)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      blob(x, w * 0.2, h * 0.3, w * 0.5, h * 0.12, [[0, 'rgba(90,110,108,.08)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      blob(x, w * 0.5, h * 0.86, w * 0.8, h * 0.1, [[0, 'rgba(110,130,126,.12)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      var g = this.geo(w, h, k);
      feather(x, g.bx, g.by, g.ex, g.ey, g.wd, r, { bend: -0.06, eye: g.R, k: k, lum: 0.95, n: 170 });
    },
    live: function (x, w, h, k, d, t) {
      var g = this.geo(w, h, k), b = 0.78 + 0.22 * Math.sin(t * 0.8);
      glow(x, g.ex, g.ey, g.R * 2.6, g.R * 2.6, '50,150,160', 0.16 * b);
      glow(x, g.ex + g.R * 0.1, g.ey - g.R * 0.1, g.R * 0.7, g.R * 0.7, '110,210,220', 0.22 * b);
      fog(x, w, h, k, d.fog, t);
    },
    feat: function (w, h, k) { var g = this.geo(w, h, k); return { eye: { x: g.ex, y: g.ey, r: g.R * 1.3 } }; }
  });

  /* ---------- 主屏壁纸：山坡上的女子中学 ---------- */
  scene('campus-night', {
    w: 420, h: 750, seed: 2210, motion: true, still: 1,
    init: function (r) {
      // 教学楼：x0..x1（比例），base（比例），hh 楼高，rows×cols 窗，roof：'flat' | 'gable'
      var b = [
        { x0: 0.36, x1: 0.9, base: 0.535, hh: 66, rows: 4, cols: 13, roof: 'flat' },
        { x0: 0.565, x1: 0.68, base: 0.535, hh: 98, rows: 5, cols: 3, roof: 'gable' },
        { x0: 0.06, x1: 0.4, base: 0.6, hh: 54, rows: 3, cols: 9, roof: 'flat' },
        { x0: 0.7, x1: 0.93, base: 0.588, hh: 40, rows: 2, cols: 5, roof: 'gable' }
      ];
      var wins = [];
      b.forEach(function (B, bi) {
        for (var i = 0; i < B.rows; i++) {
          for (var j = 0; j < B.cols; j++) wins.push({ b: bi, i: i, j: j, lit: r() < (bi === 1 ? 0.3 : 0.17), ph: r() * 6, sp: 0.3 + r() * 0.5 });
        }
      });
      return {
        b: b, wins: wins,
        lamps: [[0.47, 0.565, 0.6], [0.3, 0.635, 0.75], [0.56, 0.68, 0.9], [0.4, 0.75, 1.1], [0.6, 0.84, 1.35]],
        stars: (function () { var s = []; for (var i = 0; i < 46; i++) s.push([r(), r() * 0.36, r()]); return s; })(),
        fog: fogList(r, 9, 0.5, 0.78, 120, 240, 0.065, 0.26)
      };
    },
    win: function (w, h, k, B, i, j) {
      var X0 = B.x0 * w, X1 = B.x1 * w, top = B.base * h - B.hh * k;
      var cw = (X1 - X0) / B.cols, rh = (B.hh * k - 10 * k) / B.rows;
      return { x: X0 + cw * (j + 0.3), y: top + 7 * k + rh * (i + 0.25), w: cw * 0.4, h: rh * 0.46 };
    },
    back: function (x, w, h, k, d, r) {
      var self = this, i;
      x.fillStyle = lin(x, 0, 0, 0, h, [[0, '#010203'], [0.3, '#02070a'], [0.45, '#0b1719'], [0.5, '#071012'], [1, '#020303']]);
      x.fillRect(0, 0, w, h);
      d.stars.forEach(function (s) {
        x.fillStyle = 'rgba(200,215,220,' + (0.08 + s[2] * 0.25).toFixed(2) + ')';
        ell(x, s[0] * w, s[1] * h, 0.6 * k, 0.6 * k);
      });
      // 远山和山间的雾
      ridge(x, w, h, k, r, h * 0.4, 34, '#0a1518');
      blob(x, w * 0.5, h * 0.445, w * 0.9, h * 0.05, [[0, 'rgba(90,112,116,.16)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      ridge(x, w, h, k, r, h * 0.455, 20, '#071013');
      blob(x, w * 0.55, h * 0.5, w * 0.8, h * 0.06, [[0, 'rgba(90,112,116,.12)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      // 学校所在的山坡
      x.fillStyle = '#050a0b';
      x.beginPath();
      x.moveTo(0, h * 0.6);
      x.bezierCurveTo(w * 0.2, h * 0.55, w * 0.35, h * 0.515, w * 0.6, h * 0.505);
      x.bezierCurveTo(w * 0.8, h * 0.5, w * 0.92, h * 0.51, w, h * 0.52);
      x.lineTo(w, h);
      x.lineTo(0, h);
      x.closePath();
      x.fill();
      // 楼后面的松树
      for (i = 0; i < 18; i++) pine(x, w * (0.3 + r() * 0.7), h * (0.535 + r() * 0.01), (24 + r() * 26) * k, (10 + r() * 8) * k, '#040809');
      // 教学楼
      d.b.forEach(function (B, bi) {
        var X0 = B.x0 * w, X1 = B.x1 * w, base = B.base * h, top = base - B.hh * k;
        x.fillStyle = lin(x, 0, top, 0, base, [[0, '#0d191c'], [1, '#081113']]);
        x.fillRect(X0, top, X1 - X0, base - top + 3 * k);
        if (B.roof === 'gable') {
          x.fillStyle = '#081013';
          x.beginPath();
          x.moveTo(X0 - 4 * k, top);
          x.lineTo((X0 + X1) / 2, top - (X1 - X0) * 0.28);
          x.lineTo(X1 + 4 * k, top);
          x.closePath();
          x.fill();
          x.strokeStyle = 'rgba(120,140,144,.16)';
          x.lineWidth = 1.2 * k;
          x.beginPath(); x.moveTo(X0 - 4 * k, top); x.lineTo((X0 + X1) / 2, top - (X1 - X0) * 0.28); x.lineTo(X1 + 4 * k, top); x.stroke();
        } else {
          x.fillStyle = '#0b1517';
          x.fillRect(X0 - 2 * k, top - 4 * k, X1 - X0 + 4 * k, 5 * k);
          x.fillStyle = 'rgba(120,140,144,.14)';
          x.fillRect(X0 - 2 * k, top - 4 * k, X1 - X0 + 4 * k, 1.2 * k);
        }
        // 楼层线
        x.fillStyle = 'rgba(0,0,0,.25)';
        for (var f = 1; f < B.rows; f++) x.fillRect(X0, top + 7 * k + (B.hh * k - 10 * k) / B.rows * f - 1 * k, X1 - X0, 1 * k);
      });
      d.wins.forEach(function (W) {
        if (W.lit) return;
        var q = self.win(w, h, k, d.b[W.b], W.i, W.j);
        x.fillStyle = 'rgba(70,96,102,.13)';
        x.fillRect(q.x, q.y, q.w, q.h);
      });
      // 台地的挡土墙
      x.fillStyle = '#040808';
      x.fillRect(0, h * 0.598, w * 0.44, h * 0.012);
      x.fillRect(w * 0.34, h * 0.533, w * 0.6, h * 0.008);
      // 楼前的树
      for (i = 0; i < 7; i++) bush(x, w * (0.04 + i * 0.06 + r() * 0.03), h * (0.612 + r() * 0.01), (14 + r() * 10) * k, r, '#030707');
      for (i = 0; i < 8; i++) bush(x, w * (0.36 + i * 0.075 + r() * 0.03), h * (0.545 + r() * 0.008), (12 + r() * 9) * k, r, '#030707');
      // 下山的小路
      x.strokeStyle = 'rgba(90,110,112,.12)';
      x.lineWidth = 1.6 * k;
      x.beginPath();
      x.moveTo(w * 0.47, h * 0.57);
      x.quadraticCurveTo(w * 0.2, h * 0.61, w * 0.3, h * 0.645);
      x.quadraticCurveTo(w * 0.62, h * 0.665, w * 0.56, h * 0.69);
      x.quadraticCurveTo(w * 0.3, h * 0.73, w * 0.4, h * 0.76);
      x.quadraticCurveTo(w * 0.62, h * 0.8, w * 0.6, h * 0.86);
      x.lineTo(w * 0.62, h);
      x.stroke();
      // 路灯杆（近大远小）
      x.fillStyle = '#0c1213';
      d.lamps.forEach(function (L) { x.fillRect(L[0] * w - 0.7 * k * L[2], L[1] * h - 26 * k * L[2], 1.4 * k * L[2], 26 * k * L[2]); });
      // 前景的树
      for (i = 0; i < 6; i++) bush(x, w * (0.02 + i * 0.05 + r() * 0.03), h * (0.96 + r() * 0.05), (44 + r() * 34) * k, r, '#010303');
      for (i = 0; i < 5; i++) bush(x, w * (0.74 + i * 0.07 + r() * 0.03), h * (0.92 + r() * 0.07), (40 + r() * 30) * k, r, '#010303');
      pine(x, w * 0.93, h * 0.99, 240 * k, 72 * k, '#010202');
      pine(x, w * 0.05, h * 1.02, 190 * k, 62 * k, '#010202');
    },
    live: function (x, w, h, k, d, t) {
      var self = this;
      d.wins.forEach(function (W) {
        if (!W.lit) return;
        var q = self.win(w, h, k, d.b[W.b], W.i, W.j), b = 0.8 + 0.2 * Math.sin(t * W.sp + W.ph);
        x.fillStyle = rgba('255,198,130', 0.8 * b);
        x.fillRect(q.x, q.y, q.w, q.h);
        glow(x, q.x + q.w / 2, q.y + q.h / 2, q.w * 2.4, q.h * 2.2, '255,170,90', 0.3 * b);
      });
      d.lamps.forEach(function (L, i) {
        var lx = L[0] * w, ly = L[1] * h - 27 * k * L[2], z = L[2] * k, b = 0.9 + 0.1 * Math.sin(t * 0.7 + i * 2);
        glow(x, lx, ly, 24 * z, 24 * z, '255,200,130', 0.5 * b);
        glow(x, lx, ly, 3.5 * z, 3.5 * z, '255,235,200', 0.9);
        glow(x, lx, ly + 27 * z, 26 * z, 7 * z, '255,180,110', 0.2 * b);
      });
      fog(x, w, h, k, d.fog, t);
    },
    feat: function (w, h, k) { return { school: { x: w * 0.06, y: h * 0.535 - 130 * k, w: w * 0.87, h: h * 0.065 + 130 * k } }; }
  });

  /* ---------- 朋友圈：开学日（暖色、明亮的同一画法） ---------- */
  scene('school-day', {
    w: 600, h: 600, seed: 901, motion: true, still: 1, grain: 0.14, vig: 0.3, vigC: '60,40,30',
    init: function (r) {
      var m = [];
      for (var i = 0; i < 34; i++) m.push({ x: r(), y: 0.3 + r() * 0.6, ph: r() * 6, v: 0.004 + r() * 0.008, s: 0.6 + r() });
      return { motes: m, fog: fogList(r, 6, 0.55, 0.75, 160, 300, 0.07, 0.3) };
    },
    back: function (x, w, h, k, d, r) {
      var gy = h * 0.655, i;
      x.fillStyle = lin(x, 0, 0, 0, h, [[0, '#4d666d'], [0.3, '#7f9190'], [0.52, '#cfae92'], [0.64, '#efc79f'], [0.66, '#c9a588'], [1, '#6e5b4e']]);
      x.fillRect(0, 0, w, h);
      blob(x, w * 0.5, h * 0.58, w * 0.6, h * 0.34, [[0, 'rgba(255,226,180,.65)'], [0.4, 'rgba(255,200,150,.25)'], [1, 'rgba(255,200,150,0)']], 'lighter');
      ridge(x, w, h, k, r, h * 0.5, 26, 'rgba(116,132,136,.55)');
      ridge(x, w, h, k, r, h * 0.56, 14, 'rgba(98,112,114,.7)');
      // 校舍
      x.fillStyle = '#62716f';
      x.fillRect(w * 0.18, h * 0.44, w * 0.64, gy - h * 0.44);
      x.beginPath();
      x.moveTo(w * 0.4, h * 0.44);
      x.lineTo(w * 0.5, h * 0.385);
      x.lineTo(w * 0.6, h * 0.44);
      x.closePath();
      x.fill();
      x.fillStyle = 'rgba(255,220,180,.32)';
      for (i = 0; i < 3; i++) {
        for (var j = 0; j < 12; j++) x.fillRect(w * (0.2 + j * 0.051), h * (0.465 + i * 0.05), w * 0.024, h * 0.024);
      }
      blob(x, w * 0.5, h * 0.6, w * 0.7, h * 0.1, [[0, 'rgba(255,214,170,.35)'], [1, 'rgba(255,214,170,0)']], 'lighter');
      // 两边的树
      for (i = 0; i < 4; i++) bush(x, w * (0.02 + i * 0.07), gy + 4 * k, (52 + r() * 30) * k, r, '#43534f');
      for (i = 0; i < 4; i++) bush(x, w * (0.76 + i * 0.075), gy + 4 * k, (52 + r() * 30) * k, r, '#43534f');
      // 地面和路
      x.fillStyle = lin(x, 0, gy, 0, h, [[0, '#c9a98c'], [1, '#6e5b4e']]);
      x.fillRect(0, gy, w, h - gy);
      x.fillStyle = lin(x, 0, gy, 0, h, [[0, '#e7c9a7'], [1, '#9a826d']]);
      x.beginPath();
      x.moveTo(w * 0.43, gy);
      x.lineTo(w * 0.57, gy);
      x.lineTo(w * 0.8, h);
      x.lineTo(w * 0.2, h);
      x.closePath();
      x.fill();
      // 围墙和校门（门匾空白）
      x.fillStyle = '#3c4a49';
      x.fillRect(0, h * 0.585, w * 0.31, gy - h * 0.585 + 2 * k);
      x.fillRect(w * 0.69, h * 0.585, w * 0.31, gy - h * 0.585 + 2 * k);
      x.fillStyle = '#2f3b3b';
      x.fillRect(w * 0.3, h * 0.4, w * 0.065, gy - h * 0.4 + 3 * k);
      x.fillRect(w * 0.635, h * 0.4, w * 0.065, gy - h * 0.4 + 3 * k);
      x.fillRect(w * 0.29, h * 0.37, w * 0.42, h * 0.04);
      x.fillRect(w * 0.29, h * 0.385, w * 0.085, h * 0.025);
      x.fillRect(w * 0.625, h * 0.385, w * 0.085, h * 0.025);
      x.fillStyle = '#6f7a78';
      x.fillRect(w * 0.43, h * 0.377, w * 0.14, h * 0.026);
      // 打开的铁门靠在门柱边
      x.strokeStyle = 'rgba(40,50,50,.8)';
      x.lineWidth = 1.4 * k;
      for (i = 0; i < 6; i++) {
        x.beginPath(); x.moveTo(w * (0.37 + i * 0.008), h * 0.46); x.lineTo(w * (0.37 + i * 0.008), gy); x.stroke();
        x.beginPath(); x.moveTo(w * (0.63 - i * 0.008), h * 0.46); x.lineTo(w * (0.63 - i * 0.008), gy); x.stroke();
      }
      // 长长的影子朝我们这边
      x.save();
      blur(x, 3 * k);
      x.fillStyle = 'rgba(52,40,36,.35)';
      [[0.45, 0.905, -1], [0.555, 0.91, 1]].forEach(function (g) {
        x.beginPath();
        x.moveTo(w * g[0] - 7 * k, h * g[1]);
        x.lineTo(w * g[0] + 7 * k, h * g[1]);
        x.lineTo(w * g[0] + g[2] * 30 * k + 16 * k, h * 1.05);
        x.lineTo(w * g[0] + g[2] * 30 * k - 16 * k, h * 1.05);
        x.closePath();
        x.fill();
      });
      blur(x, 0);
      x.restore();
      // 两个背影：长发的和短发的；光从校门那边来，只亮头顶和肩膀的边
      blob(x, w * 0.5, h * 0.6, w * 0.16, h * 0.12, [[0, 'rgba(255,226,180,.3)'], [1, 'rgba(255,226,180,0)']], 'lighter');
      var rim = { c: '#f0caa0', dx: 0, dy: 1.1 * k, blur: 0.7 * k };
      cutout(x, w, h, at(w * 0.45, h * 0.905, 2.2 * k, 2.2 * k, function (y) { girlBack(y, { hair: 'long', step: 1, bag: 1 }); }), { fill: '#2a3130', rim: rim });
      cutout(x, w, h, at(w * 0.555, h * 0.91, 2.1 * k, 2.1 * k, function (y) { girlBack(y, { hair: 'short', step: -1, bag: -1 }); }), { fill: '#2a3130', rim: rim });
    },
    live: function (x, w, h, k, d, t) {
      fog(x, w, h, k, d.fog, t, '255,220,180');
      d.motes.forEach(function (m) {
        var y = (((m.y - m.v * t) % 1) + 1) % 1, px = m.x * w + Math.sin(t * 0.4 + m.ph) * 8 * k;
        glow(x, px, y * h, 2.2 * m.s * k, 2.2 * m.s * k, '255,230,190', 0.35 * (0.6 + 0.4 * Math.sin(t + m.ph)));
      });
    },
    feat: function (w, h, k) {
      return { gate: { x: w * 0.29, y: h * 0.37, w: w * 0.42, h: h * 0.29 }, girls: { x: w * 0.41, y: h * 0.68, w: w * 0.18, h: h * 0.23 } };
    }
  });

  /* ---------- 相册：深夜台灯下，左手画符号 ---------- */
  // 左手握笔，从拇指这一侧看：小臂从左下伸进来，笔尖朝右下点在纸上，笔杆朝左上。原点 = 笔尖。
  // 孔雀符号：一个眼睛，里面一个圈和一点，上面三根翎
  function symbol(x, cx, cy, s, a, part) {
    x.save();
    x.translate(cx, cy);
    x.rotate(a || 0);
    x.scale(s, s);
    x.beginPath();
    x.moveTo(-10, 0);
    x.quadraticCurveTo(0, -9, 10, 0);
    if (part !== 1) x.quadraticCurveTo(0, 9, -10, 0);
    x.moveTo(4, 0);
    x.arc(0, 0, 4, 0, part === 1 ? Math.PI : TAU);
    if (!part) {
      for (var i = -2; i <= 2; i++) {
        var a = -Math.PI / 2 + i * 0.42;
        x.moveTo(Math.cos(a) * 7, Math.sin(a) * 7 - 1);
        x.lineTo(Math.cos(a) * 14, Math.sin(a) * 14 - 1);
      }
      x.moveTo(0, 6.5); x.lineTo(0, 13);
    }
    x.stroke();
    if (!part) ell(x, 0, 0, 1.3, 1.3);
    x.restore();
  }
  // 左手握笔（从拇指这一侧看）：小臂从左下伸进来，笔尖朝右下点在纸上，笔杆朝左上。原点 = 笔尖，单位 ≈ 像素
  function handPalm(y) {
    limb(y, [[-150, -26], [-260, 40], [-420, 140]], 78);
    y.beginPath();
    y.moveTo(-72, -90);
    y.bezierCurveTo(-104, -104, -148, -84, -176, -62);
    y.lineTo(-186, 8);
    y.bezierCurveTo(-156, 30, -122, 30, -100, 18);
    y.bezierCurveTo(-84, 8, -66, -14, -62, -44);
    y.closePath();
    y.fill();
    limb(y, [[-100, 6], [-86, 22], [-72, 20]], 17);   // 小指，蜷着
    limb(y, [[-84, -4], [-62, 14], [-44, 10]], 19);   // 无名指
    limb(y, [[-64, -16], [-32, -4], [-10, -8]], 19);  // 中指，从下面托着笔
  }
  function handGrip(y) {
    limb(y, [[-74, -82], [-38, -66], [-14, -30]], 19); // 食指，压在笔上
    y.beginPath(); // 指尖稍微扁一点
    y.ellipse(-14, -30, 10.5, 8.5, 0.9, 0, TAU);
    y.fill();
    limb(y, [[-122, -24], [-80, -28], [-50, -26], [-28, -24]], 22); // 拇指，从靠近我们这边捏住笔
  }
  scene('desk-lefthand', {
    w: 800, h: 600, seed: 4401,
    geo: function (w, h, k) { return { tx: w * 0.45, ty: h * 0.6, s: 1.12 * k, px: w * 0.3, py: h * 0.6, lx: w * 0.28 }; },
    back: function (x, w, h, k, d, r) {
      var g = this.geo(w, h, k), i, j;
      function H(px, py) { return [g.tx + px * g.s, g.ty + py * g.s]; }
      function at(fn) { return function (y) { y.save(); y.translate(g.tx, g.ty); y.scale(g.s, g.s); fn(y); y.restore(); }; }
      // 墙和桌面
      x.fillStyle = lin(x, 0, 0, 0, h, [[0, '#030506'], [0.27, '#06090a'], [0.28, '#0d0a08'], [1, '#060403']]);
      x.fillRect(0, 0, w, h);
      blob(x, g.lx, h * 0.18, w * 0.42, h * 0.3, [[0, 'rgba(120,90,60,.14)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      // 右边暗处：窗、一摞本子、杯子
      x.fillStyle = 'rgba(30,48,58,.1)';
      x.fillRect(w * 0.66, h * 0.02, w * 0.24, h * 0.2);
      x.fillStyle = '#040403';
      x.fillRect(w * 0.775, h * 0.02, w * 0.008, h * 0.2);
      for (i = 0; i < 5; i++) {
        x.fillStyle = i % 2 ? '#0a0806' : '#0e0a08';
        x.fillRect(w * (0.64 + (r() - 0.5) * 0.012), h * (0.42 - i * 0.028), w * 0.2, h * 0.028);
      }
      x.fillStyle = '#090706';
      x.fillRect(w * 0.88, h * 0.35, w * 0.05, h * 0.1);
      // 台灯的光池
      blob(x, g.px + w * 0.04, g.py, w * 0.44, h * 0.52, [[0, 'rgba(255,186,120,.42)'], [0.45, 'rgba(200,120,60,.15)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      // 纸
      x.save();
      x.translate(g.px, g.py);
      x.rotate(-0.05);
      x.fillStyle = 'rgba(0,0,0,.4)';
      blur(x, 6 * k);
      x.fillRect(-150 * k + 6 * k, -190 * k + 8 * k, 300 * k, 380 * k);
      blur(x, 0);
      var pg = x.createRadialGradient(20 * k, -50 * k, 10 * k, 0, 0, 270 * k);
      pg.addColorStop(0, '#d8c3a0');
      pg.addColorStop(0.45, '#a68d6c');
      pg.addColorStop(1, '#3a2f25');
      x.fillStyle = pg;
      x.fillRect(-150 * k, -190 * k, 300 * k, 380 * k);
      // 一遍一遍画的同一个符号
      x.strokeStyle = x.fillStyle = 'rgba(26,28,44,.72)';
      x.lineWidth = 1.1;
      x.lineCap = 'round';
      for (i = 0; i < 4; i++) {
        for (j = 0; j < 4; j++) {
          if (i === 3 && j > 1) continue;
          symbol(x, (-100 + j * 62 + (r() - 0.5) * 6) * k, (-136 + i * 64 + (r() - 0.5) * 6) * k, 1.1 * k, (r() - 0.5) * 0.12);
        }
      }
      x.restore();
      // 正在画的那一个（笔尖下面，只画了一半）
      x.strokeStyle = x.fillStyle = 'rgba(22,24,40,.85)';
      x.lineWidth = 1.4;
      x.lineCap = 'round';
      symbol(x, g.tx - 14 * k, g.ty + 4 * k, 1.5 * k, -0.05, 1);
      // 台灯罩（从画面上边伸进来）
      x.fillStyle = '#070605';
      x.beginPath();
      x.moveTo(g.lx - 0.1 * w, -4 * k);
      x.lineTo(g.lx + 0.12 * w, -4 * k);
      x.lineTo(g.lx + 0.16 * w, h * 0.1);
      x.quadraticCurveTo(g.lx, h * 0.135, g.lx - 0.15 * w, h * 0.1);
      x.closePath();
      x.fill();
      blob(x, g.lx, h * 0.105, w * 0.14, h * 0.025, [[0, 'rgba(255,230,180,.9)'], [0.6, 'rgba(255,190,120,.3)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      // 手在纸上的影子
      x.save();
      blur(x, 10 * k);
      x.globalAlpha = 0.55;
      x.translate(16 * k, 22 * k);
      x.fillStyle = x.strokeStyle = '#000';
      x.lineCap = x.lineJoin = 'round';
      at(handPalm)(x);
      at(handGrip)(x);
      x.restore();
      // 左手：手掌和蜷着的手指 → 笔 → 捏着笔的食指和拇指
      var skin = function (y) {
        y.fillStyle = lin(y, g.tx - 40 * g.s, g.ty - 100 * g.s, g.tx - 150 * g.s, g.ty + 80 * g.s, [[0, 'rgba(120,76,50,.9)'], [0.45, 'rgba(60,36,24,.6)'], [1, 'rgba(0,0,0,0)']]);
        y.globalCompositeOperation = 'source-atop';
        y.fillRect(0, 0, w, h);
      };
      var rim = { c: '#d29a6c', dx: 2 * k, dy: 3 * k, blur: 2 * k };
      cutout(x, w, h, at(handPalm), { fill: '#1d120c', rim: rim, shade: skin });
      var p0 = H(0, 0), p1 = H(-128, -160);
      x.lineCap = 'round';
      x.strokeStyle = '#0a0a0e';
      x.lineWidth = 6.5 * k;
      x.beginPath(); x.moveTo(p0[0], p0[1]); x.lineTo(p1[0], p1[1]); x.stroke();
      x.strokeStyle = 'rgba(255,220,170,.35)';
      x.lineWidth = 1.2 * k;
      x.beginPath(); x.moveTo(p0[0] - 2.2 * k, p0[1] - 1.2 * k); x.lineTo(p1[0] - 2.2 * k, p1[1] - 1.2 * k); x.stroke();
      x.strokeStyle = '#2a2a30';
      x.lineWidth = 2.2 * k;
      var p3 = H(-11, -14);
      x.beginPath(); x.moveTo(p0[0], p0[1]); x.lineTo(p3[0], p3[1]); x.stroke();
      cutout(x, w, h, at(handGrip), { fill: '#24160f', rim: rim, shade: skin });
    },
    feat: function (w, h, k) {
      var g = this.geo(w, h, k);
      return {
        paper: { x: g.px - 150 * k, y: g.py - 190 * k, w: 300 * k, h: 380 * k },
        hand: { x: g.tx - 200 * g.s, y: g.ty - 110 * g.s, w: 210 * g.s, h: 150 * g.s },
        symbol: { x: g.tx - 14 * k, y: g.ty + 4 * k, r: 22 * k }
      };
    }
  });

  /* ---------- 校史：泛黄的旧照片，山脚的小动物园 ---------- */
  scene('old-zoo', {
    w: 800, h: 600, seed: 5150, grain: 0.32, vig: 0.75, vigC: '58,38,20',
    back: function (x, w, h, k, d, r) {
      var gy = h * 0.68, i;
      blur(x, 0.7 * k);
      x.fillStyle = lin(x, 0, 0, 0, h, [[0, '#d4c19d'], [0.55, '#c6ae88'], [0.68, '#b29b77'], [1, '#8c7556']]);
      x.fillRect(0, 0, w, h);
      // 远山、近山（几座峰），山脚一层树和雾
      ridge(x, w, h, k, r, h * 0.3, 46, '#bfa985');
      x.fillStyle = '#a89272';
      x.beginPath();
      x.moveTo(0, h * 0.46);
      x.bezierCurveTo(w * 0.08, h * 0.4, w * 0.16, h * 0.3, w * 0.24, h * 0.24);
      x.bezierCurveTo(w * 0.29, h * 0.2, w * 0.32, h * 0.21, w * 0.35, h * 0.17);
      x.bezierCurveTo(w * 0.39, h * 0.12, w * 0.43, h * 0.13, w * 0.47, h * 0.18);
      x.bezierCurveTo(w * 0.53, h * 0.25, w * 0.58, h * 0.24, w * 0.63, h * 0.29);
      x.bezierCurveTo(w * 0.72, h * 0.37, w * 0.86, h * 0.36, w, h * 0.42);
      x.lineTo(w, h);
      x.lineTo(0, h);
      x.closePath();
      x.fill();
      x.save();
      x.clip();
      for (i = 0; i < 160; i++) { // 山坡下半截的树
        var tx = r() * w, ty = h * (0.34 + r() * r() * 0.22);
        x.fillStyle = 'rgba(128,106,78,' + (0.1 + r() * 0.14).toFixed(2) + ')';
        ell(x, tx, ty, (3 + r() * 6) * k, (3 + r() * 4) * k);
      }
      x.strokeStyle = 'rgba(214,198,166,.22)';
      x.lineWidth = 2 * k;
      for (i = 0; i < 6; i++) { // 山脊上的亮线
        var rx0 = w * (0.2 + r() * 0.5), ry0 = h * (0.16 + r() * 0.1);
        x.beginPath(); x.moveTo(rx0, ry0); x.quadraticCurveTo(rx0 + (r() - 0.5) * 60 * k, ry0 + 50 * k, rx0 + (r() - 0.5) * 90 * k, ry0 + 120 * k); x.stroke();
      }
      x.restore();
      // 地面
      x.fillStyle = lin(x, 0, gy - 20 * k, 0, h, [[0, '#a8916c'], [1, '#7d6748']]);
      x.fillRect(0, gy - 16 * k, w, h);
      // 三个铁笼
      [[0.07, 0.3, 0.45], [0.36, 0.56, 0.48], [0.62, 0.77, 0.52]].forEach(function (c, ci) {
        var X0 = c[0] * w, X1 = c[1] * w, top = c[2] * h, bot = gy + ci * 4 * k;
        x.fillStyle = 'rgba(90,72,52,.35)';
        x.fillRect(X0, top, X1 - X0, bot - top);
        x.fillStyle = '#5b4834';
        x.fillRect(X0 - 4 * k, top - 8 * k, X1 - X0 + 8 * k, 9 * k);
        x.fillRect(X0 - 2 * k, bot - 4 * k, X1 - X0 + 4 * k, 6 * k);
        x.save();
        x.beginPath(); x.rect(X0, top, X1 - X0, bot - top); x.clip();
        if (ci === 1) peacock(x, X0 + (X1 - X0) * 0.36, top + (bot - top) * 0.55, 1.3 * k, -1, { col: '#4a3a29' });
        if (ci === 1) { x.fillStyle = '#5b4834'; x.fillRect(X0 + 10 * k, top + (bot - top) * 0.55, X1 - X0 - 20 * k, 3 * k); }
        if (ci === 2) peacock(x, X0 + (X1 - X0) * 0.7, bot - 6 * k, 1.15 * k, 1, { col: '#4a3a29' });
        x.restore();
        x.fillStyle = '#4d3c2b';
        var n = Math.round((X1 - X0) / (9 * k));
        for (var j = 0; j <= n; j++) x.fillRect(X0 + (X1 - X0) * j / n - 1 * k, top, 2 * k, bot - top);
      });
      // 笼子外面的孔雀
      peacock(x, w * 0.4, h * 0.82, 2.1 * k, -1, { col: '#3e3123', eyes: 0.22 });
      peacock(x, w * 0.18, h * 0.78, 1.7 * k, 1, { col: '#46372a' });
      // 空白的木牌
      x.fillStyle = '#5a4630';
      x.fillRect(w * 0.83, h * 0.6, 4 * k, h * 0.16);
      x.fillRect(w * 0.93, h * 0.6, 4 * k, h * 0.16);
      x.fillStyle = '#806548';
      x.fillRect(w * 0.81, h * 0.555, w * 0.14, h * 0.075);
      x.fillStyle = 'rgba(60,45,30,.35)';
      x.fillRect(w * 0.81, h * 0.62, w * 0.14, h * 0.01);
      weeds(x, 0, w * 0.3, h * 0.97, k, r, 40, 30, 'rgba(90,72,50,.55)');
      weeds(x, w * 0.7, w, h * 0.98, k, r, 40, 34, 'rgba(90,72,50,.55)');
      blur(x, 0);
      // 旧照片：污渍、纤维、划痕、褪色
      for (i = 0; i < 9; i++) blob(x, r() * w, r() * h, (40 + r() * 120) * k, (30 + r() * 90) * k, [[0, 'rgba(120,90,50,' + (0.04 + r() * 0.08).toFixed(2) + ')'], [1, 'rgba(120,90,50,0)']]);
      blob(x, w * 0.92, h * 0.08, w * 0.3, h * 0.3, [[0, 'rgba(250,236,210,.35)'], [1, 'rgba(250,236,210,0)']]);
      x.lineCap = 'round';
      for (i = 0; i < 70; i++) {
        var fx = r() * w, fy = r() * h, fl = (4 + r() * 14) * k, fa = r() * TAU;
        x.strokeStyle = r() < 0.5 ? 'rgba(250,240,220,.18)' : 'rgba(70,50,30,.14)';
        x.lineWidth = 0.6 * k;
        x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + Math.cos(fa) * fl, fy + Math.sin(fa) * fl); x.stroke();
      }
      for (i = 0; i < 4; i++) {
        var sx = r() * w;
        x.strokeStyle = 'rgba(245,235,215,.22)';
        x.lineWidth = 0.8 * k;
        x.beginPath();
        x.moveTo(sx, 0);
        x.quadraticCurveTo(sx + (r() - 0.5) * 60 * k, h * 0.5, sx + (r() - 0.5) * 40 * k, h);
        x.stroke();
      }
    },
    feat: function (w, h, k) {
      return { sign: { x: w * 0.81, y: h * 0.555, w: w * 0.14, h: h * 0.075 }, peacock: { x: w * 0.36, y: h * 0.74, r: 70 * k } };
    }
  });

  /* ---------- 10 废弃动物园门口 ---------- */
  scene('zoo-gate', {
    w: 420, h: 750, seed: 1010, motion: true, still: 3,
    init: function (r) { return { fog: fogList(r, 8, 0.45, 0.95, 120, 260, 0.06) }; },
    geo: function (w, h, k) {
      var cx = w * 0.635, half = 0.205 * w;
      return { cx: cx, L0: cx - half - 15 * k, L1: cx - half + 15 * k, R0: cx + half - 15 * k, R1: cx + half + 15 * k, top: h * 0.36, wall: h * 0.505, gy: h * 0.775, rise: 66 * k, px: w * 0.205 };
    },
    back: function (x, w, h, k, d, r) {
      var g = this.geo(w, h, k), i, j;
      woods(x, w, h, k, r, { ground: 0.68, hx: 0.64, haze: 0.2, thick: 4, crowns: 12 });
      // 门里透出来的雾光，拱门和铁条在雾前面是剪影
      blob(x, g.cx, h * 0.6, 170 * k, 240 * k, [[0, 'rgba(96,122,126,.42)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      blob(x, g.cx, g.top - 30 * k, 160 * k, 100 * k, [[0, 'rgba(96,122,126,.24)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      blob(x, w * 0.22, h * 0.44, 110 * k, 70 * k, [[0, 'rgba(90,116,120,.14)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      // 围墙
      x.fillStyle = lin(x, 0, g.wall, 0, g.gy, [[0, '#0b1112'], [1, '#050707']]);
      x.fillRect(0, g.wall, g.L0, g.gy - g.wall);
      x.fillRect(g.R1, g.wall, w - g.R1, g.gy - g.wall);
      x.fillStyle = 'rgba(110,128,130,.16)';
      x.fillRect(0, g.wall - 3 * k, g.L0, 4 * k);
      x.fillRect(g.R1, g.wall - 3 * k, w - g.R1, 4 * k);
      x.fillStyle = 'rgba(0,0,0,.25)';
      for (i = 0; i < 9; i++) {
        var by = g.wall + (i + 1) * (g.gy - g.wall) / 10;
        x.fillRect(0, by, g.L0, 1 * k);
        x.fillRect(g.R1, by, w - g.R1, 1 * k);
      }
      for (i = 0; i < 10; i++) blob(x, r() * w, g.wall + r() * (g.gy - g.wall), (14 + r() * 30) * k, (8 + r() * 16) * k, [[0, 'rgba(0,0,0,.35)'], [1, 'rgba(0,0,0,0)']]);
      // 门扇：竖条、横档、矛尖；两扇之间留一条缝
      var bt = g.top + 22 * k, n = 13;
      x.fillStyle = '#060505';
      for (i = 0; i <= n; i++) {
        var bx = g.L1 + (g.R0 - g.L1) * i / n;
        if (Math.abs(bx - g.cx) < 4 * k) continue;
        var tip = bt - 6 * k + Math.abs(i - n / 2) * 1.2 * k;
        x.fillRect(bx - 1.3 * k, tip, 2.6 * k, g.gy - tip);
        x.beginPath(); x.moveTo(bx - 3 * k, tip); x.lineTo(bx, tip - 8 * k); x.lineTo(bx + 3 * k, tip); x.closePath(); x.fill();
      }
      [0.47, 0.62, 0.76].forEach(function (f) { x.fillRect(g.L1, h * f, g.cx - g.L1 - 4 * k, 3 * k); x.fillRect(g.cx + 4 * k, h * f, g.R0 - g.cx - 4 * k, 3 * k); });
      x.fillStyle = 'rgba(120,64,34,.22)';
      for (i = 0; i <= n; i++) x.fillRect(g.L1 + (g.R0 - g.L1) * i / n - 1.3 * k, bt + 40 * k + r() * 80 * k, 1 * k, (20 + r() * 60) * k);
      // 门柱
      [[g.L0, g.L1], [g.R0, g.R1]].forEach(function (p) {
        x.fillStyle = lin(x, p[0], 0, p[1], 0, [[0, '#0d1213'], [0.5, '#0a0e0f'], [1, '#040606']]);
        x.fillRect(p[0], g.top, p[1] - p[0], g.gy - g.top + 4 * k);
        x.fillStyle = '#0c1112';
        x.fillRect(p[0] - 4 * k, g.top - 8 * k, p[1] - p[0] + 8 * k, 9 * k);
        x.fillStyle = 'rgba(120,136,138,.16)';
        x.fillRect(p[0] - 4 * k, g.top - 8 * k, p[1] - p[0] + 8 * k, 1.5 * k);
      });
      // 拱：两道铁条，中间竖着的短条，正中一块空白的牌子
      var ax = g.cx, ay = g.top - 8 * k, rx = (g.R0 + g.R1) / 2 - g.cx;
      x.strokeStyle = '#070606';
      x.lineCap = 'round';
      x.lineWidth = 4 * k;
      x.beginPath(); x.ellipse(ax, ay, rx, g.rise, 0, Math.PI, TAU); x.stroke();
      x.lineWidth = 2.6 * k;
      x.beginPath(); x.ellipse(ax, ay, rx, g.rise - 18 * k, 0, Math.PI * 1.06, Math.PI * 1.94); x.stroke();
      x.lineWidth = 1.6 * k;
      for (i = 1; i < 20; i++) {
        var aa = Math.PI + i / 20 * Math.PI, ca = Math.cos(aa), sa = Math.sin(aa);
        x.beginPath(); x.moveTo(ax + ca * rx, ay + sa * g.rise); x.lineTo(ax + ca * rx, ay + sa * Math.max(0, g.rise - 18 * k)); x.stroke();
      }
      x.save();
      x.translate(ax, ay - g.rise + 22 * k);
      x.rotate(0.05);
      x.fillStyle = '#140e0c';
      x.fillRect(-44 * k, -11 * k, 88 * k, 22 * k);
      x.fillStyle = 'rgba(120,60,30,.22)';
      x.fillRect(-44 * k, -11 * k, 88 * k, 1.6 * k);
      blob(x, 18 * k, 4 * k, 22 * k, 10 * k, [[0, 'rgba(110,50,24,.3)'], [1, 'rgba(0,0,0,0)']]);
      blob(x, -26 * k, -2 * k, 14 * k, 8 * k, [[0, 'rgba(110,50,24,.2)'], [1, 'rgba(0,0,0,0)']]);
      x.restore();
      // 藤蔓
      x.strokeStyle = x.fillStyle = '#040605';
      for (i = 0; i < 16; i++) {
        var vu = r() * 0.6, va = Math.PI + (vu < 0.3 ? 0.06 + vu : 0.34 + vu) * Math.PI, vx = ax + Math.cos(va) * rx, vy = ay + Math.sin(va) * g.rise, vl = (30 + r() * 120) * k;
        if (i > 11) { vx = r() < 0.5 ? g.L0 + r() * 30 * k : g.R0 + r() * 30 * k; vy = g.top; }
        x.lineWidth = 1 * k;
        x.beginPath();
        x.moveTo(vx, vy);
        for (j = 1; j <= 8; j++) x.lineTo(vx + Math.sin(j * 1.3 + i) * 4 * k, vy + vl * j / 8);
        x.stroke();
        for (j = 1; j <= 8; j++) ell(x, vx + Math.sin(j * 1.3 + i) * 4 * k + (j % 2 ? 3 : -3) * k, vy + vl * j / 8, 3.4 * k, 1.8 * k, j % 2 ? 0.5 : -0.5);
      }
      for (i = 0; i < 40; i++) ell(x, r() * g.L0, g.wall + r() * 10 * k, (3 + r() * 5) * k, (2 + r() * 3) * k, r() * 3);
      // 墙头上那只羽毛失去光泽的孔雀
      peacock(x, g.px, g.wall - 1 * k, 1.55 * k, 1, { drape: true, col: '#040708', eyes: 0.4, sheen: 0.14, rim: { c: '110,140,142', a: 0.26, dx: 0.4 * k, dy: -1.2 * k, blur: 1 * k } });
      // 地面、杂草
      weeds(x, 0, w, g.gy + 6 * k, k, r, 120, 26, '#020303');
      weeds(x, 0, w, h * 0.96, k, r, 80, 40, '#010101');
    },
    live: function (x, w, h, k, d, t) { fog(x, w, h, k, d.fog, t); },
    feat: function (w, h, k) {
      var g = this.geo(w, h, k);
      return {
        peacock: { x: g.px + 2 * k, y: g.wall - 40 * k, r: 58 * k },
        gate: { x: g.L0, y: g.top - 8 * k - g.rise, w: g.R1 - g.L0, h: g.gy - g.top + 8 * k + g.rise }
      };
    }
  });

  /* ---------- 11 一排生锈的铁笼，右边一棵很粗的树 ---------- */
  // 瘦得只剩骨架的动物（不画伤口），脚底在 (0,0)，朝左
  var DEER = 'M-24 -40C-20 -44 -10 -45 2 -44C10 -44 16 -46 20 -50C22 -56 22 -62 24 -66L22 -72L26 -70L28 -76L29 -69C32 -67 33 -64 31 -62L28 -61C27 -56 26 -48 24 -42' +
    'C26 -36 25 -30 22 -26L21 0L19 0L18.4 -24C14 -22 10 -22 8 -24L7.4 0L5.6 0L5.2 -26C-4 -26 -10 -26 -16 -28L-18 0L-20 0L-20.6 -30C-22 -30 -23 -30 -24 -31L-25.6 0L-27.4 0L-27 -34C-28 -37 -27 -39 -24 -40Z';
  var DOG = 'M-22 -24C-18 -28 -6 -28 6 -27C12 -27 16 -30 19 -33L22 -38L23 -33L27 -32L30 -29L24 -26C22 -22 20 -18 18 -15L17.4 0L15.6 0L15 -14C8 -14 0 -14 -8 -15L-9 0L-11 0L-11.4 -16C-14 -16 -17 -17 -19 -18L-20 0L-22 0L-22 -19C-26 -22 -30 -28 -34 -30C-30 -29 -26 -27 -22 -24Z';
  /** 一个铁笼：正面 (x0..x1, y0..y1)，往灭点 (vx, vy) 缩进 f；里面先画 inside()。 */
  function cage(x, k, r, x0, y0, x1, y1, vx, vy, f, inside) {
    function back(px, py) { return [px + (vx - px) * f, py + (vy - py) * f]; }
    var b00 = back(x0, y0), b10 = back(x1, y0), b11 = back(x1, y1), b01 = back(x0, y1), i, n, u;
    // 里面：后墙被雾照着一点
    x.fillStyle = lin(x, 0, y0, 0, y1, [[0, '#0d1517'], [1, '#050808']]);
    x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y0); x.lineTo(b10[0], b10[1]); x.lineTo(b11[0], b11[1]); x.lineTo(x1, y1); x.lineTo(x0, y1); x.closePath(); x.fill();
    blob(x, (b00[0] + b10[0]) / 2, (b00[1] + b01[1]) / 2, (b10[0] - b00[0]) * 0.7, (b01[1] - b00[1]) * 0.6, [[0, 'rgba(90,112,114,.2)'], [1, 'rgba(0,0,0,0)']], 'lighter');
    x.fillStyle = '#040505';
    x.fillRect(b00[0], b01[1] - 4 * k * (1 - f), b11[0] - b01[0], y1 - b01[1] + 4 * k);
    if (inside) inside();
    // 侧面的栏杆（往灭点收）
    n = 7;
    for (i = 0; i <= n; i++) {
      u = i / n;
      var tx = x1 + (b10[0] - x1) * u, ty = y0 + (b10[1] - y0) * u, by = y1 + (b11[1] - y1) * u, bw = 2.4 * k * (1 - f * u);
      x.fillStyle = '#050403';
      x.fillRect(tx - bw / 2, ty, bw, by - ty);
    }
    // 顶
    x.fillStyle = '#060707';
    x.beginPath(); x.moveTo(x0 - 3 * k, y0); x.lineTo(x1 + 3 * k, y0); x.lineTo(b10[0], b10[1]); x.lineTo(b00[0], b00[1]); x.closePath(); x.fill();
    x.fillStyle = '#070606';
    x.fillRect(x0 - 4 * k, y0 - 4 * k, x1 - x0 + 8 * k, 7 * k);
    x.fillStyle = 'rgba(120,136,138,.14)';
    x.fillRect(x0 - 4 * k, y0 - 4 * k, x1 - x0 + 8 * k, 1.2 * k);
    // 正面的栏杆
    n = Math.max(4, Math.round((x1 - x0) / (10 * k)));
    for (i = 0; i <= n; i++) {
      var px = x0 + (x1 - x0) * i / n, w2 = (i === 0 || i === n ? 5 : 2.6) * k;
      x.fillStyle = '#060403';
      x.fillRect(px - w2 / 2, y0, w2, y1 - y0);
      x.fillStyle = rgba('140,78,40', 0.1 + r() * 0.14);
      x.fillRect(px - w2 / 2, y0 + (y1 - y0) * r() * 0.6, w2 * 0.45, (y1 - y0) * (0.15 + r() * 0.35));
    }
    x.fillStyle = '#060403';
    x.fillRect(x0, y0 + (y1 - y0) * 0.5, x1 - x0, 2.4 * k);
    x.fillRect(x0 - 3 * k, y1 - 3 * k, x1 - x0 + 6 * k, 8 * k);
  }
  scene('cages', {
    w: 420, h: 750, seed: 1111, motion: true, still: 2,
    init: function (r) {
      var lights = [];
      for (var i = 0; i < 30; i++) lights.push({ x: 0.46 + r() * 0.3, y: 0.5 + r() * 0.03, s: 0.5 + r() * 0.9, ph: r() * 6, f: 0.6 + r() * 2 });
      return { lights: lights, fog: fogList(r, 8, 0.5, 0.95, 120, 260, 0.06) };
    },
    tree: function (w, h, k) { return { x0: w - 96 * k, x1: w + 10 * k }; },
    back: function (x, w, h, k, d, r) {
      woods(x, w, h, k, r, { ground: 0.6, hx: 0.6, haze: 0.26, thin: 0, crowns: 0, thick: 0, stones: 0 });
      blob(x, w * 0.6, h * 0.52, 140 * k, 50 * k, [[0, 'rgba(130,112,84,.14)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      ridge(x, w, h, k, r, h * 0.535, 8, '#050909');
      x.fillStyle = '#040707';
      for (var i = 0; i < 10; i++) x.fillRect(w * (0.44 + r() * 0.34), h * (0.505 + r() * 0.02), (8 + r() * 20) * k, 40 * k);
    },
    live: function (x, w, h, k, d, t) {
      d.lights.forEach(function (L) {
        var b = 0.55 + 0.45 * Math.sin(t * L.f + L.ph) * Math.sin(t * L.f * 0.37 + L.ph * 2);
        glow(x, L.x * w, L.y * h, 6 * L.s * k, 6 * L.s * k, '255,190,120', 0.35 * b + 0.15);
        glow(x, L.x * w, L.y * h, 1.2 * L.s * k, 1.2 * L.s * k, '255,236,200', 0.6 * b + 0.3);
      });
    },
    front: function (x, w, h, k, d, r) {
      var T = this.tree(w, h, k), gy = h * 0.82, i, VX = w * 0.7, VY = h * 0.54;
      woods(x, w, h, k, r, { bg: false, ground: 0.62, crowns: 14, thick: 4, stones: 0 });
      x.fillStyle = lin(x, 0, h * 0.6, 0, h, [[0, 'rgba(6,9,9,0)'], [0.12, '#060909'], [1, '#020303']]);
      x.fillRect(0, h * 0.6, w, h * 0.4);
      woods(x, w, h, k, r, { bg: false, ground: 0.62, thin: 0, crowns: 0, thick: 0 });
      // 三个铁笼往远处排开
      cage(x, k, r, w * 0.58, h * 0.555, w * 0.66, h * 0.625, VX, VY, 0.3);
      cage(x, k, r, w * 0.36, h * 0.5, w * 0.56, h * 0.67, VX, VY, 0.28, function () {
        sil(x, [DOG], w * 0.47, h * 0.655, 1.25 * k, 1.25 * k, 0, '#020303', { c: '110,130,132', a: 0.35, dy: -1 * k, blur: 0.8 * k });
      });
      cage(x, k, r, -w * 0.06, h * 0.42, w * 0.34, h * 0.8, VX, VY, 0.26, function () {
        sil(x, [DEER], w * 0.15, h * 0.77, 2.3 * k, 2.3 * k, 0, '#020303', { c: '110,130,132', a: 0.35, dy: -1.2 * k, blur: 1 * k });
      });
      weeds(x, 0, w * 0.8, gy, k, r, 80, 24, '#020303');
      // 很粗的一棵树
      x.fillStyle = lin(x, T.x0 - 20 * k, 0, T.x1, 0, [[0, '#101516'], [0.14, '#0b0d0c'], [0.5, '#060706'], [1, '#020202']]);
      x.beginPath();
      x.moveTo(T.x0 + 8 * k, -10 * k);
      x.bezierCurveTo(T.x0 - 2 * k, h * 0.3, T.x0 + 6 * k, h * 0.62, T.x0 - 6 * k, h * 0.84);
      x.quadraticCurveTo(T.x0 - 14 * k, h * 0.9, T.x0 - 40 * k, h * 0.93);
      x.lineTo(w + 10 * k, h * 0.94);
      x.lineTo(w + 10 * k, -10 * k);
      x.closePath();
      x.fill();
      x.fillStyle = 'rgba(0,0,0,.45)';
      for (i = 0; i < 16; i++) x.fillRect(T.x0 + (8 + r() * 80) * k, r() * h * 0.8, (1 + r() * 2) * k, (40 + r() * 140) * k);
      x.fillStyle = 'rgba(100,120,122,.08)';
      for (i = 0; i < 10; i++) x.fillRect(T.x0 + (4 + r() * 26) * k, r() * h * 0.8, 1 * k, (30 + r() * 100) * k);
      // 树根往左边铺开；朝雾那边的树皮有一点冷光
      x.fillStyle = '#060707';
      [[0.86, 46, 10], [0.9, 70, 8], [0.925, 30, 12]].forEach(function (R) {
        x.beginPath();
        x.moveTo(T.x0 + 20 * k, h * R[0] - R[2] * k);
        x.quadraticCurveTo(T.x0 - R[1] * 0.5 * k, h * R[0] - R[2] * 0.4 * k, T.x0 - R[1] * k, h * R[0] + 4 * k);
        x.lineTo(T.x0 + 20 * k, h * R[0] + R[2] * k);
        x.closePath();
        x.fill();
      });
      x.save();
      blur(x, 3 * k);
      x.strokeStyle = 'rgba(110,135,138,.16)';
      x.lineWidth = 3 * k;
      x.beginPath();
      x.moveTo(T.x0 + 9 * k, -10 * k);
      x.bezierCurveTo(T.x0 - 1 * k, h * 0.3, T.x0 + 7 * k, h * 0.62, T.x0 - 5 * k, h * 0.84);
      x.stroke();
      x.restore();
      x.strokeStyle = '#030404';
      x.lineWidth = 16 * k;
      x.beginPath(); x.moveTo(T.x0 + 30 * k, h * 0.12); x.quadraticCurveTo(T.x0 - 60 * k, h * 0.06, T.x0 - 150 * k, -20 * k); x.stroke();
      x.lineWidth = 7 * k;
      x.beginPath(); x.moveTo(T.x0 - 70 * k, h * 0.065); x.quadraticCurveTo(T.x0 - 110 * k, h * 0.09, T.x0 - 170 * k, h * 0.08); x.stroke();
      weeds(x, 0, w, h * 0.97, k, r, 70, 34, '#010101');
    },
    over: function (x, w, h, k, d, t) { fog(x, w, h, k, d.fog, t); },
    feat: function (w, h, k) { var T = this.tree(w, h, k); return { tree: { x: T.x0 - 10 * k, y: 0, w: w - T.x0 + 10 * k, h: h * 0.93 } }; }
  });

  /* ---------- 12 开头：躲在大树后面的女孩 ---------- */
  // 侧脸朝左，原点在头的中间，头高约 115；身体一直延伸到画面下面
  var PEEK = 'M0 -66C34 -66 60 -44 64 -10C68 22 64 56 66 92C58 100 48 100 40 96L44 112C74 122 104 136 124 156L150 1200L-90 1200' +
    'C-88 300 -80 200 -66 150C-58 124 -42 110 -26 104C-21 96 -19 86 -19 76C-25 70 -33 64 -39 60C-46 58 -51 54 -52 49' +
    'C-53 45 -52 41 -51 39C-55 37 -56 34 -53 31C-56 29 -56 26 -54 24C-56 22 -60 19 -64 15C-62 10 -57 2 -53 -4' +
    'C-54 -10 -53 -16 -51 -22C-55 -26 -53 -32 -50 -34C-53 -38 -50 -44 -45 -46C-34 -60 -18 -66 0 -66Z';
  function peekShape(y, g) {
    y.save();
    y.translate(g.hx, g.hy);
    y.scale(g.u, g.u);
    y.fill(new Path2D(PEEK));
    // 举起来扶着树干边的手：小臂藏在头后面，四根手指从树干边上绕过来
    limb(y, [[70, -30], [60, -100]], 26);
    limb(y, [[60, -104], [50, -126]], 30);
    [[-140, 0], [-129, 1], [-118, 2], [-108, 3]].forEach(function (f, i) {
      var fy = f[0];
      limb(y, [[52, fy + 4], [34, fy + 1], [22 + i, fy + 6], [19 + i * 1.5, fy + 13]], 9.5 - i * 0.6);
    });
    limb(y, [[48, -100], [34, -98], [26, -104]], 10);
    y.restore();
  }
  scene('hiding', {
    w: 420, h: 750, seed: 1212, motion: true, still: 1.7,
    init: function (r) { return { fog: fogList(r, 7, 0.45, 0.9, 120, 240, 0.055) }; },
    geo: function (w, h, k) { return { hx: w * 0.5, hy: h * 0.47, u: k, fx: w * 0.15, fy: h * 0.62, tx: w * 0.5 + 42 * k }; },
    back: function (x, w, h, k, d, r) {
      var g = this.geo(w, h, k);
      woods(x, w, h, k, r, { ground: 0.64, hx: 0.2, haze: 0.16, thick: 6 });
      blob(x, g.fx, g.fy - 30 * k, 160 * k, 120 * k, [[0, 'rgba(90,70,60,.14)'], [1, 'rgba(0,0,0,0)']], 'lighter');
    },
    trunk: function (x, w, h, k, g) {
      x.beginPath();
      x.moveTo(g.tx + 14 * k, -10 * k);
      x.bezierCurveTo(g.tx + 2 * k, h * 0.25, g.tx + 12 * k, h * 0.55, g.tx - 2 * k, h * 0.8);
      x.quadraticCurveTo(g.tx - 12 * k, h * 0.95, g.tx - 52 * k, h + 10 * k);
      x.lineTo(w + 10 * k, h + 10 * k);
      x.lineTo(w + 10 * k, -10 * k);
      x.closePath();
    },
    live: function (x, w, h, k, d, t) {
      var g = this.geo(w, h, k), L = flick(t, 1.2) * 0.9;
      fireLight(x, g.fx, g.fy, 0.5 * k, L);
      [-40, -22, 22, 42, -8].forEach(function (o, i) {
        hooded(x, g.fx + o * k, g.fy + (i === 4 ? -10 : i % 2 ? 4 : -3) * k, (i === 4 ? 22 : 27 + i % 2 * 5) * k, L * 0.85, {});
      });
      logs(x, g.fx, g.fy, 0.45 * k, L);
      flames(x, g.fx, g.fy, 0.45 * k, t, L, 7, 46, 7);
      fog(x, w, h, k, d.fog, t);
    },
    front: function (x, w, h, k, d, r) {
      var g = this.geo(w, h, k), self = this, i;
      // 粗树干：比女孩远一点，挡住火那边
      x.fillStyle = lin(x, g.tx, 0, w, 0, [[0, '#120f0d'], [0.08, '#0b0908'], [0.45, '#060505'], [1, '#020202']]);
      self.trunk(x, w, h, k, g);
      x.fill();
      x.save();
      self.trunk(x, w, h, k, g);
      x.clip();
      x.lineCap = 'round';
      for (i = 0; i < 46; i++) {
        var bx = g.tx + (4 + r() * 190) * k, by = r() * h, bl = (40 + r() * 170) * k;
        x.strokeStyle = r() < 0.7 ? 'rgba(0,0,0,.55)' : 'rgba(70,64,58,.08)';
        x.lineWidth = (1 + r() * 3) * k;
        x.beginPath();
        x.moveTo(bx, by);
        x.quadraticCurveTo(bx + (r() - 0.5) * 8 * k, by + bl / 2, bx + (r() - 0.5) * 6 * k, by + bl);
        x.stroke();
      }
      x.restore();
      // 女孩：背贴着树，侧脸探出去看火
      cutout(x, w, h, function (y) { peekShape(y, g); }, {
        fill: '#040303',
        rim: { c: '#121516', dx: 1.2 * k, dy: 1.6 * k, blur: 1.5 * k }
      });
      // 衬衫领子的一点白
      x.save();
      x.translate(g.hx, g.hy);
      x.scale(g.u, g.u);
      x.fillStyle = 'rgba(60,62,60,.28)';
      x.fill(new Path2D('M-25 105C-31 110 -37 117 -41 125L-34 124C-30 118 -26 113 -20 109Z'));
      x.restore();
      weeds(x, -10 * k, w * 0.5, h * 0.99, k, r, 60, 40, '#010101');
    },
    parts: {
      rim: function (x, w, h, k) {
        var S = SCENES.hiding, g = S.geo(w, h, k);
        // 树干朝火的边（女孩挡住的地方不亮）
        x.save();
        S.trunk(x, w, h, k, g);
        x.clip();
        blur(x, 4 * k);
        x.fillStyle = lin(x, g.tx - 6 * k, 0, g.tx + 26 * k, 0, [[0, 'rgba(255,120,50,.22)'], [1, 'rgba(255,120,50,0)']]);
        x.fillRect(g.tx - 20 * k, 0, 60 * k, h);
        x.restore();
        x.save();
        x.globalCompositeOperation = 'destination-out';
        x.fillStyle = x.strokeStyle = '#000';
        x.lineCap = x.lineJoin = 'round';
        peekShape(x, g);
        x.restore();
        // 火光：脸、手指、肩膀朝火的那一边
        rimOnly(x, function (y) { peekShape(y, g); }, 'rgba(255,146,76,.95)', 2.6 * k, -1 * k, 1.2 * k);
        rimOnly(x, function (y) { peekShape(y, g); }, 'rgba(255,110,46,.3)', 6 * k, -1.5 * k, 5 * k);
        // 脸上一点暖色，往头发那边淡掉
        x.save();
        x.translate(g.hx, g.hy);
        x.scale(g.u, g.u);
        x.clip(new Path2D(PEEK));
        blob(x, -50, 18, 30, 46, [[0, 'rgba(255,128,64,.3)'], [0.6, 'rgba(255,110,50,.08)'], [1, 'rgba(0,0,0,0)']]);
        blob(x, -40, 118, 22, 10, [[0, 'rgba(255,160,110,.25)'], [1, 'rgba(0,0,0,0)']]);
        x.restore();
      }
    },
    over: function (x, w, h, k, d, t, part) {
      x.save();
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = clamp(flick(t, 1.2) * 0.95, 0, 1);
      x.drawImage(part('rim'), 0, 0, w, h);
      x.restore();
    },
    feat: function (w, h, k) {
      var g = this.geo(w, h, k);
      return {
        girl: { x: g.hx - 70 * g.u, y: g.hy - 150 * g.u, w: 150 * g.u, h: h - g.hy + 150 * g.u },
        tree: { x: g.tx, y: 0, w: w - g.tx, h: h },
        fire: { x: g.fx, y: g.fy - 10 * k, r: 50 * k }
      };
    }
  });

  /* ---------- 13 仪式：离近一点的那一圈红衣人 ---------- */
  scene('ritual', {
    w: 420, h: 750, seed: 1313, motion: true, still: 2.4,
    init: function (r) {
      var figs = [], n = 15, gap = 1.7;
      for (var i = 0; i < n; i++) figs.push({ a: Math.PI / 2 + gap / 2 + i * (TAU - gap) / (n - 1) + (r() - 0.5) * 0.08, dh: r(), torch: 0 });
      figs[6].torch = -1; figs[8].torch = 1;
      return { figs: figs, fog: fogList(r, 7, 0.5, 0.88, 140, 280, 0.05) };
    },
    geo: function (w, h, k) { return { fx: w * 0.5, fy: h * 0.62, rx: 226 * k, ry: 70 * k, s: 1.5 * k }; },
    back: function (x, w, h, k, d, r) { woods(x, w, h, k, r, { ground: 0.6, thick: 6 }); },
    live: function (x, w, h, k, d, t) {
      var g = this.geo(w, h, k), L = flick(t, 0.4);
      fireLight(x, g.fx, g.fy, g.s * 1.2, L);
      var figs = d.figs.map(function (f) {
        var sn = Math.sin(f.a), dep = (sn + 1) / 2;
        return { x: g.fx + Math.cos(f.a) * g.rx, y: g.fy + sn * g.ry, h: (112 + dep * dep * 230 + f.dh * 14) * k, near: sn > 0.1, torch: f.torch };
      }).sort(function (p, q) { return p.y - q.y; });
      function person(f) {
        var lum = L * clamp(1.15 - Math.abs(f.x - g.fx) / (260 * k), 0.15, 1);
        hooded(x, f.x, f.y, f.h, lum, { back: f.near });
        if (f.torch) torch(x, f.x, f.y, f.h, f.torch, t, L);
      }
      figs.forEach(function (f) { if (!f.near) person(f); });
      logs(x, g.fx, g.fy, g.s, L);
      flames(x, g.fx, g.fy, g.s, t, L, 13, 90, 16);
      figs.forEach(function (f) { if (f.near) person(f); });
      fog(x, w, h, k, d.fog, t);
    },
    front: function (x, w, h, k, d, r) { edgeTrunk(x, w, h, k, r, -1, { wd: 64 }); },
    feat: function (w, h, k) {
      var g = this.geo(w, h, k);
      return { fire: { x: g.fx, y: g.fy - 14 * k, r: 34 * k }, circle: { x: g.fx - g.rx - 40 * k, y: g.fy - 300 * k, w: g.rx * 2 + 80 * k, h: 300 * k + g.ry + 20 * k } };
    }
  });

  /* ---------- 14 树缝里远处的灯火 ---------- */
  scene('distant-lights', {
    w: 420, h: 750, seed: 1414, motion: true, still: 1.3,
    init: function (r) {
      var lights = [], blocks = [[0.36, 0.43, 3], [0.445, 0.55, 4], [0.57, 0.64, 3]], i, j, n;
      blocks.forEach(function (B) {
        for (i = 0; i < B[2]; i++) {
          n = Math.round((B[1] - B[0]) * 60);
          for (j = 0; j < n; j++) {
            if (r() < 0.45) continue;
            lights.push({ x: B[0] + (j + 0.5) / n * (B[1] - B[0]), y: 0.553 - i * 0.0095, s: 0.55 + r() * 0.3, ph: r() * 6, f: 0.3 + r() * 1.2, warm: r() < 0.85 });
          }
        }
      });
      [0.33, 0.4, 0.47, 0.53, 0.6, 0.67].forEach(function (lx) { lights.push({ x: lx + (r() - 0.5) * 0.02, y: 0.566 + r() * 0.006, s: 0.9 + r() * 0.4, ph: r() * 6, f: 0.2 + r() * 0.5, warm: true, lamp: true }); });
      return { blocks: blocks, lights: lights, fog: fogList(r, 9, 0.5, 0.85, 120, 220, 0.07, 0.25) };
    },
    back: function (x, w, h, k, d, r) {
      var i;
      x.fillStyle = lin(x, 0, 0, 0, h, [[0, '#020406'], [0.3, '#050c0f'], [0.5, '#0f1d1e'], [0.56, '#0d1818'], [0.64, '#070c0c'], [1, '#030404']]);
      x.fillRect(0, 0, w, h);
      // 远处校园上面的一团暖雾
      blob(x, w * 0.5, h * 0.545, w * 0.4, h * 0.06, [[0, 'rgba(170,136,96,.3)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      blob(x, w * 0.5, h * 0.62, w * 0.6, h * 0.1, [[0, 'rgba(70,96,100,.12)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      ridge(x, w, h, k, r, h * 0.538, 10, '#081112');
      // 教学楼的剪影
      x.fillStyle = '#060c0d';
      d.blocks.forEach(function (B, bi) {
        var top = h * (0.553 - B[2] * 0.0095 - 0.006);
        x.fillRect(B[0] * w - 2 * k, top, (B[1] - B[0]) * w + 4 * k, h * 0.575 - top);
        if (bi === 1) { x.beginPath(); x.moveTo(B[0] * w - 4 * k, top); x.lineTo((B[0] + B[1]) / 2 * w, top - 9 * k); x.lineTo(B[1] * w + 4 * k, top); x.closePath(); x.fill(); }
      });
      ridge(x, w, h, k, r, h * 0.572, 4, '#050909');
      blob(x, w * 0.5, h * 0.47, w * 0.55, h * 0.26, [[0, 'rgba(70,96,100,.13)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      // 中间的林子（第 12 页的树干），雾里淡一点
      blur(x, 1.2 * k);
      woods(x, w, h, k, r, { bg: false, ground: 0.64, thick: 2, crowns: 0, alpha: 0.75 });
      blur(x, 0);
    },
    live: function (x, w, h, k, d, t) {
      d.lights.forEach(function (L, i) {
        var b = 0.6 + 0.4 * Math.sin(t * L.f + L.ph), cut = !L.lamp && hash(Math.floor(t * 2.5 + i * 7.3)) < 0.06 ? 0.2 : 1;
        var c = L.warm ? '255,196,130' : '210,225,235';
        glow(x, L.x * w, L.y * h, (L.lamp ? 10 : 7) * L.s * k, (L.lamp ? 10 : 6) * L.s * k, c, (0.34 * b + 0.18) * cut);
        glow(x, L.x * w, L.y * h, 1.6 * L.s * k, 1.4 * L.s * k, '255,240,215', (0.45 * b + 0.5) * cut);
      });
      fog(x, w, h, k, d.fog, t);
    },
    front: function (x, w, h, k, d, r) {
      var i;
      // 两边离得很近的粗树干，失焦
      x.save();
      blur(x, 5 * k);
      x.fillStyle = lin(x, 0, 0, w * 0.27, 0, [[0, '#000'], [0.8, '#030505'], [1, '#081010']]);
      x.beginPath();
      x.moveTo(-10 * k, -10 * k);
      x.lineTo(w * 0.17, -10 * k);
      x.bezierCurveTo(w * 0.15, h * 0.3, w * 0.23, h * 0.6, w * 0.19, h + 10 * k);
      x.lineTo(-10 * k, h + 10 * k);
      x.closePath();
      x.fill();
      x.fillStyle = lin(x, w * 0.74, 0, w, 0, [[0, '#081010'], [0.2, '#030505'], [1, '#000']]);
      x.beginPath();
      x.moveTo(w + 10 * k, -10 * k);
      x.lineTo(w * 0.83, -10 * k);
      x.bezierCurveTo(w * 0.86, h * 0.35, w * 0.77, h * 0.62, w * 0.82, h + 10 * k);
      x.lineTo(w + 10 * k, h + 10 * k);
      x.closePath();
      x.fill();
      // 从两边伸过来的细枝，离镜头很近，糊成一片；叶子挤在枝头
      blur(x, 7 * k);
      x.strokeStyle = x.fillStyle = '#010202';
      x.lineCap = 'round';
      [[-0.02, 0.16, 0.62, 0.2, -1], [1.02, 0.07, 0.42, 0.13, 1], [-0.02, 0.33, 0.4, 0.3, -1]].forEach(function (B) {
        var x0 = B[0] * w, y0 = B[1] * h, x1 = B[2] * w, y1 = B[3] * h, cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - 26 * k;
        x.lineWidth = 6 * k;
        x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(cx, cy, x1, y1); x.stroke();
        x.lineWidth = 2.5 * k;
        x.beginPath(); x.moveTo(cx, cy + 12 * k); x.quadraticCurveTo(cx + (x1 - x0) * 0.2, cy - 30 * k, cx + (x1 - x0) * 0.32, cy - 44 * k); x.stroke();
        for (i = 0; i < 22; i++) {
          var u = 0.55 + r() * 0.5, lx = x0 + (x1 - x0) * u + (r() - 0.5) * 30 * k, ly = y0 + (y1 - y0) * u + (cy - y0) * Math.sin(u * Math.PI) * 0.5 + (r() - 0.5) * 22 * k;
          ell(x, lx, ly, (7 + r() * 8) * k, (4 + r() * 4) * k, r() * 3);
        }
      });
      blur(x, 14 * k);
      for (i = 0; i < 16; i++) ell(x, r() * w, h * (0.9 + r() * 0.12), (34 + r() * 50) * k, (16 + r() * 26) * k, r() * 3);
      blur(x, 0);
      x.restore();
    },
    feat: function (w, h) { return { lights: { x: w * 0.32, y: h * 0.52, w: w * 0.36, h: h * 0.06 } }; }
  });

  /* ---------- 15 笼子里开屏的孔雀 ---------- */
  scene('peacock-cage', {
    w: 420, h: 750, seed: 1515, motion: true, still: 2,
    init: function (r) {
      var eyes = [], j, i;
      for (j = 0; j < 5; j++) {
        var n = 7 + j * 3;
        for (i = 0; i < n; i++) {
          var a = Math.PI + 0.1 + (i + (j % 2 ? 0.5 : 0.25)) / n * (Math.PI - 0.2) + (r() - 0.5) * 0.04;
          eyes.push({ a: a, rr: 0.36 + j * 0.158 + (r() - 0.5) * 0.02, s: 0.7 + j * 0.1, ph: r() * 6 });
        }
      }
      return { eyes: eyes, fog: fogList(r, 6, 0.6, 0.95, 120, 220, 0.05) };
    },
    geo: function (w, h, k) { return { cx: w * 0.5, cy: h * 0.6, R: 182 * k }; },
    back: function (x, w, h, k, d, r) {
      var g = this.geo(w, h, k), i;
      x.fillStyle = lin(x, 0, 0, 0, h, [[0, '#010304'], [0.45, '#05100f'], [0.8, '#071212'], [0.82, '#030606'], [1, '#010202']]);
      x.fillRect(0, 0, w, h);
      blob(x, w * 0.5, h * 0.3, w * 0.7, h * 0.4, [[0, 'rgba(70,140,150,.16)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      // 尾屏
      x.save();
      x.beginPath();
      x.moveTo(g.cx, g.cy);
      x.arc(g.cx, g.cy, g.R * 1.05, Math.PI + 0.02, TAU - 0.02);
      x.closePath();
      x.fillStyle = (function () {
        var gg = x.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, g.R * 1.05);
        gg.addColorStop(0, '#0a2224');
        gg.addColorStop(0.6, '#0b2322');
        gg.addColorStop(0.9, 'rgba(10,30,28,.7)');
        gg.addColorStop(1, 'rgba(10,30,28,0)');
        return gg;
      })();
      x.fill();
      x.restore();
      x.lineCap = 'round';
      for (i = 0; i < 360; i++) {
        var a = Math.PI + 0.04 + r() * (Math.PI - 0.08), r0 = g.R * (0.15 + r() * 0.2), r1 = g.R * (0.9 + r() * 0.16);
        x.strokeStyle = 'rgba(' + (50 + r() * 40 | 0) + ',' + (110 + r() * 40 | 0) + ',' + (100 + r() * 30 | 0) + ',' + (0.06 + r() * 0.1).toFixed(2) + ')';
        x.lineWidth = (0.5 + r() * 0.7) * k;
        x.beginPath();
        x.moveTo(g.cx + Math.cos(a) * r0, g.cy + Math.sin(a) * r0);
        x.lineTo(g.cx + Math.cos(a) * r1, g.cy + Math.sin(a) * r1);
        x.stroke();
      }
      d.eyes.forEach(function (e) {
        eyeSpot(x, g.cx + Math.cos(e.a) * e.rr * g.R, g.cy + Math.sin(e.a) * e.rr * g.R, 13 * e.s * k, e.a, 0.9, { soft: true, cold: true });
      });
      // 身体（正面）
      var bs = 1.9 * k;
      x.save();
      x.translate(g.cx, g.cy + 44 * k);
      x.scale(bs, bs);
      x.fillStyle = lin(x, 0, -76, 0, 0, [[0, '#1a4c5c'], [0.45, '#0f3442'], [1, '#05141a']]);
      x.fill(new Path2D('M0 -70C6 -70 8 -64 7 -58C6 -50 10 -40 14 -26C16 -14 10 -2 0 0C-10 -2 -16 -14 -14 -26C-10 -40 -6 -50 -7 -58C-8 -64 -6 -70 0 -70Z'));
      ell(x, 0, -73, 5, 5.6);
      x.fillStyle = '#081a20';
      x.beginPath(); x.moveTo(-1.6, -69); x.lineTo(0, -64); x.lineTo(1.6, -69); x.closePath(); x.fill();
      x.strokeStyle = x.fillStyle = '#1a4c5c';
      x.lineWidth = 0.6;
      for (i = 0; i < 5; i++) {
        var ca = -Math.PI / 2 + (i - 2) * 0.2;
        x.beginPath(); x.moveTo(0, -77); x.lineTo(Math.cos(ca) * 9, -77 + Math.sin(ca) * 9); x.stroke();
        ell(x, Math.cos(ca) * 9, -77 + Math.sin(ca) * 9, 1.1, 1.1);
      }
      x.fillStyle = '#04100f';
      x.fillRect(-5, 0, 1.6, 28);
      x.fillRect(3.4, 0, 1.6, 28);
      blob(x, 0, -56, 5, 15, [[0, 'rgba(90,180,210,.42)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      blob(x, 0, -73, 4, 4, [[0, 'rgba(90,180,210,.25)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      x.restore();
      // 地上的干草
      x.strokeStyle = 'rgba(60,70,60,.25)';
      x.lineWidth = 0.8 * k;
      for (i = 0; i < 80; i++) {
        var sx = r() * w, sy = h * (0.83 + r() * 0.12), sl = (6 + r() * 12) * k, sa = (r() - 0.5) * 0.8;
        x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(sa) * sl, sy + Math.sin(sa) * sl); x.stroke();
      }
    },
    live: function (x, w, h, k, d, t) {
      var g = this.geo(w, h, k);
      d.eyes.forEach(function (e) {
        var b = Math.max(0, Math.sin(t * 0.7 + e.ph * 2.3));
        glow(x, g.cx + Math.cos(e.a) * e.rr * g.R, g.cy + Math.sin(e.a) * e.rr * g.R, 16 * e.s * k, 16 * e.s * k, '70,190,200', 0.12 + 0.2 * b * b);
      });
      fog(x, w, h, k, d.fog, t, '110,150,150');
    },
    front: function (x, w, h, k, d, r) {
      var i, n = 15, top = h * 0.12, bot = h * 0.86, X0 = w * 0.04, X1 = w * 0.96, half = (X1 - X0) / 2, cx = w / 2;
      function topAt(px) { var u = (px - cx) / half; return top + (1 - Math.sqrt(Math.max(0, 1 - u * u))) * h * 0.14; }
      for (i = 0; i <= n; i++) {
        var px = X0 + (X1 - X0) * i / n, ty = topAt(px);
        x.fillStyle = '#020505';
        x.fillRect(px - 2.2 * k, ty, 4.4 * k, bot - ty);
        x.fillStyle = 'rgba(110,170,170,.16)';
        x.fillRect(px - 2.2 * k, ty, 1.1 * k, bot - ty);
      }
      x.strokeStyle = '#020505';
      x.lineWidth = 4 * k;
      x.beginPath();
      for (i = 0; i <= 40; i++) { var qx = X0 + (X1 - X0) * i / 40; if (i) x.lineTo(qx, topAt(qx)); else x.moveTo(qx, topAt(qx)); }
      x.stroke();
      [0.36, 0.62].forEach(function (f) { x.fillRect(X0, h * f, X1 - X0, 3 * k); });
      x.fillStyle = '#020505';
      x.fillRect(X0 - 6 * k, bot - 4 * k, X1 - X0 + 12 * k, 10 * k);
      x.fillStyle = 'rgba(110,170,170,.12)';
      x.fillRect(X0 - 6 * k, bot - 4 * k, X1 - X0 + 12 * k, 1.5 * k);
    },
    feat: function (w, h, k) {
      var g = this.geo(w, h, k);
      return { peacock: { x: g.cx, y: g.cy - 10 * k, r: 40 * k }, fan: { x: g.cx - g.R, y: g.cy - g.R, w: g.R * 2, h: g.R } };
    }
  });

  /* ---------- 17 左手紧握着手机 ---------- */
  // 手机坐标：手机中心为原点，宽 170、高 350。左手：手掌在手机后面，拇指从左边压在屏幕上，四个指尖从右边绕过来
  function phonePalm(y) {
    limb(y, [[-70, 200], [-250, 430], [-420, 600]], 170);
    y.beginPath();
    y.moveTo(-76, 80);
    y.bezierCurveTo(-40, -10, 40, -118, 96, -124);
    y.lineTo(104, 60);
    y.bezierCurveTo(60, 180, -10, 250, -130, 270);
    y.closePath();
    y.fill();
    limb(y, [[-80, 230], [-112, 170], [-104, 118]], 70); // 拇指根
  }
  function phoneTips(y) {
    [[-112, 30], [-80, 31], [-48, 29.5], [-17, 26]].forEach(function (f, i) {
      var fy = f[0];
      limb(y, [[120, fy + 14], [102, fy + 3], [84 - (i === 3 ? 2 : 0), fy - 1]], f[1]);
    });
  }
  function phoneThumb(y) {
    limb(y, [[-110, 160], [-98, 104], [-74, 66], [-48, 42]], 35);
    y.beginPath();
    y.ellipse(-44, 38, 18, 15, -0.75, 0, TAU);
    y.fill();
  }
  scene('hand-phone', {
    w: 800, h: 600, seed: 1717, motion: true, still: 0.5, jitter: 0.6,
    geo: function (w, h, k) { return { cx: w * 0.55, cy: h * 0.44, s: 1.06 * k, a: -0.1 }; },
    back: function (x, w, h, k, d, r) {
      var g = this.geo(w, h, k);
      x.fillStyle = lin(x, 0, 0, 0, h, [[0, '#020304'], [1, '#040607']]);
      x.fillRect(0, 0, w, h);
      blur(x, 4 * k);
      woods(x, w, h, k, r, { bg: false, ground: 0.95, thin: 14, crowns: 6, thick: 2, stones: 0, alpha: 0.5 });
      blur(x, 0);
      blob(x, g.cx, g.cy, 320 * k, 300 * k, [[0, 'rgba(70,110,130,.24)'], [1, 'rgba(0,0,0,0)']], 'lighter');
    },
    front: function (x, w, h, k, d, r) {
      var g = this.geo(w, h, k), s = g.s;
      function at(fn) { return function (y) { y.save(); y.translate(g.cx, g.cy); y.rotate(g.a); y.scale(s, s); fn(y); y.restore(); }; }
      function cool(y) { // 屏幕的冷光，离屏幕越近越亮
        y.save();
        y.translate(g.cx, g.cy);
        y.rotate(g.a);
        y.scale(s, s);
        blob(y, 0, 0, 200, 300, [[0, 'rgba(150,190,210,.5)'], [0.5, 'rgba(90,130,150,.18)'], [1, 'rgba(0,0,0,0)']]);
        y.restore();
      }
      // 手掌在手机后面
      cutout(x, w, h, at(phonePalm), { fill: '#0e0908', rim: { c: '#3d464a', dx: -2 * k, dy: 3 * k, blur: 3 * k }, shade: cool });
      x.save();
      x.translate(g.cx, g.cy);
      x.rotate(g.a);
      x.scale(s, s);
      // 手机
      x.fillStyle = '#08090b';
      x.beginPath(); if (x.roundRect) x.roundRect(-85, -175, 170, 350, 24); else x.rect(-85, -175, 170, 350); x.fill();
      x.fillStyle = 'rgba(140,170,190,.25)';
      x.fillRect(-85, -150, 1.5, 300);
      var sg = x.createLinearGradient(0, -167, 0, 167);
      sg.addColorStop(0, '#536f7e');
      sg.addColorStop(0.55, '#3d5664');
      sg.addColorStop(1, '#263843');
      x.fillStyle = sg;
      x.beginPath(); if (x.roundRect) x.roundRect(-78, -167, 156, 334, 18); else x.rect(-78, -167, 156, 334); x.fill();
      // 屏幕上糊掉的拨号界面（没有字）
      blur(x, 4 * s);
      x.fillStyle = 'rgba(210,228,236,.32)';
      x.fillRect(-40, -128, 80, 9);
      x.fillRect(-26, -110, 52, 5);
      for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 3; j++) ell(x, (j - 1) * 44, -48 + i * 40, 14, 14);
      }
      x.fillStyle = 'rgba(190,60,50,.4)';
      ell(x, 0, 132, 18, 18);
      blur(x, 0);
      blob(x, 0, -40, 90, 140, [[0, 'rgba(200,225,235,.16)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      x.restore();
      // 拇指在屏幕前面是暗的，四周被屏幕的光吃掉一点；指尖从右边绕过来，朝屏幕的一边是冷的
      x.save();
      blur(x, 9 * k);
      x.globalAlpha = 0.5;
      x.fillStyle = x.strokeStyle = '#000';
      x.lineCap = x.lineJoin = 'round';
      x.translate(5 * k, 7 * k);
      at(phoneThumb)(x);
      x.restore();
      cutout(x, w, h, at(phoneThumb), { fill: '#120c0a', rim: { c: '#6f838a', dx: 2.5 * k, dy: 2.5 * k, blur: 3.5 * k }, shade: function (y) {
        y.save(); y.translate(g.cx, g.cy); y.rotate(g.a); y.scale(s, s);
        blob(y, -40, 34, 30, 26, [[0, 'rgba(120,96,86,.5)'], [1, 'rgba(0,0,0,0)']]);
        y.restore();
      } });
      cutout(x, w, h, at(phoneTips), { fill: '#110b09', rim: { c: '#5d7078', dx: 4 * k, dy: 1 * k, blur: 4 * k }, shade: cool });
    },
    over: function (x, w, h, k, d, t) {
      var g = this.geo(w, h, k), b = 0.85 + 0.15 * Math.sin(t * 1.3);
      glow(x, g.cx, g.cy, 240 * k, 300 * k, '110,160,190', 0.1 * b);
    },
    feat: function (w, h, k) {
      var g = this.geo(w, h, k);
      return { phone: { x: g.cx - 100 * k, y: g.cy - 195 * k, w: 200 * k, h: 390 * k }, screen: { x: g.cx - 84 * k, y: g.cy - 180 * k, w: 168 * k, h: 360 * k } };
    }
  });

  /* ---------- 18 红兜帽下的笑 ---------- */
  // 设计坐标 420×750。圆圆的兜帽垂到肩上，脸的上半在阴影里，只有下巴和嘴被火从左下照亮
  var HOOD = {
    robe: 'M-220 1300L-220 900C-130 720 10 630 110 596L314 596C414 630 554 720 644 900L644 1300Z',
    hood: 'M212 166C150 166 102 206 86 274C72 336 72 410 78 466C84 520 70 566 34 606C100 648 324 648 390 606C354 566 340 520 346 466C352 410 352 336 338 274C322 206 274 166 212 166Z',
    hole: 'M212 258C166 260 138 298 134 358C130 420 144 484 174 534L212 566L250 534C280 484 294 420 290 358C286 298 258 260 212 258Z',
    face: 'M212 296C246 296 264 328 265 372C266 416 250 452 228 468C222 472 216 474 212 474C208 474 202 472 196 468C174 452 158 416 159 372C160 328 178 296 212 296Z',
    neck: 'M190 450L234 450L240 560L184 560Z',
    hairL: 'M176 280C150 318 140 390 148 462C152 500 162 532 176 562L198 562C186 528 176 494 172 456C166 404 168 344 196 296Z',
    hairR: 'M248 280C274 318 284 390 276 462C272 500 262 532 248 562L226 562C238 528 248 494 252 456C258 404 256 344 228 296Z',
    folds: 'M128 240C104 320 104 430 112 530M296 240C320 320 320 430 312 530M156 524C136 566 110 598 76 618M268 524C288 566 314 598 348 618M212 176C206 206 208 236 212 258M190 580C186 604 180 624 172 640M234 580C238 604 244 624 252 640'
  };
  scene('red-hood', {
    w: 420, h: 750, seed: 1818, motion: true, still: 1.1,
    init: function (r) { return { fog: fogList(r, 5, 0.6, 0.95, 120, 220, 0.04) }; },
    geo: function (w, h, k) { return { ox: w / 2 - 212 * k, oy: h * 0.5 - 380 * k, s: k }; },
    back: function (x, w, h, k, d, r) {
      var g = this.geo(w, h, k);
      function S(dd) { return P(dd, g.ox, g.oy, g.s); }
      function X(v) { return g.ox + v * k; }
      function Y(v) { return g.oy + v * k; }
      blur(x, 4 * k);
      woods(x, w, h, k, r, { ground: 0.8, hx: 0.2, thick: 5 });
      blur(x, 0);
      blob(x, 0, h, w * 0.9, h * 0.55, [[0, 'rgba(255,120,50,.22)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      x.fillStyle = lin(x, X(0), Y(620), X(420), Y(720), [[0, '#4a0f0a'], [0.45, '#260605'], [1, '#0e0202']]);
      x.fill(S(HOOD.robe));
      x.fillStyle = lin(x, X(70), Y(600), X(340), Y(220), [[0, '#64140d'], [0.4, '#3a0809'], [1, '#160304']]);
      x.fill(S(HOOD.hood));
      // 褶子和帽檐下的阴影
      x.save();
      x.clip(S(HOOD.hood));
      blur(x, 8 * k);
      x.strokeStyle = 'rgba(12,1,1,.55)';
      x.lineWidth = 14 * k;
      x.stroke(S(HOOD.folds));
      blur(x, 14 * k);
      x.fillStyle = 'rgba(8,0,0,.7)';
      x.fill(P(HOOD.hole, X(212) - 212 * k * 1.12, Y(400) - 400 * k * 1.12, k * 1.12));
      x.restore();
      x.save();
      x.clip(S(HOOD.robe));
      blur(x, 10 * k);
      x.fillStyle = 'rgba(6,0,0,.65)';
      ell(x, X(212), Y(630), 170 * k, 34 * k);
      x.restore();
      blur(x, 0);
      // 兜帽里：脖子、脸、两边垂下来的长头发
      x.fillStyle = '#040101';
      x.fill(S(HOOD.hole));
      x.save();
      x.clip(S(HOOD.hole));
      x.fillStyle = '#0c0605';
      x.fill(S(HOOD.neck));
      x.fillStyle = lin(x, 0, Y(300), 0, Y(474), [[0, 'rgb(3,2,2)'], [0.4, 'rgb(12,7,6)'], [0.7, 'rgb(46,28,23)'], [1, 'rgb(70,44,36)']]);
      x.fill(S(HOOD.face));
      x.fillStyle = '#010000';
      x.fill(S(HOOD.hairL));
      x.fill(S(HOOD.hairR));
      blur(x, 12 * k);
      x.fillStyle = 'rgba(2,0,0,.85)';
      ell(x, X(212), Y(282), 110 * k, 48 * k);
      x.restore();
      blur(x, 0);
    },
    parts: {
      lit: function (x, w, h, k) {
        var g = SCENES['red-hood'].geo(w, h, k);
        function S(dd) { return P(dd, g.ox, g.oy, g.s); }
        function X(v) { return g.ox + v * k; }
        function Y(v) { return g.oy + v * k; }
        // 火光从左下照上来：兜帽和袍子的左边、帽口里面的左边
        x.save();
        x.clip(S(HOOD.hood));
        blob(x, X(70), Y(600), 190 * k, 330 * k, [[0, 'rgba(255,96,40,.55)'], [0.5, 'rgba(200,50,20,.2)'], [1, 'rgba(0,0,0,0)']]);
        blob(x, X(150), Y(470), 40 * k, 120 * k, [[0, 'rgba(255,110,50,.22)'], [1, 'rgba(0,0,0,0)']]);
        x.restore();
        x.save();
        x.clip(S(HOOD.robe));
        blob(x, X(30), Y(700), 200 * k, 140 * k, [[0, 'rgba(255,90,36,.4)'], [1, 'rgba(0,0,0,0)']]);
        x.restore();
        x.save();
        blur(x, 2 * k);
        x.strokeStyle = 'rgba(255,124,60,.5)';
        x.lineWidth = 3 * k;
        x.stroke(S('M86 274C72 336 72 410 78 466C84 520 70 566 34 606'));
        x.restore();
        // 脸：只有下巴、嘴、鼻尖、左边脸颊的下半
        x.save();
        x.clip(S(HOOD.face));
        blob(x, X(208), Y(462), 58 * k, 34 * k, [[0, 'rgba(236,196,170,.6)'], [0.6, 'rgba(200,140,110,.2)'], [1, 'rgba(0,0,0,0)']]);
        blob(x, X(178), Y(428), 26 * k, 34 * k, [[0, 'rgba(214,150,118,.3)'], [1, 'rgba(0,0,0,0)']]);
        blob(x, X(246), Y(436), 18 * k, 28 * k, [[0, 'rgba(200,130,100,.12)'], [1, 'rgba(0,0,0,0)']]);
        blob(x, X(210), Y(402), 16 * k, 9 * k, [[0, 'rgba(230,180,150,.16)'], [1, 'rgba(0,0,0,0)']]);
        x.restore();
        // 合着嘴的笑：嘴角往上，下唇亮一点
        x.save();
        x.lineCap = 'round';
        blur(x, 0.6 * k);
        x.strokeStyle = 'rgba(30,8,8,.9)';
        x.lineWidth = 2 * k;
        x.beginPath();
        x.moveTo(X(190), Y(428));
        x.bezierCurveTo(X(200), Y(438), X(222), Y(438), X(232), Y(428));
        x.stroke();
        x.lineWidth = 1.5 * k;
        x.beginPath(); x.moveTo(X(190), Y(428)); x.quadraticCurveTo(X(188), Y(426), X(186), Y(423)); x.moveTo(X(232), Y(428)); x.quadraticCurveTo(X(234), Y(426), X(236), Y(423)); x.stroke();
        blur(x, 2.4 * k);
        x.strokeStyle = 'rgba(250,214,192,.26)';
        x.lineWidth = 3 * k;
        x.beginPath(); x.moveTo(X(201), Y(445)); x.quadraticCurveTo(X(211), Y(448), X(221), Y(445)); x.stroke();
        x.restore();
      }
    },
    live: function (x, w, h, k, d, t, part) {
      var L = flick(t, 2);
      x.save();
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = clamp(0.5 + 0.55 * L, 0, 1);
      x.drawImage(part('lit'), 0, 0, w, h);
      x.restore();
      flames(x, -20 * k, h + 20 * k, 1.6 * k, t, 0.25, 21, 0, 12);
      fog(x, w, h, k, d.fog, t);
    },
    feat: function (w, h, k) {
      var g = this.geo(w, h, k);
      return { face: { x: g.ox + 212 * k, y: g.oy + 390 * k, r: 66 * k }, smile: { x: g.ox + 211 * k, y: g.oy + 432 * k, r: 28 * k } };
    }
  });

  /* ---------- 19 火光里的两姐妹 ---------- */
  scene('two-sisters', {
    w: 960, h: 540, seed: 1919, motion: true, still: 0.9,
    init: function (r) { return { fog: fogList(r, 7, 0.5, 0.95, 140, 280, 0.05) }; },
    geo: function (w, h, k) { return { fx: w * 0.9, fy: h * 0.95, mx: w * 0.55, my: h * 0.96, ms: 3.3 * k, sx: w * 0.48, sy: h * 0.935, sh: 344 * k }; },
    back: function (x, w, h, k, d, r) { woods(x, w, h, k, r, { ground: 0.78, hx: 0.85, thick: 7 }); },
    live: function (x, w, h, k, d, t, part) {
      var g = this.geo(w, h, k), L = flick(t, 3);
      fireLight(x, g.fx, g.fy, 1.4 * k, L);
      logs(x, g.fx, g.fy, 1.3 * k, L);
      flames(x, g.fx, g.fy, 1.3 * k, t, L, 31, 70, 12);
      hooded(x, g.sx, g.sy, g.sh, 0.45 * L, { side: 1 });
      x.drawImage(part('me'), 0, 0, w, h);
      x.save();
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = clamp(L, 0, 1);
      x.drawImage(part('meRim'), 0, 0, w, h);
      x.restore();
      fog(x, w, h, k, d.fog, t);
    },
    parts: {
      me: function (x, w, h, k) {
        var g = SCENES['two-sisters'].geo(w, h, k);
        cutout(x, w, h, at(g.mx, g.my, g.ms, g.ms, girlSide), { fill: '#070405' });
      },
      meRim: function (x, w, h, k) {
        var g = SCENES['two-sisters'].geo(w, h, k), f = at(g.mx, g.my, g.ms, g.ms, girlSide);
        rimOnly(x, f, 'rgba(255,136,64,.95)', -2 * k, 0.6 * k, 0.8 * k);
        rimOnly(x, f, 'rgba(255,110,45,.22)', -3.5 * k, 0, 2.5 * k);
      }
    },
    front: function (x, w, h, k, d, r) { edgeTrunk(x, w, h, k, r, -1, { wd: 80 }); },
    feat: function (w, h, k) {
      var g = this.geo(w, h, k);
      return {
        sister: { x: g.sx - g.sh * 0.2, y: g.sy - g.sh * 1.05, w: g.sh * 0.4, h: g.sh * 1.05 },
        me: { x: g.mx - 9 * g.ms, y: g.my - 101 * g.ms, w: 20 * g.ms, h: 101 * g.ms },
        fire: { x: g.fx, y: g.fy - 20 * k, r: 40 * k }
      };
    }
  });

  /* ---------- 朋友圈：几乎全黑的夜景，一盏很远的路灯 ---------- */
  scene('night-black', {
    w: 600, h: 600, seed: 2020, grain: 0.36, vig: 0.6,
    back: function (x, w, h, k, d, r) {
      var lx = w * 0.66, ly = h * 0.6;
      blur(x, 0.8 * k); // 手机夜拍的糊
      x.fillStyle = lin(x, 0, 0, 0, h, [[0, '#010102'], [0.62, '#04070a'], [0.66, '#020304'], [1, '#010101']]);
      x.fillRect(0, 0, w, h);
      ridge(x, w, h, k, r, h * 0.64, 6, '#010202');
      for (var i = 0; i < 8; i++) bush(x, r() * w, h * (0.66 + r() * 0.02), (20 + r() * 30) * k, r, '#010101');
      x.fillStyle = 'rgba(30,30,28,.6)';
      x.fillRect(lx - 0.6 * k, ly, 1.2 * k, h * 0.06);
      glow(x, lx, ly, 70 * k, 70 * k, '255,190,120', 0.14);
      glow(x, lx, ly, 18 * k, 18 * k, '255,200,140', 0.4);
      glow(x, lx, ly, 3 * k, 3 * k, '255,240,210', 0.9);
      glow(x, lx, h * 0.665, 40 * k, 6 * k, '255,180,110', 0.08);
      blur(x, 0);
    },
    feat: function (w, h, k) { return { lamp: { x: w * 0.66, y: h * 0.6, r: 20 * k } }; }
  });

  /* ---------- 朋友圈：书桌上的一根孔雀羽毛 ---------- */
  scene('feather-desk', {
    w: 600, h: 600, seed: 2121,
    geo: function (w, h, k) { return { ex: w * 0.58, ey: h * 0.42, bx: w * 0.58 - 330 * k, by: h * 0.42 + 300 * k, wd: 92 * k, R: 40 * k }; },
    back: function (x, w, h, k, d, r) {
      var g = this.geo(w, h, k), i;
      x.fillStyle = lin(x, 0, 0, w, h, [[0, '#1a120c'], [1, '#080504']]);
      x.fillRect(0, 0, w, h);
      x.lineCap = 'round';
      for (i = 0; i < 60; i++) {
        var y0 = r() * h * 1.3 - h * 0.15;
        x.strokeStyle = r() < 0.5 ? 'rgba(0,0,0,.18)' : 'rgba(90,60,40,.08)';
        x.lineWidth = (0.6 + r() * 2) * k;
        x.beginPath();
        x.moveTo(0, y0);
        x.bezierCurveTo(w * 0.3, y0 + (r() - 0.5) * 30 * k, w * 0.7, y0 + (r() - 0.5) * 30 * k, w, y0 + (r() - 0.5) * 20 * k + w * 0.12);
        x.stroke();
      }
      blob(x, w * 0.4, h * 0.3, w * 0.7, h * 0.6, [[0, 'rgba(255,180,110,.2)'], [1, 'rgba(0,0,0,0)']], 'lighter');
      // 影子
      x.save();
      blur(x, 8 * k);
      x.strokeStyle = 'rgba(0,0,0,.5)';
      x.lineWidth = 50 * k;
      x.beginPath();
      x.moveTo(g.bx + 50 * k, g.by - 30 * k);
      x.lineTo(g.ex + 10 * k, g.ey + 14 * k);
      x.stroke();
      x.fillStyle = 'rgba(0,0,0,.45)';
      ell(x, g.ex + 8 * k, g.ey + 12 * k, g.R * 1.5, g.R * 1.3);
      blur(x, 0);
      x.restore();
      feather(x, g.bx, g.by, g.ex, g.ey, g.wd, r, { bend: 0.05, eye: g.R, k: k, lum: 1.15, n: 200 });
      glow(x, g.ex, g.ey, g.R * 1.8, g.R * 1.8, '60,160,170', 0.1);
    },
    feat: function (w, h, k) { var g = this.geo(w, h, k); return { eye: { x: g.ex, y: g.ey, r: g.R * 1.3 } }; }
  });

  /* ======================================================================
   * 画
   * ====================================================================== */
  var cache = {}, order = [];
  function layer(key, w, h, px, fn) {
    var c = cache[key];
    if (c) return c;
    c = canvas(w * px, h * px);
    var x = c.getContext('2d');
    x.scale(px, px);
    fn(x);
    cache[key] = c;
    order.push(key);
    while (order.length > 8) delete cache[order.shift()];
    return c;
  }
  function pixelScale(x) {
    try {
      var m = x.getTransform();
      return clamp(Math.round(Math.sqrt(m.a * m.a + m.b * m.b) * 100) / 100, 0.25, 3);
    } catch (e) { return 1; }
  }

  /** fit 'cover'：按场景自己的比例铺满 w×h，(fx, fy) 决定露出哪一部分（同 CSS object-position，0–1）。 */
  function coverBox(S, w, h, o) {
    var sc = Math.max(w / S.w, h / S.h), dw = S.w * sc, dh = S.h * sc;
    return { ox: (w - dw) * (o.fx == null ? 0.5 : o.fx), oy: (h - dh) * (o.fy == null ? 0.5 : o.fy), w: dw, h: dh };
  }

  function paint(name, x, w, h, t, o) {
    var S = SCENES[name];
    if (!S || !(w > 0) || !(h > 0)) return false;
    o = o || {};
    t = t || 0;
    if (o.fit === 'cover') {
      var B = coverBox(S, w, h, o);
      x.save();
      x.beginPath();
      x.rect(0, 0, w, h);
      x.clip();
      x.translate(B.ox, B.oy);
      paint(name, x, B.w, B.h, t, { nocache: o.nocache, grain: false, vignette: false });
      x.restore();
      if (o.vignette !== false) vignette(x, w, h, S.vig == null ? 0.55 : S.vig, S.vigC);
      if (o.grain !== false) grain(x, w, h, S.grain == null ? 0.2 : S.grain, S.motion ? t : 0);
      return true;
    }
    var d = data(S), k = Math.min(w / S.w, h / S.h), px = pixelScale(x);
    var useCache = S.motion && !o.nocache;
    var base = name + '|' + Math.round(w) + 'x' + Math.round(h) + '@' + px + '|';
    PX = px;
    function draw(part, fn) {
      if (!fn) return;
      if (useCache) {
        x.drawImage(layer(base + part, w, h, px, function (y) { fn.call(S, y, w, h, k, d, seeded(S.seed + part.length)); }), 0, 0, w, h);
      } else {
        x.save();
        fn.call(S, x, w, h, k, d, seeded(S.seed + part.length));
        x.restore();
      }
    }
    function part(p) {
      var fn = function (y) { S.parts[p].call(S, y, w, h, k, d, seeded(S.seed + 9)); };
      if (useCache) return layer(base + 'p:' + p, w, h, px, fn);
      var c = canvas(w * px, h * px), y = c.getContext('2d');
      y.scale(px, px);
      fn(y);
      return c;
    }
    x.save();
    x.beginPath();
    x.rect(0, 0, w, h);
    x.clip();
    draw('back', S.back);
    if (S.live) { x.save(); S.live.call(S, x, w, h, k, d, t, part); x.restore(); }
    if (S.front) {
      if (S.jitter && t) { // 手在发抖
        var j = S.jitter * k;
        x.save();
        x.translate(Math.sin(t * 23) * j + Math.sin(t * 37) * j * 0.5, Math.cos(t * 19) * j);
        draw('front', S.front);
        x.restore();
      } else draw('front', S.front);
    }
    if (S.over) { x.save(); S.over.call(S, x, w, h, k, d, t, part); x.restore(); }
    if (o.vignette !== false) vignette(x, w, h, S.vig == null ? 0.55 : S.vig, S.vigC);
    if (o.grain !== false) grain(x, w, h, S.grain == null ? 0.2 : S.grain, S.motion ? t : 0);
    x.restore();
    PX = 1;
    return true;
  }

  function mount(el, name, o) {
    o = o || {};
    var S = SCENES[name];
    var cv = document.createElement('canvas');
    cv.className = 'art-canvas';
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block;pointer-events:none;';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(cv);
    var x = cv.getContext('2d');
    var w = 0, h = 0, dpr = 1, raf = 0, alive = true, last = -1e9, t0 = performance.now();
    var moving = !!(S && S.motion && !o.still && !G.reducedMotion());
    function size() {
      var nw = el.clientWidth, nh = el.clientHeight, nd = Math.min(window.devicePixelRatio || 1, o.dpr || 2);
      if (!nw || !nh) return false;
      if (nw === w && nh === h && nd === dpr) return false;
      w = nw; h = nh; dpr = nd;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      return true;
    }
    function draw(now) {
      if (!w || !h) return;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(name, x, w, h, moving ? (o.t || 0) + (now - t0) / 1000 : (o.t != null ? o.t : (S && S.still) || 0), o);
    }
    function onResize() { if (size() && !moving) draw(performance.now()); }
    var ro = window.ResizeObserver ? new ResizeObserver(onResize) : null;
    if (ro) ro.observe(el); else window.addEventListener('resize', onResize);
    function frame(now) {
      if (!alive) return;
      if (!cv.isConnected) { stop(); return; }
      raf = requestAnimationFrame(frame);
      if (now - last < 1000 / (o.fps || 30) - 4) return;
      last = now;
      size();
      draw(now);
    }
    function stop() {
      alive = false;
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', onResize);
    }
    size();
    draw(t0);
    if (moving) raf = requestAnimationFrame(frame);
    return { canvas: cv, stop: stop };
  }

  var urls = {};
  function url(name, w, h, o) {
    var S = SCENES[name];
    if (!S) return '';
    o = o || {};
    w = Math.round(w || S.w);
    h = Math.round(h || S.h);
    var key = name + '|' + w + 'x' + h + '|' + (o.fit || '') + (o.fx == null ? '' : ',' + o.fx) + (o.fy == null ? '' : ',' + o.fy);
    if (urls[key]) return urls[key];
    var c = canvas(w, h);
    paint(name, c.getContext('2d'), w, h, S.still || 0, { nocache: true, fit: o.fit, fx: o.fx, fy: o.fy });
    var u = '';
    try { u = c.toDataURL('image/jpeg', 0.88); } catch (e) { /* ignore */ }
    return (urls[key] = u);
  }

  function features(name, w, h, o) {
    var S = SCENES[name], out = {}, B = null;
    if (!S || !S.feat) return out;
    w = w || S.w;
    h = h || S.h;
    if (o && o.fit === 'cover') B = coverBox(S, w, h, o);
    var f = B ? S.feat(B.w, B.h, Math.min(B.w / S.w, B.h / S.h), data(S)) : S.feat(w, h, Math.min(w / S.w, h / S.h), data(S));
    if (B) {
      Object.keys(f).forEach(function (key) { f[key].x += B.ox; f[key].y += B.oy; });
    }
    function n(v) { return Math.round(v * 10000) / 10000; }
    Object.keys(f).forEach(function (key) {
      var v = f[key];
      if ('r' in v) { out[key] = { x: n(v.x / w), y: n(v.y / h), r: n(v.r / w) }; return; }
      var x0 = clamp(v.x / w, 0, 1), y0 = clamp(v.y / h, 0, 1), x1 = clamp((v.x + v.w) / w, 0, 1), y1 = clamp((v.y + v.h) / h, 0, 1);
      out[key] = { x: n(x0), y: n(y0), w: n(x1 - x0), h: n(y1 - y0) };
    });
    return out;
  }

  G.art = {
    paint: paint,
    mount: mount,
    url: url,
    features: features,
    size: function (name) { var S = SCENES[name]; return S ? { w: S.w, h: S.h } : null; },
    names: function () { return Object.keys(SCENES); }
  };
})();
