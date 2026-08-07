(function () {
  'use strict';

  if (window.__VATOS_OOPY_INITIALIZED__) {
    return;
  }

  window.__VATOS_OOPY_INITIALIZED__ = true;

  const BASE_URL = 'https://vatos-tech.github.io/official-website';

  let currentPageUrl = getPageUrl();
  let pageClassTimer = null;

  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  function getPageUrl() {
    return window.location.pathname + window.location.search;
  }

  function resetPageScroll() {
    const scrollingElement = document.scrollingElement || document.documentElement;

    if (scrollingElement) {
      scrollingElement.scrollTop = 0;
      scrollingElement.scrollLeft = 0;
    }

    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }

    if (document.body) {
      document.body.scrollTop = 0;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto'
    });

    document.querySelectorAll('.notion-scroller').forEach(function (scroller) {
      scroller.scrollTop = 0;
      scroller.scrollLeft = 0;

      if (typeof scroller.scrollTo === 'function') {
        scroller.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto'
        });
      }
    });
  }



  function createUrl(path) {
    return BASE_URL + '/' + path.replace(/^\/+/, '');
  }

  async function fetchHtml(fileName) {
    const response = await fetch(createUrl(fileName), { cache: 'no-cache' });

    if (!response.ok) {
      throw new Error(createUrl(fileName) + ' 로드 실패: ' + response.status);
    }

    return response.text();
  }

  function fixAssetPaths(container) {
    if (!container) {
      return;
    }

    function convertAssetPath(value) {
      if (!value) {
        return value;
      }

      if (/^(?:https?:|data:|blob:|mailto:|tel:)/i.test(value)) {
        return value;
      }

      const normalized = value
        .replace(/^(?:\.\.\/)+/, '')
        .replace(/^\/+/, '');

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

  function loadScript(path, key) {
    return new Promise(function (resolve, reject) {
      const existing = document.querySelector(
        'script[data-vatos-script="' + key + '"]'
      );

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

  function applyPageClass() {
    const pageClasses = [
      'vatos-page-main',
      'vatos-page-contact',
      'vatos-page-sub',
      'vatos-page-culture',
      'vatos-page-insights',
      'vatos-page-article'
    ];

    pageClasses.forEach(function (className) {
      document.body.classList.remove(className);
    });

    document.body.classList.add('vatos-oopy');

    if (document.querySelector('.vatos-main-hero')) {
      document.body.classList.add('vatos-page-main');
      return 'main';
    }

    if (document.querySelector('.vatos-contact')) {
      document.body.classList.add('vatos-page-contact');
      return 'contact';
    }

    if (document.querySelector('.vatos-culture-bg')) {
      document.body.classList.add(
        'vatos-page-sub',
        'vatos-page-culture'
      );
      return 'culture';
    }

    if (document.querySelector('.vatos-insights-main')) {
      document.body.classList.add(
        'vatos-page-sub',
        'vatos-page-insights'
      );
      return 'insights';
    }

    if (document.querySelector('.vatos-sub-content, .vatos-sub-hero')) {
      document.body.classList.add('vatos-page-sub');
      return 'sub';
    }

    document.body.classList.add('vatos-page-article');
    return 'article';
  }

  function requestPageClassUpdate() {
    window.clearTimeout(pageClassTimer);

    pageClassTimer = window.setTimeout(function () {
      applyPageClass();
    }, 80);
  }

  function handleRouteChange() {
    const nextPageUrl = getPageUrl();

    if (nextPageUrl === currentPageUrl) {
      return false;
    }

    currentPageUrl = nextPageUrl;

    resetPageScroll();
    requestPageClassUpdate();

    return true;
  }

  function observeHistoryNavigation() {
    window.addEventListener('popstate', handleRouteChange);

    ['pushState', 'replaceState'].forEach(function (methodName) {
      const originalMethod = window.history[methodName];

      window.history[methodName] = function () {
        const result = originalMethod.apply(this, arguments);

        handleRouteChange();

        return result;
      };
    });
  }

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
      return;
    }

    document.body.appendChild(container);
  }

  async function initializeVatosPage() {
    try {
      const pageType = applyPageClass();

      const result = await Promise.all([
        fetchHtml('header.html'),
        fetchHtml('footer.html')
      ]);

      insertHeader(result[0]);
      insertFooter(result[1]);

      if (pageType === 'main') {
        await loadScript('assets/vendor/gsap.min.js', 'gsap');
      }

      await loadScript('assets/js/vatos-interact.js', 'vatos-interact');

      observeHistoryNavigation();

    } catch (error) {
      console.error('[VATOS Initialize]', error);
    }
  }


  if (document.readyState === 'complete') {
    window.setTimeout(initializeVatosPage, 300);
  } else {
    window.addEventListener('load', function () {
      window.setTimeout(initializeVatosPage, 300);
    }, { once: true });
  }
})();
