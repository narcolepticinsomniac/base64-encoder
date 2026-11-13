# Base64 File Encoder

A lightweight, self-contained, single-file Base64 Data URI encoder with smart image compression, automatic metadata stripping, persistent storage, and an optional Tampermonkey companion script for CORS-free right-click encoding from anywhere on the web.

🔗 **Live Demo:** [https://narcolepticinsomniac.github.io/base64-encoder/](https://narcolepticinsomniac.github.io/base64-encoder/)  
📦 **Companion Userscript:** [Install `base64.user.js`](https://github.com/narcolepticinsomniac/base64-encoder/raw/refs/heads/gh-pages/base64.user.js)

---

## ✨ Features

### Image Processing & Optimization
* **Multi-Format Base64 Encoding:** Encode any image or file (up to 10 MB) into a clean Base64 Data URI directly in your browser.
* **Smart `0%` (Original / Lossless) Mode:**
  * **Raster Pass-Through:** Keeps `JPEG`, `WebP`, `GIF`, and `AVIF` files byte-for-byte untouched at `0%` compression so already-optimized images never inflate in size.
  * **PNG Metadata Stripping:** Automatically strips non-essential chunks (`iCCP`, `eXIf`, `tEXt`, `zTXt`, `iTXt`, `pHYs`, `tIME`) from PNGs at `0%` without re-encoding.
  * **SVG to PNG Rasterization:** Converts `SVG` files into clean, scaled PNG Data URIs at `0%`.
* **Lossy WebP Compression (`1%–100%`):** Slide above `0%` to convert images into optimized WebP and strip embedded `ICCP` color profile bloat.
* **Max Dimension Scaling:** Automatically downscale large assets to `2048px`, `1024px`, `512px`, `128px`, or keep `Original` dimensions while preserving aspect ratio.
* **Live Re-Encoding:** Moving the compression slider or changing the max dimension updates all active items in real time.

### Input & Workflow
* **Multiple Input Methods:** Drag and drop files anywhere onto the page, use the file picker, paste images or URLs directly from your clipboard (`Ctrl+V` / `Cmd+V`), or pass `?url=<image-url>` in the query string.
* **One-Click Copy & Export:**
  * Copy the raw Data URI or copy it pre-wrapped as `background-image: url(...);` for CSS.
  * Non-shifting floating tooltips (`Copied!` / `CSS Copied!`) confirm clipboard actions cleanly.
  * Download the processed/converted image directly to disk.
* **Size & Savings Telemetry:** Displays the final Base64 size alongside exact KB and percentage saved (or added) compared to the original file, highlighting URIs over `100 KB`.
* **Offline & Session Persistence:** Remembers your compression and dimension settings in `localStorage` and stores your active queue in `IndexedDB` across reloads.

---

## 🧩 Companion Userscript (CORS Bypass & Context Menu)

Browsers block cross-origin `fetch()` requests for many external image URLs. Installing the companion userscript adds a right-click menu command across all websites and bridges remote image fetching via `GM.xmlHttpRequest`.

### Userscript Capabilities
* **Right-Click Context Menu:** Right-click any image and open the Tampermonkey menu to select **Encode Image to Base64**.
* **Shadow DOM & Popup Support:** Detects standard `<img>` tags, open Shadow DOM elements (such as Reddit's `shreddit-app`), CSS `background-image` styles, and **Imagus** hover popups.
* **Live Bridge Indicator:** When active, the encoder header displays a **CORS Bridge Active** badge and seamlessly fetches pasted or context-menu image URLs without CORS errors.

### Installation
1. Install [Tampermonkey](https://www.tampermonkey.net/) (or a compatible userscript manager).
2. Click here to install directly: **[Install base64.user.js](https://github.com/narcolepticinsomniac/base64-encoder/raw/refs/heads/gh-pages/base64.user.js)**.
3. By default, `ENCODER_URL` points to `https://narcolepticinsomniac.github.io/base64-encoder/`. If running a local copy of `index.html`, update `ENCODER_URL` near the top of the userscript:
   ```javascript
   const ENCODER_URL = 'https://narcolepticinsomniac.github.io/base64-encoder/';
   // Or for local usage:
   // const ENCODER_URL = 'file:///C:/Users/YourName/Downloads/index.html';
   ```

---

## 🚀 Usage

1. Open `index.html` locally in any modern browser or visit the [GitHub Pages deployment](https://narcolepticinsomniac.github.io/base64-encoder/).
2. Set your desired **Compression** level and **Max Dimension** cap.
3. Drag and drop images, paste from your clipboard, or right-click an image on any site using the companion userscript.
4. Click the copy icon for the raw Data URI, **Copy CSS** for a ready-to-use `background-image` property, or the download icon to save the converted file.

---

## 🔒 Privacy

All image decoding, resizing, metadata stripping, and Base64 encoding happens **100% locally in your browser** using HTML5 `<canvas>`, `FileReader`, and `IndexedDB`. No files are ever uploaded to an external server.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
