/**
 * Gawain AI — Theme App Extension Video Carousel
 *
 * Fetches deployed videos from the Gawain API and renders
 * a horizontal-scrolling portrait (9:16) video carousel.
 *
 * Handles:
 * - Product pages (shows videos for that product)
 * - Non-product pages (shows all shop videos)
 * - Dynamic block insertion in theme editor (MutationObserver)
 */
(function() {
  'use strict';

  var INIT_ATTR = 'data-gawain-initialized';

  function initContainer(container) {
    if (container.getAttribute(INIT_ATTR)) return;
    container.setAttribute(INIT_ATTR, '1');

    var apiBase = (container.getAttribute('data-api-base') || 'https://gawain.nogeass.com').replace(/\/+$/, '');
    var shop = container.getAttribute('data-shop');
    var productId = container.getAttribute('data-product-id');
    var heading = container.getAttribute('data-heading') || '\u30D7\u30ED\u30E2\u30FC\u30B7\u30E7\u30F3\u52D5\u753B';
    var videoWidth = parseInt(container.getAttribute('data-video-width') || '180', 10);

    if (!shop) {
      container.innerHTML = '<p style="color:#999;text-align:center;padding:1rem;">Shop domain not available.</p>';
      return;
    }

    // Show loading state
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">\u8AAD\u307F\u8FBC\u307F\u4E2D...</div>';

    // Build URL — productId is optional
    var url = apiBase + '/api/shopify/storefront-videos?shop=' + encodeURIComponent(shop);
    if (productId) {
      url += '&productId=' + encodeURIComponent(productId);
    }

    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data || !data.videos || data.videos.length === 0) {
          container.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">' +
            escapeHtml(heading) + '<br><span style="font-size:0.85rem;">\u52D5\u753B\u304C\u307E\u3060\u914D\u7F6E\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002</span></div>';
          return;
        }
        renderCarousel(container, data.videos, heading, videoWidth);
      })
      .catch(function(err) {
        console.error('Gawain video fetch error:', err);
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">' +
          escapeHtml(heading) + '<br><span style="font-size:0.85rem;">\u52D5\u753B\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002</span></div>';
      });
  }

  function renderCarousel(container, videos, heading, videoWidth) {
    var videoHeight = Math.round(videoWidth * 16 / 9);
    var html = '<div class="gawain-carousel-wrapper">';
    html += '<h3 class="gawain-carousel-heading">' + escapeHtml(heading) + '</h3>';
    html += '<div class="gawain-carousel-scroll">';
    html += '<div class="gawain-carousel-track">';

    for (var i = 0; i < videos.length; i++) {
      var v = videos[i];
      html += '<div class="gawain-video-card" style="width:' + videoWidth + 'px">';
      html += '<video src="' + escapeAttr(v.url) + '" autoplay loop muted playsinline class="gawain-video-player" style="width:' + videoWidth + 'px;height:' + videoHeight + 'px;"></video>';
      if (v.title) {
        html += '<div class="gawain-video-title">' + escapeHtml(v.title) + '</div>';
      }
      html += '</div>';
    }

    html += '</div></div></div>';
    container.innerHTML = html;
  }

  function escapeAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initAll() {
    var containers = document.querySelectorAll('.gawain-video-section:not([' + INIT_ATTR + '])');
    containers.forEach(initContainer);
  }

  // Init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Watch for dynamically added blocks (theme editor)
  if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function(mutations) {
      var found = false;
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (added[j].nodeType === 1) {
            if (added[j].classList && added[j].classList.contains('gawain-video-section')) {
              found = true;
            } else if (added[j].querySelector && added[j].querySelector('.gawain-video-section')) {
              found = true;
            }
          }
        }
      }
      if (found) initAll();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
