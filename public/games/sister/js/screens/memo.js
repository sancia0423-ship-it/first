/* 备忘录：长按存下的记录（G.memo），无独立页码 */
(function () {
  'use strict';

  var COMPOSE = '<svg viewBox="0 0 24 24"><path d="M19 13.5V19a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 19V7a1.5 1.5 0 0 1 1.5-1.5H11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="m18.2 3.8 2 2L12 14l-2.8.8.8-2.8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  var EMPTY = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="7" width="28" height="34" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 17h16M16 24h16M16 31h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  G.screen('memo', {
    theme: 'light',
    mount: function (root) {
      var items = G.memo.list().reverse(); // newest first
      var list = items.length
        ? '<div class="memo-list">' + items.map(function (m, i) {
            return '<button class="memo-row" data-i="' + i + '">' +
              '<span class="memo-row-t">' + G.esc(m.title) + '</span>' +
              (m.text ? '<span class="memo-row-x">' + G.esc(m.text) + '</span>' : '') +
              (m.time ? '<time>' + G.esc(m.time) + '</time>' : '') +
              '</button>';
          }).join('') + '</div>'
        : '<div class="memo-empty">' + EMPTY + '<p>长按聊天或照片里的重要信息，可以存到这里。</p></div>';

      root.innerHTML =
        '<header class="memo-head"><button class="go-home" aria-label="返回主屏幕">← 返回主屏幕</button></header>' +
        '<div class="memo-body"><h1 class="memo-title">备忘录</h1>' + list + '</div>' +
        '<footer class="memo-foot"><span>' + (items.length ? items.length + ' 个备忘录' : '无备忘录') + '</span>' +
          '<button class="memo-new" aria-label="新建">' + COMPOSE + '</button></footer>';

      root.querySelector('.go-home').onclick = function () { G.audio.play('tap'); G.show('home'); };
      root.querySelector('.memo-new').onclick = function () { G.audio.play('error'); G.ui.toast('功能暂不可用'); };
      root.querySelectorAll('.memo-row').forEach(function (r) {
        r.onclick = function () { G.audio.play('tap'); detail(root, items[+r.getAttribute('data-i')]); };
      });
    }
  });

  function detail(root, m) {
    var d = G.ui.el('<div class="memo-detail" role="dialog">' +
      '<div class="memo-dbar"><button class="memo-back"><svg viewBox="0 0 24 24"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>备忘录</button></div>' +
      '<article class="memo-doc">' + (m.time ? '<time>' + G.esc(m.time) + '</time>' : '') +
        '<h2>' + G.esc(m.title) + '</h2><p>' + G.esc(m.text) + '</p></article>' +
      '</div>');
    root.appendChild(d);
    d.querySelector('.memo-back').onclick = function () {
      G.audio.play('tap');
      d.classList.add('out');
      setTimeout(function () { d.remove(); }, 220);
    };
  }
})();
