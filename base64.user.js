// ==UserScript==
// @name         Base64 Encoder CORS Bypass & Context Menu
// @namespace    https://github.com/narcolepticinsomniac/base64-encoder
// @version      2026-11-13
// @updateURL    https://github.com/narcolepticinsomniac/base64-encoder/raw/refs/heads/gh-pages/base64.user.js
// @downloadURL  https://github.com/narcolepticinsomniac/base64-encoder/raw/refs/heads/gh-pages/base64.user.js
// @description  Adds right-click "Encode Image to Base64" (with Shadow DOM & Imagus support) + CORS bypass
// @match        *://*/*
// @match        file:///*
// @run-at       document-start
// @grant        GM.xmlHttpRequest
// @grant        GM.openInTab
// @grant        GM_registerMenuCommand
// @connect      *
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAPFBMVEUAAAAAAAAAAAAkJCQxMTH///+Tk5NGRkaenp7r6+vHx8fY2Njz8/NYWFiFhYXh4eFra2t2dna6urqkpKRYtOs9AAAAAnRSTlMCtxGgiZUAAAC7SURBVHgBrI9FAoVQCEUVX3fsf68fDGxH/06IQw7DCC8aPxhR+NAf4CRQ5JC9QCFRCh2N1lygxZwjx0sZLmONRJET0aYzFMQieZkbGdptUUGniloqw2Woz01DkNKCwojhJDcZj41n2CQrYeMZri92NLYVgHSAkV+kVqWUo2IjZliWxqXVyE3x3qnOkHdSk03OuUzVTi9QSRY9fzzo+Eun6PgKqWRCPsKsmn3+DS2ymambhvAAvIkab3YAAGj/Czr+mBsfAAAAAElFTkSuQmCC
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

      if (node.tagName === 'IMG') {
        const src = node.currentSrc || node.src || node.getAttribute('src');
        if (src) return src;
      }

      if (node.shadowRoot) {
        const shadowImg = node.shadowRoot.querySelector('img');
        if (shadowImg && (shadowImg.currentSrc || shadowImg.src)) {
          return shadowImg.currentSrc || shadowImg.src;
        }
      }

      const bg = getComputedStyle(node).backgroundImage;
      if (bg && bg !== 'none' && bg.startsWith('url(')) {
        const match = bg.match(/^url\(["']?(.*?)["']?\)$/);
        if (match && match[1] && !match[1].startsWith('data:image/svg+xml')) {
          return match[1];
        }
      }
    }

    const imagusHost = document.querySelector('imagus-popup, #imagus');
    if (imagusHost) {
      const hoveredLink = document.querySelector('a:hover[href]');
      if (hoveredLink && /\.(jpe?g|png|gif|webp|avif|bmp|ico)(\?.*)?$/i.test(hoveredLink.href)) {
        return hoveredLink.href;
      }
    }

    return '';
  };

  addEventListener('contextmenu', e => {
    const found = extractImageUrl(e);
    if (found) {
      lastRightClickedImg = found;
    } else if (!e.target?.closest?.('imagus-popup, #imagus')) {
      lastRightClickedImg = '';
    }
  }, true);

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Encode Image to Base64', () => {
      const targetImg = lastRightClickedImg || prompt('Enter image URL to encode:');
      if (!targetImg) return;
      const dest = `${ENCODER_URL}?url=${encodeURIComponent(targetImg)}`;
      if (typeof GM !== 'undefined' && GM.openInTab) {
        GM.openInTab(dest, { active: true });
      } else {
        open(dest, '_blank');
      }
    });
  }

  if (!isEncoderPage) return;

  const initBridge = () => {
    postMessage({ type: 'COMPANION_READY' }, '*');

    addEventListener('message', e => {
      if (e.data?.type !== 'FETCH_REMOTE_IMAGE' || !e.data.url) return;

      GM.xmlHttpRequest({
        method: 'GET',
        url: e.data.url,
        responseType: 'blob',
        onload: res => {
          if (res.status < 200 || res.status >= 300) {
            postMessage({
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

          const file = new File([blob], filename, { type: blob.type || 'image/png' });
          postMessage({ type: 'REMOTE_IMAGE_LOADED', file }, '*');
        },
        onerror: () => {
          postMessage({
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
