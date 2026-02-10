/**
 * Gawain AI — Theme App Extension Video Carousel
 *
 * Fetches deployed videos from the Gawain API and renders
 * a horizontal-scrolling portrait (9:16) video carousel.
 */
(function() {
  'use strict';

  var containers = document.querySelectorAll('.gawain-video-section');
  if (!containers.length) return;

  containers.forEach(function(container) {
    var apiBase = container.getAttribute('data-api-base') || 'https://gawain.nogeass.com';
    var shop = container.getAttribute('data-shop');
    var productId = container.getAttribute('data-product-id');
    var heading = container.getAttribute('data-heading') || '\u30D7\u30ED\u30E2\u30FC\u30B7\u30E7\u30F3\u52D5\u753B';
    var videoWidth = parseInt(container.getAttribute('data-video-width') || '180', 10);

    if (!shop || !productId) {
      container.innerHTML = '';
      return;
    }

    fetch(apiBase + '/api/shopify/storefront-videos?shop=' + encodeURIComponent(shop) + '&productId=' + encodeURIComponent(productId))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data || !data.videos || data.videos.length === 0) {
          container.innerHTML = '';
          return;
        }
        renderCarousel(container, data.videos, heading, videoWidth);
      })
      .catch(function() {
        container.innerHTML = '';
      });
  });

  function renderCarousel(container, videos, heading, videoWidth) {
    var html = '<div class="gawain-carousel-wrapper">';
    html += '<h3 class="gawain-carousel-heading">' + escapeHtml(heading) + '</h3>';
    html += '<div class="gawain-carousel-scroll">';
    html += '<div class="gawain-carousel-track">';

    for (var i = 0; i < videos.length; i++) {
      var v = videos[i];
      html += '<div class="gawain-video-card" style="width:' + videoWidth + 'px">';
      html += '<video src="' + escapeAttr(v.url) + '" autoplay loop muted playsinline class="gawain-video-player"></video>';
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
})();
