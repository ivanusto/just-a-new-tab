# Just a New Tab

自訂新分頁瀏覽器擴充套件，提供時鐘、問候語、搜尋框、捷徑、每日金句、背景圖庫、主題包匯入、RSS 看板、提醒事項與行事曆（ICS），並支援設定一鍵備份匯出／還原。

## 專案結構

| 資料夾 | 平台 | 說明 |
| --- | --- | --- |
| `just-new-tab/` | Firefox (Gecko) | 含 `browser_specific_settings`，Manifest V3 |
| `just-new-tab-chrome/` | Chrome / Edge | Chromium 版 Manifest V3 |

兩個資料夾的 `newtab.html`、`newtab.css`、`newtab.js`、`db.js`、`_locales/` 為共用內容，需保持一致；差異僅在 `manifest.json`。

## 主要檔案

- `newtab.html` / `newtab.css` / `newtab.js` — 新分頁主頁面與邏輯
- `db.js` — IndexedDB 背景圖儲存
- `_locales/{en,zh_TW,zh_CN}/messages.json` — i18n 字串

主題包 ZIP 解析改用瀏覽器原生 `DecompressionStream`（`newtab.js` 內的 `readZip`），不再依賴第三方函式庫。

## 功能模組

各小工具皆透過 `settings.widgets.*` 開關 + `applyWidgetVisibility()` 控制顯示，逐項變更即時存檔（`saveSettings()`）。

- **設定備份／還原**（`newtab.js` 的 `exportBackup` / `importBackup`）：將 `settings`、捷徑與 IndexedDB 背景圖（base64）匯出為單一 JSON；還原時會重新對應背景圖 id 並重載。匯入/匯出皆於本機完成，無需登入或雲端。
- **提醒事項**（Tier 1）：純本機待辦/提醒（`settings.reminders`），可選填到期時間，不發送任何網路請求。
- **行事曆（ICS）**（Tier 2）：貼上 iCal 私密網址，唯讀顯示近期 14 天行程。內含自寫 ICS 解析器（折行還原、全天/UTC/本地時間、`RRULE` 展開：`DAILY` / `WEEKLY`+`BYDAY` / `MONTHLY` / `YEARLY`，支援 `COUNT`/`UNTIL`/`INTERVAL`），30 分鐘快取，並在新增訂閱時才針對該網域動態索取存取權限。

提醒與行事曆共用左上角的 `#agenda-widget` 卡片，兩者皆預設關閉。

- **匯入常用網站**（`newtab.js` 的 `initTopSitesImport`）：透過瀏覽器 `topSites` API 讀取常用／釘選網站，預覽勾選後加入捷徑（與既有捷徑去重）。採選用權限 `topSites`，按下匯入才索取。Chrome 僅能取得「最常造訪」、Firefox 另含釘選 Top Sites。
- **背景圖片上傳**（`handleUploadedFiles` / `downscaleImageBlob`）：單張上限 25MB；「上傳時自動縮圖」預設開啟，超過 4K（長邊 3840px）會等比縮小後存入 IndexedDB（PNG 維持 PNG、其餘輸出 JPEG），可於背景設定關閉以保留原圖。

## 本機開發 / 載入測試

- Chrome：`chrome://extensions` → 開啟開發者模式 → 載入未封裝項目 → 選 `just-new-tab-chrome/`
- Firefox：`about:debugging` → 此 Firefox → 載入臨時附加元件 → 選 `just-new-tab/manifest.json`

## 修改共用檔案後的同步

`just-new-tab/` 為共用檔案的「來源」。修改後執行 `./sync.sh`，會自動把共用檔案（`manifest.json` 除外）複製到 `just-new-tab-chrome/`，確保兩邊一致。

## 主題包打包

每個主題包為一個獨立的頂層資料夾，內含背景圖（`bg*.jpg` / `bg*.png`）與 `quotes.txt`。執行 `./package-themes.sh` 會把每個「已備妥背景圖」的資料夾打包成根目錄的 `<資料夾>.zip`（檔案置於 zip 根層，與既有的 `nature_zen.zip`、`christian_pack.zip` 一致）。尚未放入背景圖的資料夾會自動略過。

```bash
./package-themes.sh                 # 打包所有已備妥的主題包
./package-themes.sh pets gaming     # 只打包指定資料夾
```

打包完成後：將 `.zip` 上傳至下載主機，再於 `just-new-tab/newtab.js` 的 `OFFICIAL_THEMES` 加入對應項目並執行 `./sync.sh`。產生的 `.zip` 已被 `.gitignore` 排除。

## 上架封裝

產生兩個商店上架包（Chrome `.zip`／Firefox `.xpi`，`manifest.json` 置於壓縮包根層、排除 `*.md` 與系統暫存檔）：

```bash
./package.sh            # 需要系統有 zip 指令
python package_zip.py   # Windows 無 zip 時的替代方案（純 Python）
```

輸出至 `dist/`（已被 `.gitignore` 排除）。

## 權限設計

- `host_permissions`：僅列出金句／翻譯／官方主題等固定 API 網域（窄範圍，利於商店審核）。
- `optional_host_permissions`：`http://*/*`、`https://*/*`，**僅在使用者於設定中開啟 RSS，或新增行事曆（ICS）訂閱時才動態索取**（用於抓取任意訂閱來源／行事曆網址；行事曆會針對該網址的網域請求，刪除時釋出）。
- `optional_permissions`：`topSites`，**僅在使用者按下「從瀏覽器匯入常用網站」時才動態索取**；清單僅於本機顯示、不外傳。
- 預設行為：RSS 看板、提醒事項、行事曆皆預設關閉；捷徑預設以「新分頁」開啟，使用者可自行調整。

## 版本

目前版本：1.58（定義於各自的 `manifest.json`）
