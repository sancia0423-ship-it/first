/* 01 妹妹的手机 · 主屏 */
(function () {
  'use strict';

  var ICONS = {
    wx: '<svg viewBox="0 0 40 40"><path fill="#fff" d="M16 7C8.8 7 3 11.9 3 18c0 3.4 1.8 6.4 4.6 8.4L6.5 30l4.3-2.2c1.6.5 3.4.8 5.2.8h.9a10 10 0 0 1-.4-2.8C16.5 20.1 22 15.6 29 15.6h.7C28.4 10.6 22.7 7 16 7zm-4.5 5.5a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2zm9 0a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2z"/><path fill="#fff" d="M37 25.8c0-5.1-4.9-9.2-11-9.2s-11 4.1-11 9.2 4.9 9.2 11 9.2c1.4 0 2.8-.2 4-.6l3.4 1.8-.9-3c2.7-1.7 4.5-4.3 4.5-7.4zm-14.5-1.4a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm7 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6z"/></svg>',
    album: '<svg viewBox="0 0 40 40"><g transform="translate(20 20)"><ellipse rx="5" ry="11" cy="-7" fill="#f6b73c"/><ellipse rx="5" ry="11" cy="-7" fill="#f2665c" transform="rotate(60)"/><ellipse rx="5" ry="11" cy="-7" fill="#b65fd6" transform="rotate(120)"/><ellipse rx="5" ry="11" cy="-7" fill="#4b8ff2" transform="rotate(180)"/><ellipse rx="5" ry="11" cy="-7" fill="#3cc8a8" transform="rotate(240)"/><ellipse rx="5" ry="11" cy="-7" fill="#8fd14f" transform="rotate(300)"/></g></svg>',
    memo: '<svg viewBox="0 0 40 40"><rect x="7" y="6" width="26" height="28" rx="3" fill="#fff"/><rect x="7" y="6" width="26" height="7" rx="3" fill="#f5c443"/><path d="M12 19h16M12 24h16M12 29h10" stroke="#c9c9c9" stroke-width="2"/></svg>',
    web: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="none" stroke="#fff" stroke-width="2.5"/><path d="M20 6v28M6 20h28M10 11c6 4 14 4 20 0M10 29c6-4 14-4 20 0" stroke="#fff" stroke-width="1.6" fill="none"/></svg>',
    phone: '<svg viewBox="0 0 40 40"><path fill="#fff" d="M14 9c1 0 1.6.6 2 1.6l1.6 4c.3.9.1 1.8-.6 2.4l-1.8 1.5c1.2 2.6 3.3 4.7 5.9 5.9l1.5-1.8c.6-.7 1.5-.9 2.4-.6l4 1.6c1 .4 1.6 1 1.6 2v3c0 1.6-1.4 2.9-3 2.7C17.4 30.9 9.1 22.6 8.3 12c-.2-1.6 1.1-3 2.7-3z"/></svg>',
    msg: '<svg viewBox="0 0 40 40"><path fill="#fff" d="M20 8c-7.7 0-14 5.2-14 11.6 0 3.6 2 6.8 5.1 8.9L10 33l5.1-2.6c1.5.4 3.2.7 4.9.7 7.7 0 14-5.2 14-11.5S27.7 8 20 8z"/></svg>'
  };

  G.screen('home', {
    page: 1,
    theme: 'dark',
    mount: function (root) {
      var t = G.state.get('time', '21:47');
      var wxUnread = G.state.has('wx-read-jie') && G.state.has('wx-read-fang') ? 0 : 2;
      root.innerHTML =
        '<div class="home-wall"></div>' +
        '<div class="home-clock"><div class="hc-time">' + G.esc(t) + '</div><div class="hc-date">10月27日 星期日</div></div>' +
        '<div class="home-grid">' +
          icon('wx', '威信', '#07c160', wxUnread) +
          icon('album', '相册', '#ffffff') +
          icon('memo', '备忘录', '#ffffff') +
          icon('web', '浏览器', '#2f7cf6') +
        '</div>' +
        '<div class="home-dock">' + dock('phone', '#34c759') + dock('msg', '#34c759') + '</div>';

      root.querySelector('[data-app="wx"]').onclick = function () { G.audio.play('tap'); G.ui.launch('威信', '#07c160', 'wx-list'); };
      root.querySelector('[data-app="album"]').onclick = function () { G.audio.play('tap'); G.show('album'); };
      root.querySelector('[data-app="memo"]').onclick = function () { G.audio.play('tap'); G.show('memo'); };
      root.querySelector('[data-app="web"]').onclick = function () { G.audio.play('tap'); G.show('browser'); };
      root.querySelectorAll('.dock-ic').forEach(function (d) {
        d.onclick = function () { G.audio.play('error'); G.ui.toast('功能暂不可用'); };
      });

      // 壁纸：代码画的夜里校园（js/art.js），压在时钟和图标下面
      var wall = G.art ? G.art.mount(root.querySelector('.home-wall'), 'campus-night') : null;
      return function () { if (wall) wall.stop(); };
    }
  });

  function icon(key, name, bg, badge) {
    return '<button class="app-icon" data-app="' + key + '"><span class="ic" style="background:' + bg + '">' +
      ICONS[key] + (badge ? '<span class="dot">' + badge + '</span>' : '') + '</span>' + name + '</button>';
  }
  function dock(key, bg) {
    return '<button class="app-icon dock-ic"><span class="ic" style="background:' + bg + '">' + ICONS[key] + '</span></button>';
  }

  G.ICONS = ICONS;

  /* 封面：代码画的 feather-fog 画进 .cv-feather。滑出视野、进了手机（封面 hidden）就停，回来再接着动 */
  function coverFeather() {
    var box = document.querySelector('.cv-feather');
    if (!box || !G.art) return;
    var art = null, t = 0, t0 = 0;
    function play() {
      if (art) return;
      var old = box.querySelector('canvas');
      art = G.art.mount(box, 'feather-fog', t ? { t: t } : null);
      t0 = performance.now();
      if (old) old.remove(); // 新画布先画好再换掉旧的，不闪
    }
    function pause() {
      if (!art) return;
      art.stop();
      art = null;
      t += (performance.now() - t0) / 1000;
    }
    play();
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { if (es[es.length - 1].isIntersecting) play(); else pause(); }).observe(box);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', coverFeather);
  else coverFeather();
})();
