// ==UserScript==
// @name         Base64 Encoder CORS Bypass & Context Menu
// @namespace    https://github.com
// @version      1.2
// @description  Adds right-click "Encode Image to Base64" (with Shadow DOM & Imagus support) + CORS bypass
// @match        *://*/*
// @match        file:///*
// @run-at       document-start
// @grant        GM.xmlHttpRequest
// @grant        GM.openInTab
// @grant        GM_registerMenuCommand
// @connect      *
// ==/UserScript==

(() => {
  'use strict';

      // Update this if your hosted or local encoder URL differs
  const ENCODER_URL = 'https://narcolepticinsomniac.github.io/base64-encoder/';
  const isEncoderPage = location.href.startsWith(ENCODER_URL) || location.href.includes('base64-encoder');

  let lastRightClickedImg = '';

  const extractImageUrl = e => {
    const path = typeof e.composedPath === 'function' ? e.composedPath() : [e.target];

    for (const node of path) {
      if (!node || node.nodeType !== 1) continue;

                  // 1. Standard <img> inside document or open Shadow DOM (e.g. Reddit shreddit-app)
      if (node.tagName === 'IMG') {
        const src = node.currentSrc || node.src || node.getAttribute('src');
        if (src) return src;
      }

                  // 2. Check inside an open shadowRoot if e.target was the host element
      if (node.shadowRoot) {
        const shadowImg = node.shadowRoot.querySelector('img');
        if (shadowImg && (shadowImg.currentSrc || shadowImg.src)) {
          return shadowImg.currentSrc || shadowImg.src;
        }
      }

                  // 3. CSS background-image on hovered/popup containers
      const bg = window.getComputedStyle(node).backgroundImage;
      if (bg && bg !== 'none' && bg.startsWith('url(')) {
        const match = bg.match(/^url\(["']?(.*?)["']?\)$/);
        if (match && match[1] && !match[1].startsWith('data:image/svg+xml')) {
          return match[1];
        }
      }
    }

            // 4. Fallback: If Imagus popup is open (even with a closed shadow root), grab its active link or hovered thumbnail
    const imagusHost = document.querySelector('imagus-popup, #imagus');
    if (imagusHost) {
      const hoveredLink = document.querySelector('a:hover[href]');
      if (hoveredLink && /\.(jpe?g|png|gif|webp|avif|bmp|ico)(\?.*)?$/i.test(hoveredLink.href)) {
        return hoveredLink.href;
      }
    }

    return '';
  };

      // Capture phase at document-start ensures we run before site/extension handlers stop propagation
  window.addEventListener('contextmenu', e => {
    const found = extractImageUrl(e);
    if (found) {
      lastRightClickedImg = found;
    } else if (!e.target?.closest?.('imagus-popup, #imagus')) {
                  // Only clear previous URL if user clearly right-clicked outside an Imagus popup
      lastRightClickedImg = '';
    }
  }, true);

      // Register Tampermonkey context menu command
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Encode Image to Base64', () => {
      const targetImg = lastRightClickedImg || prompt('Enter image URL to encode:');
      if (!targetImg) return;
      const dest = `${ENCODER_URL}?url=${encodeURIComponent(targetImg)}`;
      if (typeof GM !== 'undefined' && GM.openInTab) {
        GM.openInTab(dest, {active: true});
      } else {
        window.open(dest, '_blank');
      }
    });
  }

      // Encoder Page CORS-Bypass Bridge (waits for DOM since script runs at document-start)
  if (!isEncoderPage) return;

  const initBridge = () => {
    window.postMessage({type: 'COMPANION_READY'}, '*');

    window.addEventListener('message', e => {
      if (e.data?.type !== 'FETCH_REMOTE_IMAGE' || !e.data.url) return;

      GM.xmlHttpRequest({
        method: 'GET',
        url: e.data.url,
        responseType: 'blob',
        onload: res => {
          if (res.status < 200 || res.status >= 300) {
            window.postMessage({
              type: 'REMOTE_IMAGE_ERROR',
              error: `Server responded with HTTP ${res.status}`,
            }, '*');
            return;
          }

          const blob = res.response;
          let filename = 'remote-image.png';
          try {
            const extracted = new URL(e.data.url).pathname.split('/').pop();
            if (extracted) filename = extracted;
          } catch {}

          const file = new File([blob], filename, {type: blob.type || 'image/png'});
          window.postMessage({type: 'REMOTE_IMAGE_LOADED', file}, '*');
        },
        onerror: () => {
          window.postMessage({
            type: 'REMOTE_IMAGE_ERROR',
            error: 'Network error or blocked request.',
          }, '*');
        },
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBridge);
  } else {
    initBridge();
  }
})();
