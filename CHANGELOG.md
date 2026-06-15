# Changelog

本專案的版本更新紀錄。格式參考 [Keep a Changelog](https://keepachangelog.com/)。
Notable changes to this project. Format based on [Keep a Changelog](https://keepachangelog.com/).

## [1.55] - 2026-06-15

### 放寬圖片上限 + 自動縮圖 / Higher image limit + auto-downscale

**繁中**
- 🖼️ 單張背景圖片上傳上限 **12MB → 25MB**；主題包 ZIP 內每張圖同步調為 25MB、ZIP 總大小 50MB → 100MB。
- 新增「上傳時自動縮圖」選項（**預設開啟**）：超過 4K（長邊 3840px）的圖片會在存入前自動等比縮小以節省空間；PNG 維持 PNG、其餘輸出 JPEG；已夠小的圖片保持原檔不動。可於背景設定關閉以保留原圖。
- 未新增任何權限。

**English**
- 🖼️ Single wallpaper upload limit raised **12MB → 25MB**; ZIP theme per-image limit matched to 25MB and total ZIP size 50MB → 100MB.
- New "auto-downscale on upload" option (**on by default**): images larger than 4K (3840px long edge) are scaled down before storage to save space; PNG stays PNG, others become JPEG; already-small images are kept untouched. Can be turned off in wallpaper settings to keep originals.
- No new permissions.

## [1.54] - 2026-06-15

### 從瀏覽器匯入常用網站 / Import Top Sites

**繁中**
- 🔗 捷徑設定新增「從瀏覽器匯入常用網站」：透過瀏覽器 `topSites` API 讀取常用／釘選網站，於對話框勾選後一鍵加入捷徑（自動與既有捷徑去重）。
- 採**選用權限（`optional_permissions: ["topSites"]`）**，預設不索取，僅在按下匯入的當下才請求；清單僅於本機顯示、不外傳。
- 限制：Chrome 僅能提供「最常造訪」網站，無法讀取官方新分頁手動釘選的捷徑磚；Firefox 另含使用者釘選的 Top Sites。

**English**
- 🔗 Quick Links can now "Import top sites from browser": reads most-visited / pinned sites via the browser `topSites` API and adds the selected ones in one click (de-duplicated against existing links).
- Uses an **optional permission** (`optional_permissions: ["topSites"]`), never requested at install — only when you click Import. The list is shown locally and never uploaded.
- Limitation: Chrome only exposes most-visited sites (not the tiles you manually pinned on the official new tab); Firefox additionally includes your pinned Top Sites.

## [1.53] - 2026-06-15

### 提醒事項與行事曆 / Reminders & Calendar

**繁中**
- 新增「提醒與行事曆」設定分頁與新分頁左上角議程卡片（兩者皆預設關閉）。
- 📝 **本地提醒**：新增待辦/提醒，可選填到期時間，逾期醒目標示；純本機儲存，不發送任何網路請求。
- 📅 **行事曆訂閱（ICS，唯讀）**：貼上 Google／Outlook／Apple 的 iCal 私密網址，即可一覽近期 14 天行程，支援重複事件（每日／每週／每月／每年）。30 分鐘快取；僅在新增訂閱時才針對該網址的網域動態索取存取權限，刪除時釋出。
- 未新增任何固定權限。

**English**
- New "Reminders & Calendar" settings tab and a top-left agenda card (both off by default).
- 📝 **Local reminders** with optional due time and overdue highlighting; stored locally, no network requests.
- 📅 **Read-only ICS calendar**: paste a private iCal URL (Google/Outlook/Apple) to see the next 14 days, including recurring events. 30-minute cache; host access is requested only for that URL's domain when you add it, and released on delete.
- No new static permissions.

## [1.52] - 2026-06-15

### 設定備份與還原 / Backup & Restore

**繁中**
- 💾 新增「設定備份與還原」（位於「一般設定」分頁）。
- 一鍵將所有設定、捷徑、自訂金句、RSS 訂閱與背景圖片（IndexedDB）匯出成單一 JSON 檔。
- 可在其他裝置或重灌後一鍵還原（還原前會跳確認），自動重新對應背景圖。無需登入、不經雲端。

**English**
- 💾 Added "Backup & Restore" (in the General settings tab).
- Export all settings, shortcuts, custom quotes, RSS subscriptions, and wallpapers (IndexedDB) to a single JSON file.
- Restore on another device or after a reinstall (with a confirm prompt); wallpaper references are remapped automatically. No sign-in, no cloud.

[1.55]: https://github.com/ivanusto/just-new-tab/releases/tag/v1.55
[1.54]: https://github.com/ivanusto/just-new-tab/releases/tag/v1.54
[1.53]: https://github.com/ivanusto/just-new-tab/releases/tag/v1.53
