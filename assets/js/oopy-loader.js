(function () {
  'use strict';

  /* 중복 초기화 방지 */
  if (window.__VATOS_OOPY_INITIALIZED__) {
    return;
  }

  window.__VATOS_OOPY_INITIALIZED__ = true;

  const BASE_URL = 'https://vatos-tech.github.io/official-website';
  let pageClassTimer = null;
  let pageObserver = null;
  let previousPageUrl = window.location.pathname + window.location.search;

  /* 브라우저가 이전 스크롤 위치를 자동 복원하지 않도록 설정 */
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  /* 페이지 이동 시 브라우저 및 Oopy 스크롤 영역을 최상단으로 초기화 */
  function resetPageScroll() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    document.querySelectorAll('.notion-scroller').forEach(function (scroller) {
      scroller.scrollTop = 0;

      if (typeof scroller.scrollTo === 'function') {
        scroller.scrollTo(0, 0);
      }
    });
  }

  /* React 렌더링 전후에 남아 있는 스크롤 복원까지 함께 제거 */
  function schedulePageScrollReset() {
    resetPageScroll();

    window.requestAnimationFrame(function () {
      resetPageScroll();
    });

    window.setTimeout(resetPageScroll, 120);
    window.setTimeout(resetPageScroll, 300);
  }

  /* GitHub Pages URL 생성 */
  function createUrl(path) {
    return BASE_URL + '/' + path.replace(/^\/+/, '');
  }

  /* GitHub의 HTML 파일 호출 */
  async function fetchHtml(fileName) {
    const response = await fetch(createUrl(fileName), { cache: 'no-cache' });

    if (!response.ok) {
      throw new Error(createUrl(fileName) + ' 로드 실패: ' + response.status);
    }

    return response.text();
  }

  /* Header와 Footer의 assets 상대경로를 GitHub Pages 절대경로로 변경 */
  function fixAssetPaths(container) {
    if (!container) {
      return;
    }

    function convertAssetPath(value) {
      if (!value) {
        return value;
      }

      /* 이미 완성된 URL이나 특수 주소는 변경하지 않음 */
      if (/^(?:https?:|data:|blob:|mailto:|tel:)/i.test(value)) {
        return value;
      }

      const normalized = value.replace(/^(?:\.\.\/)+/, '').replace(/^\/+/, '');

      /* assets 경로가 아니면 Clean URL을 그대로 유지 */
      if (normalized.indexOf('assets/') !== 0) {
        return value;
      }

      return BASE_URL + '/' + normalized;
    }

    container.querySelectorAll('[src], [href]').forEach(function (element) {
      ['src', 'href'].forEach(function (attribute) {
        if (!element.hasAttribute(attribute)) {
          return;
        }

        const original = element.getAttribute(attribute);
        const converted = convertAssetPath(original);

        if (converted !== original) {
          element.setAttribute(attribute, converted);
        }
      });
    });
  }

  /* JavaScript 파일 동적 호출 */
  function loadScript(path, key) {
    return new Promise(function (resolve, reject) {
      const existing = document.querySelector(
        'script[data-vatos-script="' + key + '"]'
      );

      /* 이미 호출한 스크립트는 다시 추가하지 않음 */
      if (existing) {
        if (existing.dataset.loaded === 'true') {
          resolve();
          return;
        }

        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');

      script.src = createUrl(path);
      script.async = false;
      script.dataset.vatosScript = key;

      script.addEventListener('load', function () {
        script.dataset.loaded = 'true';
        resolve();
      }, { once: true });

      script.addEventListener('error', function () {
        reject(new Error(script.src + ' 로드 실패'));
      }, { once: true });

      document.body.appendChild(script);
    });
  }

  /* 현재 페이지 유형 판별 및 body class 지정 */
  function applyPageClass() {
    const pageClasses = [
      'vatos-page-main',
      'vatos-page-contact',
      'vatos-contact-light',
      'vatos-page-sub',
      'vatos-page-culture',
      'vatos-page-insights',
      'vatos-page-article'
    ];

    pageClasses.forEach(function (className) {
      document.body.classList.remove(className);
    });

    document.body.classList.add('vatos-oopy');

    /* 메인 페이지 */
    if (document.querySelector('.vatos-main-hero')) {
      document.body.classList.add('vatos-page-main');
      return 'main';
    }

    /* 문의 페이지 */
    if (document.querySelector('.vatos-contact')) {
      document.body.classList.add('vatos-page-contact', 'vatos-contact-light');
      return 'contact';
    }

    /* Culture 페이지 */
    if (document.querySelector('.vatos-culture-bg')) {
      document.body.classList.add('vatos-page-sub', 'vatos-page-culture');
      return 'culture';
    }

    /* Tech Insights 목록 페이지 */
    if (document.querySelector('.vatos-insights-main')) {
      document.body.classList.add('vatos-page-sub', 'vatos-page-insights');
      return 'insights';
    }

    /* 일반 서브페이지 */
    if (document.querySelector('.vatos-sub-content, .vatos-sub-hero')) {
      document.body.classList.add('vatos-page-sub');
      return 'sub';
    }

    /* 게시글 페이지 */
    document.body.classList.add('vatos-page-article');
    return 'article';
  }

  /* 페이지 유형 재판별 예약 */
  function schedulePageClassUpdate() {
    window.clearTimeout(pageClassTimer);

    pageClassTimer = window.setTimeout(function () {
      applyPageClass();
    }, 150);
  }

  /* 우피의 React 화면 변경 감지 */
  function observeOopyPageChanges() {
    if (pageObserver) {
      return;
    }

    pageObserver = new MutationObserver(function (mutations) {
      const hasContentChange = mutations.some(function (mutation) {
        return mutation.type === 'childList' &&
          (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0);
      });

      if (hasContentChange) {
          applyPageClass();
        }
    });

    pageObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /* 브라우저 및 Oopy SPA 페이지 이동 감지 */
  function observeHistoryNavigation() {
    function handleNavigation() {
      const currentPageUrl = window.location.pathname + window.location.search;

      /* 같은 페이지의 내부 상태 변경에는 스크롤을 건드리지 않음 */
      if (currentPageUrl === previousPageUrl) {
        schedulePageClassUpdate();
        return;
      }

      previousPageUrl = currentPageUrl;
      schedulePageClassUpdate();
      schedulePageScrollReset();
    }

    window.addEventListener('popstate', handleNavigation);

    ['pushState', 'replaceState'].forEach(function (methodName) {
      const originalMethod = window.history[methodName];

      window.history[methodName] = function () {
        const result = originalMethod.apply(this, arguments);
        handleNavigation();
        return result;
      };
    });
  }

  /* header.html 삽입 */
  function insertHeader(html) {
    const oldHeader = document.getElementById('vatos-layout-header');

    if (oldHeader) {
      oldHeader.remove();
    }

    const container = document.createElement('div');
    container.id = 'vatos-layout-header';
    container.innerHTML = html;

    fixAssetPaths(container);
    document.body.appendChild(container);
  }

  /* footer.html 삽입 */
  function insertFooter(html) {
    const oldFooter = document.getElementById('vatos-layout-footer');

    if (oldFooter) {
      oldFooter.remove();
    }

    const container = document.createElement('div');
    container.id = 'vatos-layout-footer';
    container.innerHTML = html;

    fixAssetPaths(container);

    const scrollContainer = document.querySelector('.notion-scroller');

    if (scrollContainer) {
      scrollContainer.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
  }

  /* VATOS 페이지 초기화 */
  async function initializeVatosPage() {
    try {
      const pageType = applyPageClass();

const result = await Promise.all([
        fetchHtml('header.html'),
        fetchHtml('footer.html')
      ]);

      insertHeader(result[0]);
      insertFooter(result[1]);

      

      /* 메인 페이지에서만 GSAP 호출 */
      if (pageType === 'main') {
        await loadScript('assets/vendor/gsap.min.js', 'gsap');
      }

      /* 공통 및 페이지별 기능 실행 */
      await loadScript('assets/js/vatos-interact.js', 'vatos-interact');

      /* 우피 내부 페이지 전환 감지 시작 */
      observeHistoryNavigation();
      observeOopyPageChanges();
    } catch (error) {
      console.error('[VATOS Initialize]', error);
    }
  }

  /* 우피 React 렌더링 이후 초기화 */
  function startAfterReactRender() {
    window.setTimeout(initializeVatosPage, 800);
  }

  if (document.readyState === 'complete') {
    startAfterReactRender();
  } else {
    window.addEventListener('load', startAfterReactRender, { once: true });
  }
})();
