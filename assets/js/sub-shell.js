/* ============================================================
   VATOS — Subpage Shell 공통 스크립트
   상단바 스크롤 상태 / 모바일 메뉴 / 공통 스크롤 리빌
   Business Areas 상세 + Tech Insights 공용.
   ============================================================ */
(function () {
  'use strict';

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.VATOS_REDUCE = REDUCE;

  /* ---- 상단바: 스크롤 시 짙은 배경 + blur ---- */
  (function header() {
    var h = document.querySelector('header');
    if (!h) return;
    function onScroll() {
      if (window.scrollY > 40) h.classList.add('scrolled');
      else h.classList.remove('scrolled');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* ---- 모바일 햄버거 메뉴 ---- */
  (function mobileNav() {
    var burger = document.getElementById('hamburgerBtn');
    var drawer = document.getElementById('mobileNav');
    if (!burger || !drawer) return;
    burger.addEventListener('click', function () {
      burger.classList.toggle('active');
      drawer.classList.toggle('open');
    });
    drawer.querySelectorAll('a[href]:not([href^="#"])').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.classList.remove('active');
        drawer.classList.remove('open');
      });
    });
  })();

  /* ---- 공통 스크롤 리빌 (.sv → .is-in) ---- */
  (function reveals() {
    var els = document.querySelectorAll('.sv');
    if (!els.length) return;
    if (REDUCE || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();
})();
