# Just a New Tab - Privacy Policy / 隱私權保護政策

You can host this Privacy Policy on GitHub Pages, Google Sites, Notion, or your own website, and provide the URL when submitting the extension to the Chrome Web Store and Firefox Add-ons (AMO) store.

---

## 🇹🇼 Traditional Chinese (繁體中文版)

### 《Just a New Tab》隱私權保護政策

本隱私權保護政策（以下簡稱「本政策」）適用於您安裝與使用《Just a New Tab》瀏覽器擴充套件（以下簡稱「本套件」）之行為。

#### 1. 我們不收集、不儲存、不傳輸您的個人資料
我們極度重視您的隱私安全。本套件設計為**本機優先（Offline-First）**架構：
*   **本機儲存**：您所上傳的自訂背景圖片、輸入的用戶名稱、以及您新增的自訂金句、自訂網頁捷徑，全部**僅儲存於您個人電腦瀏覽器的本機資料庫（IndexedDB 與 localStorage）中**。
*   **不對外傳輸**：本套件**不會**將上述任何資料傳送至我們或任何第三方的外部伺服器。我們不具備、亦無法存取您的任何個人資料或瀏覽歷史。

#### 2. 第三方服務與網路請求
本套件僅在您實際使用對應功能時，才會發送匿名的網路請求（Fetch）。各功能與其連線對象如下：

*   **每日金句（啟用「從網路獲取金句」時）**：依您選擇的來源連線至 ZenQuotes API (`https://zenquotes.io/`，繁體中文／英文語系預設，英文語錄)、Hitokoto 一言 API (`https://v1.hitokoto.cn/`，簡體中文語系預設) 或 AnimeChan API (`https://api.animechan.io/`，動漫語錄)。
*   **金句翻譯**：當金句來源為英文、且您使用繁體中文介面時，會將該句子送至 MyMemory 翻譯 API (`https://api.mymemory.translated.net/`) 以轉譯為繁體中文。
*   **RSS 閱讀看板（啟用 RSS 時）**：本套件會向「您自行新增訂閱的 RSS 來源網址」發出請求，以讀取文章標題與連結。由於訂閱網址完全由您決定，此功能需要較廣的網路存取權限；因此該權限被設計為**選用權限（optional）**，僅在您開啟 RSS 功能時才會向您請求授權，預設為關閉。
*   **官方主題包下載（僅在您主動點擊下載時）**：自開發者網站 (`https://yblog.org/`) 下載內含背景圖與金句的主題壓縮包。
*   **網站圖示（Favicon）**：請求 Google Favicon 服務 (`https://www.google.com/s2/favicons`) 以顯示您捷徑的網站圖示。

上述請求均為**完全匿名**的資料抓取請求，本套件不會附帶您的任何身份標識或帳號資料。這些第三方服務可能會記錄標準的伺服器存取日誌（如您的 IP 位址），但這與本套件的開發者無關。

#### 3. 政策修訂
若本套件因功能更新而改變資料處理方式，我們將同步修訂本政策，並更新套件版本。

#### 4. 聯絡我們
如果您對本套件的隱私權政策有任何疑問，歡迎聯絡開發者。

---
---

## 🇺🇸 English (英文版)

### 《Just a New Tab》Privacy Policy

This Privacy Policy explains how 《Just a New Tab》 (referred to as "the extension") handles user data. 

#### 1. No Collection, Storage, or Transmission of Personal Data
Your privacy is our highest priority. The extension is built with an **Offline-First** architecture:
*   **Local Storage Only**: All your personalized data, including uploaded background images, custom username, custom quotes, and quick link shortcuts, are stored **exclusively in your browser's local storage (IndexedDB and localStorage)** on your own device.
*   **No Data Transmission**: The extension **does not** collect, store, or transmit any of your personal data, search queries, or browsing history to our servers or any third parties. We have no access to your data.

#### 2. Third-Party Services and Network Requests
The extension only makes anonymous network requests (Fetch) when you actually use the corresponding feature. Each feature connects as follows:

*   **Daily Quotes (when "Fetch Quotes from Cloud" is enabled)**: Connects to your chosen source — ZenQuotes API (`https://zenquotes.io/`, default for English/Traditional Chinese locales, English quotes), Hitokoto API (`https://v1.hitokoto.cn/`, default for Simplified Chinese), or AnimeChan API (`https://api.animechan.io/`, anime quotes).
*   **Quote Translation**: When an English quote is displayed in a Traditional Chinese interface, the quote text is sent to the MyMemory Translation API (`https://api.mymemory.translated.net/`) to be translated into Traditional Chinese.
*   **RSS Reader (when RSS is enabled)**: The extension fetches article titles and links from the RSS feed URLs **you choose to subscribe to**. Because those URLs are entirely your choice, this feature needs broad network access; that access is declared as an **optional permission**, is off by default, and is requested only when you turn the RSS feature on.
*   **Official Theme Packs (only when you click to download)**: Downloads a theme archive (wallpapers and quotes) from the developer's site (`https://yblog.org/`).
*   **Shortcut Icons (Favicons)**: Requests website favicons from the Google Favicon Service (`https://www.google.com/s2/favicons`) to display icons for your shortcuts.

These requests are **completely anonymous** and carry no personal identifiers or account data from this extension. While these third-party servers may log standard traffic data (like your IP address), this is unrelated to the extension's developer.

#### 3. Policy Changes
We may update this Privacy Policy from time to time to reflect functional updates. Any changes will be published with new versions of the extension.

#### 4. Contact Us
If you have any questions about this Privacy Policy, please contact the developer.
