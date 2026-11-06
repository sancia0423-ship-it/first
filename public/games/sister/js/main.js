/* 姐姐的不对劲 · boot: cover → phone, scaling, badge panel, debug jump */
(function () {
  'use strict';

  var cover = document.getElementById('cover');
  var stage = document.getElementById('stage');
  var wrap = document.querySelector('.phone-wrap');
  var params = new URLSearchParams(location.search);

  /* 等比缩放手机：桌面上留边距，小屏直接全屏（见 base.css） */
  function fit() {
    if (window.innerWidth <= 520) { wrap.style.transform = ''; return; }
    var s = Math.min((window.innerWidth - 40) / 420, (window.innerHeight - 40) / 750, 1);
    wrap.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit);

  function enterPhone(screenId, screenParams) {
    G.audio.unlock();
    cover.hidden = true;
    stage.hidden = false;
    fit();
    G.phone.setTime(G.state.get('time', '21:47'));
    G.show(screenId || 'home', screenParams);
  }

  /* 新游戏：先是开头旁白，再进手机 */
  function newGame() {
    enterPhone('home');
    G.ui.narrate(['我刚升上姐姐的学校。', '我发现，姐姐很不对劲。']);
  }

  document.getElementById('start').onclick = function () {
    if (G.reached() > 0 && !confirm('从头开始？之前的进度会清空。')) return;
    if (G.reached() > 0) { try { localStorage.removeItem('jjbdj:v1'); } catch (e) { /* ignore */ } location.hash = '#start'; location.reload(); return; }
    newGame();
  };
  var cont = document.getElementById('continue');
  if (G.reached() > 0) {
    cont.hidden = false;
    cont.onclick = function () { enterPhone(G.state.get('screen', 'home'), G.state.get('params', null)); };
  }
  if (location.hash === '#start') { history.replaceState(null, '', location.pathname); setTimeout(newGame, 0); }

  /* 页码徽标 */
  document.getElementById('badge').onclick = function (e) { e.stopPropagation(); G.badge.toggle(); };
  document.addEventListener('click', function (e) {
    var panel = document.querySelector('.page-panel');
    if (!panel.hidden && !panel.contains(e.target)) panel.hidden = true;
  });
  var muteBtn = document.getElementById('mute');
  function syncMute() { muteBtn.textContent = G.audio.muted() ? '声音：关' : '声音：开'; }
  muteBtn.onclick = function () { G.audio.setMuted(!G.audio.muted()); syncMute(); };
  syncMute();
  document.getElementById('reset').onclick = function () {
    if (confirm('重新开始？进度会清空。')) G.state.reset();
  };

  /* 调试：?debug=1 解锁全部页码；?p=13 直接跳到第 13 页 */
  if (params.get('debug') === '1') {
    G.state.set('reached', G.TOTAL);
    ['wx-read-jie', 'wx-read-fang', 'link', 'gate', 'done', 'note'].forEach(G.state.flag);
  }
  var jump = parseInt(params.get('p'), 10);
  if (!isNaN(jump) && G.pages[jump]) {
    var p = G.pages[jump];
    if (p.screen === 'cover') return;
    setTimeout(function () { enterPhone(p.screen, p.params); }, 0);
  }
})();
