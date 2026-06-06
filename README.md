# Just New Tab

自訂新分頁瀏覽器擴充套件，提供時鐘、問候語、搜尋框、捷徑、每日金句、背景圖庫、主題包匯入與 RSS 看板。

## 專案結構

| 資料夾 | 平台 | 說明 |
| --- | --- | --- |
| `just-new-tab/` | Firefox (Gecko) | 含 `browser_specific_settings`，Manifest V3 |
| `just-new-tab-chrome/` | Chrome / Edge | Chromium 版 Manifest V3 |

兩個資料夾的 `newtab.html`、`newtab.css`、`newtab.js`、`db.js`、`_locales/` 為共用內容，需保持一致；差異僅在 `manifest.json`。

## 主要檔案

- `newtab.html` / `newtab.css` / `newtab.js` — 新分頁主頁面與邏輯
- `db.js` — IndexedDB 背景圖儲存
- `jszip.min.js` — 主題包 ZIP 解析（vendored）
- `_locales/{en,zh_TW,zh_CN}/messages.json` — i18n 字串

## 本機開發 / 載入測試

- Chrome：`chrome://extensions` → 開啟開發者模式 → 載入未封裝項目 → 選 `just-new-tab-chrome/`
- Firefox：`about:debugging` → 此 Firefox → 載入臨時附加元件 → 選 `just-new-tab/manifest.json`

## 修改共用檔案後的同步

修改 `just-new-tab/` 的共用檔案後，複製到 `just-new-tab-chrome/`（manifest 除外），並用 `node --check newtab.js` 驗證語法。

## 版本

目前版本：1.46（定義於各自的 `manifest.json`）
