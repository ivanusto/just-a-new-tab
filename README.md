# Just a New Tab

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
- `_locales/{en,zh_TW,zh_CN}/messages.json` — i18n 字串

主題包 ZIP 解析改用瀏覽器原生 `DecompressionStream`（`newtab.js` 內的 `readZip`），不再依賴第三方函式庫。

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

## 權限設計

- `host_permissions`：僅列出金句／翻譯／官方主題等固定 API 網域（窄範圍，利於商店審核）。
- `optional_host_permissions`：`http://*/*`、`https://*/*`，**僅在使用者於設定中開啟 RSS 時才動態索取**（用於抓取任意訂閱來源）。
- 預設行為：RSS 看板預設關閉、捷徑預設以「新分頁」開啟，使用者可自行調整。

## 版本

目前版本：1.51（定義於各自的 `manifest.json`）
