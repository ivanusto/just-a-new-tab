# Changelog

本專案的版本更新紀錄。格式參考 [Keep a Changelog](https://keepachangelog.com/)。
Notable changes to this project. Format based on [Keep a Changelog](https://keepachangelog.com/).

## [1.58] - 2026-06-17

### 世界時鐘 + 天氣 + 輪播同步金句 / World clock, weather & rotation-synced quotes

**繁中**
- 🕑 **第二時鐘（世界時鐘）**：可在本地時鐘旁加開一個遠端時區時鐘，左右分置，方便對照紐約、倫敦、東京等地時間。內建 20 個常用城市，數字／指針兩種樣式皆支援。並重新設計時鐘「小／標準／大」三段大小，修正「小反而比標準大」的問題，小尺寸現在真的更小。
- 🌤️ **天氣小工具**：以免費的 Open-Meteo 顯示目前氣溫與天氣，**完全不需要瀏覽器定位權限**。天氣顯示在各自時鐘下方：本地天氣需「手動輸入城市」；開啟第二時鐘後，會自動在遠端時鐘下方顯示該城市的天氣。可切換 °C／°F，結果在本機快取 30 分鐘以減少請求。
- 🔁 **輪播時同步換金句**：開啟「自動輪播背景圖片」後，多了一個子選項，可在每次換背景時一併重新隨機一則金句。
- 🔐 新增權限：`api.open-meteo.com`、`geocoding-api.open-meteo.com`（僅天氣功能會用到，預設關閉）。

**English**
- 🕑 **Second (world) clock**: add a remote-timezone clock beside the local one, split left/right, handy for checking New York / London / Tokyo time at a glance. 20 built-in cities; works with both digital and analog styles. The small/standard/large size tiers were also redesigned to fix "small was bigger than standard" — small is now genuinely smaller.
- 🌤️ **Weather widget**: shows the current temperature and condition via the free Open-Meteo API with **no browser geolocation permission required**. Weather appears under each clock: local weather uses a **manually entered city**; when the second clock is on, that city's weather is shown automatically under the remote clock. Toggle °C/°F; results are cached locally for 30 minutes to keep requests low.
- 🔁 **Rotation-synced quotes**: when "Timed wallpaper rotation" is on, a new sub-option re-randomizes the quote together with each background change.
- 🔐 New permissions: `api.open-meteo.com`, `geocoding-api.open-meteo.com` (only used by the weather feature, which is off by default).

## [1.57] - 2026-06-16

### 捷徑圖示放大 / Larger shortcut icons

**繁中**
- 🔼 參考 Firefox 原生新分頁，將捷徑圖示放大，減少框內留白：玻璃圓圈 `44px → 54px`、圖示 `24px → 32px`，首字母 fallback 字級 `1.25rem → 1.5rem`。
- 🔍 favicon 抓取解析度 `sz=64 → sz=128`，放大後仍維持銳利不模糊。
- 未新增任何權限。

**English**
- 🔼 Enlarged the quick-link icons to match Firefox's native new tab and reduce empty space: glass circle `44px → 54px`, icon `24px → 32px`, first-letter fallback `1.25rem → 1.5rem`.
- 🔍 Favicon fetch resolution bumped `sz=64 → sz=128` so icons stay crisp at the larger size.
- No new permissions.

## [1.56] - 2026-06-15

### 提醒時間輸入改善 / Easier reminder time input

**繁中**
- ⏰ 自訂提醒的到期時間改為「**原生日期選擇 + 可自由打字的時間欄**」，取代原本的 `datetime-local`（其逐段、需用上下鍵的操作較不直覺）。現在時間可直接輸入 `9`、`930`、`0930`、`9:30` 等，失焦時自動正規化為 `HH:MM`。
- 🔒 仍做嚴格驗證：時間僅接受數字白名單且限定 0–23 時、0–59 分，無效輸入會被拒絕並提示；資料僅以數字 timestamp 儲存、以 `textContent` 顯示，無注入風險。
- 🏷️ 精簡設定分頁標籤（金句小工具→金句、主題包管理→主題包、提醒與行事曆→提醒/行事曆），並微調字級，讓六個分頁在抽屜中單行不擁擠。
- 未新增任何權限。

**English**
- ⏰ Reminder due time now uses a **native date picker + a free-typed time field** instead of `datetime-local` (whose segmented, arrow-key editing felt clunky). You can type `9`, `930`, `0930`, or `9:30`; it normalizes to `HH:MM` on blur.
- 🔒 Still strictly validated: digits-only whitelist, hours 0–23 / minutes 0–59, invalid input is rejected with a toast. Values are stored as a numeric timestamp and rendered via `textContent`, so there is no injection surface.
- 🏷️ Shortened the settings tab labels (Quotes/Themes; "Reminders & Calendar" → "Agenda"; "RSS Feed" → "RSS") and nudged the font size so all six tabs sit on one line without crowding.
- No new permissions.

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

[1.58]: https://github.com/ivanusto/just-new-tab/releases/tag/v1.58
[1.57]: https://github.com/ivanusto/just-new-tab/releases/tag/v1.57
[1.56]: https://github.com/ivanusto/just-new-tab/releases/tag/v1.56
[1.55]: https://github.com/ivanusto/just-new-tab/releases/tag/v1.55
[1.54]: https://github.com/ivanusto/just-new-tab/releases/tag/v1.54
[1.53]: https://github.com/ivanusto/just-new-tab/releases/tag/v1.53
