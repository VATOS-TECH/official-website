/* ============================================================
   VATOS — History(연혁) 페이지 전용 스크립트
   세로 타임라인 선 위의 원형 인디케이터를 스크롤 진행률에 맞춰 이동시키고,
   현재 위치에 해당하는 연도를 청록색으로 강조한다.
   sub-shell.js(헤더/모바일메뉴) 다음에 로드된다.
   ============================================================ */
(function () {
  'use strict';

  var timeline = document.getElementById('hstTimeline');
  if (!timeline) return;

  var line = timeline.querySelector('.hst-line');
  var fill = document.getElementById('hstLineFill');
  var indicator = document.getElementById('hstIndicator');
  var rows = Array.prototype.slice.call(timeline.querySelectorAll('.hst-row'));
  if (!line || !fill || !indicator || !rows.length) return;

  var REDUCE = window.VATOS_REDUCE ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var ANCHOR_RATIO = 0.38; // 뷰포트 상단에서 38% 지점을 스크롤 기준선으로 사용
  var ticking = false;

  function update() {
    ticking = false;

    var lineRect = line.getBoundingClientRect();
    var lineHeight = lineRect.height;
    if (lineHeight <= 0) return;

    var scrollY = window.scrollY || window.pageYOffset;
    var viewportH = window.innerHeight;
    var anchorY = viewportH * ANCHOR_RATIO;

    // 라인의 시작/끝 지점을 "문서 절대좌표"로 환산 — 스크롤 위치가 바뀌어도 값이 고정되어 안정적으로 비교 가능
    var lineTopAbs = lineRect.top + scrollY;
    var lineBottomAbs = lineTopAbs + lineHeight;

    // 실제로 스크롤 가능한 최대 위치(문서 길이가 짧은 모바일에서도 이 값을 넘지 않음)
    var maxScrollY = Math.max(0, document.documentElement.scrollHeight - viewportH);

    var startScrollY = lineTopAbs - anchorY;              // 진행률 0%: 라인 상단이 기준선에 닿는 시점
    var idealEndScrollY = lineBottomAbs - anchorY;        // 진행률 100%가 되어야 하는 이상적인 스크롤 위치
    var endScrollY = Math.min(idealEndScrollY, maxScrollY); // 페이지 끝을 넘어서지 않도록 보정 → 마지막 연도까지 항상 도달 가능

    var progress;
    if (endScrollY <= startScrollY) {
      progress = scrollY >= startScrollY ? 1 : 0;
    } else {
      progress = (scrollY - startScrollY) / (endScrollY - startScrollY);
    }
    progress = Math.max(0, Math.min(1, progress));

    var pct = (progress * 100).toFixed(2) + '%';
    fill.style.height = pct;
    indicator.style.top = pct;

    // 기준선에 가장 가까운 연도(row)를 활성 상태로 표시
    var atPageBottom = scrollY >= maxScrollY - 1;
    var closestRow = null;
    var closestDist = Infinity;
    rows.forEach(function (row) {
      var r = row.getBoundingClientRect();
      var center = r.top + r.height / 2;
      var dist = Math.abs(center - anchorY);
      if (dist < closestDist) { closestDist = dist; closestRow = row; }
    });
    if (atPageBottom) closestRow = rows[rows.length - 1]; // 페이지 맨 끝에서는 마지막 연도(2015)를 확실히 활성화

    rows.forEach(function (row) {
      row.classList.toggle('is-active', row === closestRow);
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  if (REDUCE) {
    fill.style.transition = 'none';
    indicator.style.transition = 'none';
  } else {
    fill.style.transition = 'height .15s linear';
    indicator.style.transition = 'top .15s linear';
  }

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', update);
})();
