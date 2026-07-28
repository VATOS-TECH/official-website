/* ============================================================
   VATOS — Common interactions
   전체 페이지 공통: 정적 헤더, 모바일 메뉴, 앵커 이동, 공통 리빌,
   하위 페이지 Hero, 주소 복사, Contact 폼.
   우피 기본 메뉴는 .header-inner가 없으므로 직접 조작하지 않는다.
   ============================================================ */
(function () {
  'use strict';

  window.VATOS_REDUCE = !!(
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

/* 같은 페이지 내 앵커(#id) 스무스 스크롤 — 멀티페이지 .html 링크엔 영향 없음 */
document.querySelectorAll('a[href^="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var href = a.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    var target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      var offset = 90; // 플로팅 헤더 높이 + 상단 여백
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
      closeMobileNav();
    }
  });
});

/* 헤더 스크롤 시 짙은 배경 + blur (다크 플로팅 헤더 — 메인/Business Areas 상세페이지와 동일) */
(function () {
  var inner = document.querySelector('.header-inner');
  var h = inner ? inner.closest('header') : null;
  if (!h) return;
  function onScroll() {
    if (window.scrollY > 40) h.classList.add('scrolled');
    else h.classList.remove('scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* 햄버거 / 모바일 내비게이션 */
var hamburgerBtn = document.getElementById('hamburgerBtn');
var mobileNav = document.getElementById('mobileNav');

function closeMobileNav() {
  if (!mobileNav || !hamburgerBtn) return;
  mobileNav.classList.remove('open');
  hamburgerBtn.classList.remove('active');
}

if (hamburgerBtn && mobileNav) {
  hamburgerBtn.addEventListener('click', function () {
    var isOpen = mobileNav.classList.toggle('open');
    hamburgerBtn.classList.toggle('active', isOpen);
  });
  document.addEventListener('click', function (e) {
    if (!hamburgerBtn.contains(e.target) && !mobileNav.contains(e.target)) {
      closeMobileNav();
    }
  });
}

/* ── 주소 복사 (careers / contact 찾아오시는 길) ── */
(function () {
  var buttons = document.querySelectorAll('.loc-copy-btn');
  if (!buttons.length) return;
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('.loc-addr-row');
      if (!row) return;
      var addrEl = row.querySelector('.js-copy-addr');
      var toast = row.querySelector('.loc-copy-toast');
      var text = addrEl ? (addrEl.textContent || '').trim() : '';
      function showToast() {
        if (!toast) return;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 1800);
      }
      function fallbackCopy() {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.focus(); ta.select();
        try { document.execCommand('copy'); showToast(); } catch (e) {}
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showToast).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    });
  });
})();

/* ── 상위 메뉴(드롭다운 부모) 클릭 시 페이지 이동 방지 ── */
/* About VATOS / Business Areas / Crew: href="#" + data-menu 를 가진 링크는 이동하지 않고 */
/* 드롭다운을 여는 역할만 한다. Tech Insights 등 실제 링크는 그대로 이동. */
(function () {
  var parents = document.querySelectorAll('.nav-link[href="#"][data-menu], .mnav-link[href="#"][data-menu]');
  parents.forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
    });
  });
})();


/* ── 하위 페이지 공통 Hero 진입 ── */
(function () {
  var hero = document.querySelector('.bd-hero');
  if (!hero) return;

  requestAnimationFrame(function () {
    hero.classList.add('is-ready');
  });
})();

/* ── 공통 스크롤 리빌 (.sv → .is-in) — 다크 상세페이지들과 동일한 Fade-up 기법 ── */
(function () {
  var els = document.querySelectorAll('.sv, .motion-reveal, .motion-from-left, .motion-from-right, .motion-mask, .rd-reveal, .rd-mask');
  if (!els.length) return;
  var REDUCE = window.VATOS_REDUCE;
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

/* ── 서비스 문의하기 폼 제출 ──
   백엔드 연동 전까지, 필수값 검증 통과 시 접수 완료 안내만 표시한다.
   필수값이 비어 있으면 브라우저 기본 검증 메시지가 그대로 노출된다(HTML required 속성). */
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;
  var btn = form.querySelector('.btn-submit');
  form.addEventListener('submit', function (e) {
    e.preventDefault(); // 이 페이지는 정적 사이트이므로 실제 전송 대신 접수 완료 안내로 대체
    if (!btn) return;
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = '접수되었습니다. 감사합니다!';
    setTimeout(function () {
      btn.disabled = false;
      btn.textContent = original;
      form.reset();
    }, 2600);
  });
})();

})();
