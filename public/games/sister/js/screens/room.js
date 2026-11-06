/* 08 姐姐的房间 · 纸条的另一半
 * 黑暗的卧室，手电照亮；在枕头下找到另一半，把两半拼起来。
 * 文字取自 ../storyboard/data.js s08。共用工具（kit、手电、颗粒）在 night.js 的 G.night 里。
 */
(function () {
  'use strict';

  var T = {
    place: '姐姐的房间',
    step1: '在姐姐房间里找到另一半',
    step2: '把两半拼起来',
    found: '我在姐姐的房间里找到了那张纸的另一半。',
    joined: '两半拼在一起，孔雀完整了，旁边多出一句话和学校小动物园的旧地址。',
    line: '第一份供奉，献给门后的存在。',
    // 分镜里是占位「（学校小动物园的旧地址）」；故事设定：学校依山而建，动物园在山脚。
    addr: '旧址：后山山脚 · 学校小动物园',
    nums: '7140 6002',
    nothing: '什么都没有'
  };

  var SW = 320, SH = 400;  // 整张纸（纸面坐标）
  var LV = 150;            // 左半张取景宽度（撕口最右不超过 150）
  var RV0 = 128;           // 右半张取景起点（撕口最左不小于 128）
  var INK = '#2a231b';
  var uid = 0;

  /* ---------- 撕口 ---------- */
  var TEAR = (function () {
    var seed = 11, pts = [];
    function r() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var y = 0; y < SH; y += 14) pts.push([140 + (r() - 0.5) * 13 + Math.sin(y / 37) * 3, y]);
    pts.push([140 + (r() - 0.5) * 10, SH]);
    return pts;
  })();
  function pts(list) { return list.map(function (p) { return p[0].toFixed(1) + ',' + p[1]; }).join(' '); }
  var LEFT_POLY = pts([[0, 0]].concat(TEAR, [[0, SH]]));
  var RIGHT_POLY = pts(TEAR.concat([[SW, SH], [SW, 0]]));
  var TEAR_LINE = pts(TEAR);

  /* ---------- 纸上的画：钢笔孔雀、倒着写的数字、那句话和旧址 ---------- */
  function f1(n) { return n.toFixed(1); }
  function feather(cx, cy, a, L, s) {
    var ca = Math.cos(a), sa = Math.sin(a);
    var ex = cx + ca * (L - 10 * s), ey = cy - sa * (L - 10 * s);
    var rot = 90 - a * 180 / Math.PI;
    return '<path d="M' + f1(cx + ca * 30) + ' ' + f1(cy - sa * 30) + 'L' + f1(ex) + ' ' + f1(ey) + '" stroke-width="' + (0.5 + 0.5 * s).toFixed(2) + '"/>' +
      '<g transform="translate(' + f1(ex) + ' ' + f1(ey) + ') rotate(' + f1(rot) + ') scale(' + s + ')">' +
      '<path d="M0 24C-8 12-10-2-8-8C-6-14-2-16 0-16C2-16 6-14 8-8C10-2 8 12 0 24" stroke-width=".9"/>' +
      '<ellipse cx="0" cy="-3" rx="5.6" ry="7.6" stroke-width="1"/>' +
      '<ellipse cx="0" cy="-2" rx="3.2" ry="4.6" stroke-width=".9"/>' +
      '<ellipse cx="0" cy="-1.6" rx="1.7" ry="2.6" fill="' + INK + '" stroke="none"/>' +
      '<path d="M-6 8L-2 4M6 8L2 4M-7 14L-2 10M7 14L2 10" stroke-width=".6"/></g>';
  }
  function peacock(paper) {
    var cx = 112, cy = 236, s = '', i;
    for (i = 0; i < 12; i++) s += feather(cx, cy, (159.7 - i * 152 / 12) * Math.PI / 180, 78, 0.72);
    for (i = 0; i <= 12; i++) s += feather(cx, cy, (166 - i * 152 / 12) * Math.PI / 180, 104 + (i % 2 ? -5 : 3), 1);
    s += '<g transform="translate(-6 6)">' +
      '<path d="M76 116C74 132 80 152 84 172C70 196 70 238 92 258C107 271 129 262 132 243C135 222 116 198 99 176C90 156 86 134 87 116Z" fill="' + paper + '" stroke-width="1.5"/>' +
      '<circle cx="81" cy="109" r="7.5" fill="' + paper + '" stroke-width="1.4"/>' +
      '<path d="M74 107L63 110L74 112.5" fill="' + paper + '" stroke-width="1.2"/>' +
      '<circle cx="79" cy="107.5" r="1.3" fill="' + INK + '" stroke="none"/>' +
      '<path d="M82 102L76 86M82 102L80 84M82 102L85 84M82 102L89 86" stroke-width=".8"/>' +
      '<g fill="' + INK + '" stroke="none"><circle cx="76" cy="85" r="1.7"/><circle cx="80" cy="83" r="1.7"/><circle cx="85" cy="83" r="1.7"/><circle cx="89" cy="85" r="1.7"/></g>' +
      '<path d="M80 124q3 2 6 0M80 134q3 2 6 0M81 144q3 2 6 0M82 154q3 2 6 0M84 164q3 2 6 0" stroke-width=".7"/>' +
      '<path d="M99 196C110 204 118 216 121 232M95 212C104 220 110 232 112 246M92 228C99 236 103 246 104 256" stroke-width=".9"/>' +
      '<path d="M78 200q4 8 2 18M76 222q5 8 4 18" stroke-width=".6"/>' +
      '<path d="M98 262L96 292M112 263L114 292M96 292l-7 3M96 292l2 5M96 292l7 2M114 292l-6 3M114 292l3 5M114 292l7 2" stroke-width="1.1"/>' +
      '</g><path d="M40 300q40-4 100 1" stroke-width=".7" opacity=".6"/>';
    return s;
  }
  /** The whole sheet, in sheet units. id keeps gradient/filter ids unique per SVG. */
  function sheetArt(id) {
    var paper = 'url(#' + id + 'p)';
    return '<defs>' +
      '<radialGradient id="' + id + 'p" gradientUnits="userSpaceOnUse" cx="160" cy="180" r="250">' +
        '<stop offset="0" stop-color="#e4d6b4"/><stop offset=".65" stop-color="#d2c096"/><stop offset="1" stop-color="#a68c5f"/></radialGradient>' +
      '<filter id="' + id + 'n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/>' +
        '<feColorMatrix type="matrix" values="0 0 0 0 .3  0 0 0 0 .24  0 0 0 0 .16  0 0 0 .5 0"/></filter>' +
      '<filter id="' + id + 'r" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="2"/>' +
        '<feDisplacementMap in="SourceGraphic" scale="1.6"/></filter>' +
      '</defs>' +
      '<rect width="' + SW + '" height="' + SH + '" fill="' + paper + '"/>' +
      '<path d="M0 206C90 201 200 209 320 204" stroke="rgba(90,70,40,.2)" stroke-width="1.2" fill="none"/>' +
      '<ellipse cx="250" cy="70" rx="34" ry="22" fill="rgba(120,90,50,.08)"/><ellipse cx="60" cy="370" rx="40" ry="16" fill="rgba(120,90,50,.07)"/>' +
      '<g filter="url(#' + id + 'r)" fill="none" stroke="' + INK + '" stroke-linecap="round" stroke-linejoin="round">' + peacock(paper) + '</g>' +
      '<g fill="' + INK + '" style="font-family:var(--brush)">' +
        '<text x="20" y="354" font-size="24" transform="rotate(-3 70 354)" style="font-family:\'Kaiti SC\',STKaiti,KaiTi,var(--serif)">' + G.esc(T.nums) + '</text>' +
        '<text x="156" y="290" font-size="18">第一份供奉，</text>' +
        '<text x="156" y="318" font-size="17">献给门后的存在。</text>' +
        '<text x="156" y="362" font-size="10.5">' + G.esc(T.addr) + '</text>' +
      '</g>' +
      '<rect width="' + SW + '" height="' + SH + '" filter="url(#' + id + 'n)" opacity=".55"/>';
  }
  function pieceSVG(side) {
    var id = 'rmS' + (++uid);
    var left = side === 'L';
    return '<svg viewBox="' + (left ? '0 0 ' + LV : RV0 + ' 0 ' + (SW - RV0)) + ' ' + SH + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><clipPath id="' + id + 'c"><polygon points="' + (left ? LEFT_POLY : RIGHT_POLY) + '"/></clipPath></defs>' +
      '<g clip-path="url(#' + id + 'c)">' + sheetArt(id) +
      '<polyline points="' + TEAR_LINE + '" fill="none" stroke="#f1e7cf" stroke-width="3" opacity=".9"/></g></svg>';
  }
  function fullSVG() {
    var id = 'rmS' + (++uid);
    return '<svg viewBox="0 0 ' + SW + ' ' + SH + '" aria-hidden="true">' + sheetArt(id) +
      '<polyline points="' + TEAR_LINE + '" fill="none" stroke="#efe4c8" stroke-width="2" opacity=".75"/>' +
      '<polyline points="' + TEAR_LINE + '" fill="none" stroke="#5a4a33" stroke-width=".6" opacity=".55"/></svg>';
  }
  /**
   * The two halves and the joined sheet, all in one sheet coordinate system.
   * Prefer A's G.tornPaperSVG (album.js) so the paper matches the photo in 相册 and both halves share one tear;
   * our own drawing is the fallback. L/R: x0 and width of each half's viewBox.
   */
  function paperSet() {
    if (typeof G.tornPaperSVG === 'function') {
      try {
        var lines = [T.line.slice(0, 6), T.line.slice(6)];   // 第一份供奉， / 献给门后的存在。
        // the address is longer than one 21px line fits, so it goes in a little smaller under A's two lines
        var addr = '<text x="338" y="398" font-size="16" fill="#22283a" fill-opacity=".88" style="font-family:var(--brush)" ' +
          'transform="rotate(-1.5 338 398)">' + G.esc(T.addr) + '</text></svg>';
        var l = G.tornPaperSVG({ part: 'left' });
        var r = G.tornPaperSVG({ part: 'right', lines: lines });
        var w = G.tornPaperSVG({ part: 'whole', lines: lines });
        if ([l, r, w].every(function (x) { return typeof x === 'string' && /<\/svg>\s*$/.test(x); })) {
          var end = /<\/svg>\s*$/;
          return { W: 600, H: 430, L: { x0: 0, w: 336, svg: l }, R: { x0: 286, w: 314, svg: r.replace(end, addr) }, whole: w.replace(end, addr) };
        }
      } catch (e) { /* fall back to our own drawing */ }
    }
    return { W: SW, H: SH, L: { x0: 0, w: LV, svg: pieceSVG('L') }, R: { x0: RV0, w: SW - RV0, svg: pieceSVG('R') }, whole: fullSVG() };
  }

  /* ---------- 房间（420×750 的画面，夜里，台灯关着） ---------- */
  function roomSVG() {
    var rnd = (function () { var s = 5; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
    var books = '', shelves = [200, 292, 384, 476, 588], cols = ['#4a3b34', '#35424a', '#5a4a3a', '#2f3b33', '#4f3436', '#3d3d46', '#5b5246', '#2e3440'];
    shelves.forEach(function (bot, si) {
      var x = 26;
      while (x < 118) {
        var w = 7 + rnd() * 8, h = 46 + rnd() * 30, c = cols[rnd() * cols.length | 0];
        if (x + w > 122) break;
        if (rnd() < 0.08 && x > 40) { // a lying stack
          books += '<rect x="' + f1(x) + '" y="' + (bot - 10) + '" width="30" height="10" fill="' + c + '"/><rect x="' + f1(x + 2) + '" y="' + (bot - 19) + '" width="26" height="9" fill="' + cols[(si + 3) % cols.length] + '"/>';
          x += 34;
          continue;
        }
        if (si === 0 && h > 70) h = 70;
        books += '<rect x="' + f1(x) + '" y="' + f1(bot - h) + '" width="' + f1(w) + '" height="' + f1(h) + '" fill="' + c + '"/>' +
          '<path d="M' + f1(x + 1.2) + ' ' + f1(bot - h + 3) + 'v' + f1(h - 6) + '" stroke="rgba(255,240,220,.12)" stroke-width="1"/>' +
          '<path d="M' + f1(x + 2) + ' ' + f1(bot - h + 10) + 'h' + f1(w - 4) + 'M' + f1(x + 2) + ' ' + f1(bot - 12) + 'h' + f1(w - 4) + '" stroke="rgba(0,0,0,.35)" stroke-width="1"/>';
        x += w + 0.8;
      }
    });
    return '<svg class="rm-svg" viewBox="0 0 420 750" aria-hidden="true"><defs>' +
      '<linearGradient id="rmWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d242b"/><stop offset="1" stop-color="#12171c"/></linearGradient>' +
      '<linearGradient id="rmFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1610"/><stop offset="1" stop-color="#0c0907"/></linearGradient>' +
      '<linearGradient id="rmSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22354b"/><stop offset="1" stop-color="#121c29"/></linearGradient>' +
      '<linearGradient id="rmWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b2b1f"/><stop offset="1" stop-color="#2a1e15"/></linearGradient>' +
      '<linearGradient id="rmSheetG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4250"/><stop offset="1" stop-color="#232933"/></linearGradient>' +
      '<linearGradient id="rmPillowG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd3d8"/><stop offset="1" stop-color="#8b9199"/></linearGradient>' +
      '<linearGradient id="rmMoon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ab4d6" stop-opacity=".18"/><stop offset="1" stop-color="#9ab4d6" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      // wall, stripes, skirting, floor
      '<rect width="420" height="604" fill="url(#rmWall)"/>' +
      '<g stroke="#9fb3c2" opacity=".035">' + Array.apply(null, Array(14)).map(function (_, i) { return '<path d="M' + (15 + i * 30) + ' 0V596"/>'; }).join('') + '</g>' +
      '<rect y="594" width="420" height="12" fill="#0d1013"/>' +
      '<rect y="604" width="420" height="146" fill="url(#rmFloor)"/>' +
      '<g stroke="#000" opacity=".4"><path d="M0 630H420M0 658H420M0 692H420M0 732H420"/>' +
        '<path d="M60 604V630M210 604V630M340 604V630M120 630V658M290 630V658M30 658V692M200 658V692M380 658V692M110 692V732M260 692V732"/></g>' +
      // window
      '<path d="M138 122H312" stroke="#0b0d10" stroke-width="3"/>' +
      '<rect x="164" y="134" width="122" height="176" fill="url(#rmSky)"/>' +
      '<g fill="#c9d6e6" opacity=".55"><circle cx="186" cy="160" r=".8"/><circle cx="262" cy="150" r=".7"/><circle cx="240" cy="196" r=".6"/><circle cx="200" cy="240" r=".6"/><circle cx="272" cy="262" r=".7"/></g>' +
      '<path d="M164 300C190 288 214 296 236 286C254 280 270 290 286 284V310H164Z" fill="#0b1219"/>' +
      '<rect x="161" y="131" width="128" height="182" fill="none" stroke="#283038" stroke-width="6"/>' +
      '<path d="M225 134V310M164 222H286" stroke="#283038" stroke-width="4"/>' +
      '<rect x="152" y="312" width="146" height="8" fill="#283038"/>' +
      '<path d="M140 122C146 180 138 250 148 334H174C166 260 176 180 170 122Z" fill="#1a1f26"/>' +
      '<path d="M150 130C154 190 148 260 156 330M160 128C162 200 158 270 164 332" stroke="#10141a" stroke-width="2" fill="none"/>' +
      '<path d="M310 122C304 180 312 250 302 334H276C284 260 274 180 280 122Z" fill="#1a1f26"/>' +
      '<path d="M300 130C296 190 302 260 294 330M290 128C288 200 292 270 286 332" stroke="#10141a" stroke-width="2" fill="none"/>' +
      '<path d="M166 314H286L332 604H128Z" fill="url(#rmMoon)"/>' +
      // bookshelf
      '<rect x="16" y="108" width="116" height="492" fill="#15100b"/>' + books +
      '<g fill="url(#rmWood)"><rect x="16" y="108" width="9" height="492"/><rect x="123" y="108" width="9" height="492"/><rect x="16" y="104" width="116" height="10"/></g>' +
      '<g fill="#3a2a1e">' + shelves.map(function (y) { return '<rect x="22" y="' + y + '" width="104" height="7"/>'; }).join('') + '</g>' +
      // desk
      '<path d="M146 436H296L302 446H140Z" fill="#3c2c20"/>' +
      '<rect x="140" y="446" width="162" height="10" fill="#2a1d14"/>' +
      '<rect x="145" y="456" width="8" height="150" fill="#21170f"/><rect x="289" y="456" width="8" height="150" fill="#21170f"/>' +
      '<rect x="228" y="456" width="61" height="46" fill="#2b1f16" stroke="#1a120c"/><path d="M250 478H268" stroke="#4a3a2a" stroke-width="2"/>' +
      '<g><rect x="152" y="425" width="44" height="6" fill="#3b4652"/><rect x="155" y="419" width="40" height="6" fill="#5a4a3a"/><rect x="153" y="431" width="46" height="5" fill="#4a3e48"/></g>' +
      '<path d="M206 418h13l-1.5 18h-10z" fill="#2c3238"/><path d="M209 418l-3-12M213 418l1-14M216 418l4-10" stroke="#4b4f55" stroke-width="1.4"/>' +
      '<ellipse cx="272" cy="434" rx="15" ry="4" fill="#1d2125"/>' +
      '<path d="M272 432L260 392L236 380" stroke="#2c3238" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M238 374L214 386L222 400L246 388Z" fill="#262c32"/><path d="M216 389L224 399" stroke="#3c444c" stroke-width="2"/>' +
      // chair
      '<path d="M184 470Q216 462 248 470L244 562H188Z" fill="#1b140e"/><path d="M196 478V556M216 474V556M236 478V556" stroke="#120d09" stroke-width="3"/>' +
      '<path d="M178 562H254L258 574H174Z" fill="#241a12"/><path d="M180 574L176 650M252 574L256 650M196 574V632M236 574V632" stroke="#18110b" stroke-width="5"/>' +
      // bed
      '<path d="M304 424Q362 404 420 412V512H304Z" fill="#2a2019"/><path d="M312 432Q362 416 420 422" stroke="#3a2c21" stroke-width="2" fill="none"/>' +
      '<path d="M300 500H420V702H258Z" fill="url(#rmSheetG)"/>' +
      '<path d="M258 702H420V730H258Z" fill="#161a21"/>' +
      '<path d="M286 566C320 556 380 560 420 552V702H258C268 660 276 606 286 566Z" fill="#2b3341"/>' +
      '<path d="M296 580C330 600 360 590 420 600M282 626C330 640 380 630 420 642M272 666C320 676 380 672 420 680M320 566C326 610 318 650 330 700" stroke="#1b212a" stroke-width="2" fill="none"/>' +
      '<g class="rm-corner"><path d="M318 527L340 524L336 537L321 538Z" fill="#cdbd97"/><path d="M321 531H334" stroke="#7a6a4c" stroke-width=".6"/></g>' +
      '<g class="rm-pillow"><path d="M314 500C318 488 396 482 406 492C412 506 410 526 404 534C380 540 336 540 316 534C308 524 310 508 314 500Z" fill="url(#rmPillowG)"/>' +
      '<path d="M324 506C350 498 380 498 398 506M330 526C356 530 380 530 398 524" stroke="#7d838b" stroke-width="1.2" fill="none" opacity=".7"/></g>' +
      '</svg>';
  }

  G.screen('room', {
    page: 8,
    theme: 'dark',
    time: '22:31',
    mount: function (root) {
      var NK = G.night;
      var k = NK.kit(root);
      root.classList.add('nt-touch');
      var stage = k.add('<div class="rm-stage">' + roomSVG() +
        '<button class="rm-hot" data-spot="shelf" aria-label="书架" style="left:14px;top:104px;width:120px;height:500px"></button>' +
        '<button class="rm-hot" data-spot="desk" aria-label="书桌" style="left:136px;top:370px;width:170px;height:96px"></button>' +
        '<button class="rm-hot" data-spot="pillow" aria-label="枕头" style="left:306px;top:478px;width:110px;height:68px"></button>' +
        '<div class="rm-folded"></div>' +
        '</div>');
      var pillow = stage.querySelector('.rm-pillow');
      var folded = stage.querySelector('.rm-folded');
      function fit() {
        var s = Math.max(k.w() / 420, k.h() / 750);
        stage.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
      }
      fit();
      k.on(window, 'resize', fit);
      NK.fx(k, { vig: 'rm-vig' });
      var torch = NK.torch(k, { r: 78, dark: 0.93, x: k.w() / 2, y: k.h() * 0.6 });
      k.place(T.place);
      k.later(function () { k.task(T.step1); }, 1600);

      var found = false;
      function note(e, text) {
        var rect = root.getBoundingClientRect();
        var s = root.offsetWidth / (rect.width || 1);
        var n = k.add('<div class="rm-note">' + G.esc(text) + '</div>');
        n.style.left = (e.clientX - rect.left) * s + 'px';
        n.style.top = (e.clientY - rect.top) * s + 'px';
        setTimeout(function () { n.remove(); }, 1900);
      }
      stage.querySelectorAll('.rm-hot').forEach(function (b) {
        b.addEventListener('click', function (e) {
          if (found) return;
          if (b.getAttribute('data-spot') !== 'pillow') {
            G.audio.play('tap');
            if (e.clientX || e.clientY) note(e, T.nothing); else G.ui.toast(T.nothing);
            return;
          }
          found = true;
          G.audio.play('paper');
          pillow.classList.add('lift');
          k.untask();
          k.later(function () { folded.classList.add('in'); }, 500);
          k.later(function () {
            torch.lift();
            k.cap(T.found, { pos: 'top' });
            puzzle();
          }, 1500);
        });
      });

      /* ---------- 拼纸 ---------- */
      function puzzle() {
        var P = paperSet();
        // 拼纸用自己的一层：整块放得下（contain），不跟房间一起被裁掉
        var wrap = k.add('<div class="rm-puzzle"><div class="rm-pzstage"></div></div>');
        var pz = wrap.firstChild;
        function fitPz() {
          var s = Math.min(k.w() / 420, k.h() / 750);
          pz.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
        }
        fitPz();
        k.on(window, 'resize', fitPz);
        var sc = Math.min(330 / P.W, 330 / P.H);
        var ph = P.H * sc, lw = P.L.w * sc, rw = P.R.w * sc;
        var lx = 210 - P.W * sc / 2, ty = 380 - ph / 2;
        var tx = lx + P.R.x0 * sc;
        var L = k.add('<div class="rm-piece left">' + P.L.svg + '</div>', pz);
        L.style.width = lw + 'px';
        L.style.height = ph + 'px';
        L.style.transform = 'translate(' + lx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
        var R = k.add('<div class="rm-piece right" role="button" tabindex="0" aria-label="另一半纸条：拖到左边，把两半拼起来">' + P.R.svg + '</div>', pz);
        R.style.width = rw + 'px';
        R.style.height = ph + 'px';
        var px = Math.min(tx + 30, 404 - rw), py = ty + Math.min(150, 690 - ty - ph), rot = 6, done = false, drag = null;
        function put() { R.style.transform = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px) rotate(' + rot + 'deg)'; }
        put();
        folded.classList.add('gone');
        void wrap.offsetWidth;
        wrap.classList.add('in');
        k.later(function () { k.task(T.step2); }, 900);

        function stageScale() { return pz.getBoundingClientRect().width / 420 || 1; }
        function near(d) { return Math.abs(px - tx) < d && Math.abs(py - ty) < d; }
        function snap() {
          if (done) return;
          done = true;
          drag = null;
          R.classList.remove('held');
          R.classList.add('glide');
          px = tx; py = ty; rot = 0;
          put();
          k.later(joined, 340);
        }
        R.addEventListener('pointerdown', function (e) {
          if (done) return;
          e.preventDefault();
          try { R.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          drag = { id: e.pointerId, x: e.clientX, y: e.clientY, px: px, py: py, at: performance.now(), moved: 0 };
          R.classList.remove('glide');
          R.classList.add('held');
          rot = 2;
          put();
        });
        R.addEventListener('pointermove', function (e) {
          if (!drag || e.pointerId !== drag.id) return;
          var s = stageScale();
          var dx = (e.clientX - drag.x) / s, dy = (e.clientY - drag.y) / s;
          drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
          px = drag.px + dx;
          py = drag.py + dy;
          put();
          if (near(10)) snap();
        });
        function release(e) {
          if (!drag || (e && e.pointerId !== drag.id)) return;
          var d = drag;
          drag = null;
          R.classList.remove('held');
          if (d.moved < 6 && performance.now() - d.at < 600) { snap(); return; } // 轻触：自动拼上（无障碍）
          if (near(26)) snap(); else { rot = 3; put(); }
        }
        R.addEventListener('pointerup', release);
        R.addEventListener('pointercancel', release);
        R.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); snap(); }
        });

        function joined() {
          G.audio.play('paper');
          wrap.classList.add('joined');
          k.untask();
          var FS = Math.min(380 / P.W, 340 / P.H), fw = P.W * FS, fh = P.H * FS;
          var fx = 210 - fw / 2, fy = 112 + (340 - fh) / 2;
          var sheet = k.add('<div class="rm-sheet">' + P.whole + '</div>', pz);
          sheet.style.width = fw + 'px';
          sheet.style.height = fh + 'px';
          sheet.style.left = fx + 'px';
          sheet.style.top = fy + 'px';
          sheet.style.transform = 'translate(' + (lx - fx).toFixed(1) + 'px,' + (ty - fy).toFixed(1) + 'px) scale(' + (sc / FS).toFixed(4) + ')';
          k.later(function () { sheet.classList.add('in'); L.classList.add('out'); R.classList.add('out'); }, 380);
          k.later(function () { sheet.style.transform = 'none'; k.uncap('top'); }, 1100);
          k.later(function () {
            // 纸上的字（手写太小，下面再印一遍）
            k.reveal('<div class="rm-read"><span class="nt-who">纸上</span><p>' + G.esc(T.line) + '</p><p>' + G.esc(T.addr) + '</p></div>', pz)
              .style.top = (fy + fh + 22) + 'px';
          }, 2300);
          k.later(function () {
            G.state.flag('note');
            k.cap(T.joined);
            k.tap({ hintDelay: 2400 }).then(function () { k.go('web-school', { path: 'history' }, 1300); });
          }, 3600);
        }
      }
      return k.cleanup;
    }
  });
})();
