# 上架送審說明 / Store Submission Reference

可直接複製到 Chrome Web Store 與 Firefox AMO 後台的欄位文字。建議用英文填寫權限 justification（審核員主要看英文），下方另附中文對照。

> **重點：v1.55 未新增任何權限**（僅放寬圖片上傳上限並加入自動縮圖，純前端處理）。v1.54 曾新增「一個選用權限」`topSites`（用於「匯入常用網站」，預設不索取、按下匯入才請求）；v1.52 / v1.53 未新增任何權限；行事曆沿用既有的 `optional_host_permissions`、提醒事項不需任何權限。全程未使用遠端程式碼，亦無任何資料外傳。

---

## 此版本更新內容 / What's New（版本更新欄）

**繁中**
> v1.55：背景圖片單張上傳上限提高至 25MB，並新增「上傳時自動縮圖」（預設開啟，超過 4K 自動等比縮小以節省空間，可關閉）。未新增任何權限。

**English**
> v1.55: Wallpaper upload limit raised to 25MB per image, plus a new "auto-downscale on upload" option (on by default; images over 4K are scaled down to save space, and it can be turned off). No new permissions.

完整更新紀錄見 [CHANGELOG.md](../CHANGELOG.md)。

---

## Chrome Web Store

### Single purpose（單一用途）
> A customizable new tab page that replaces the default new tab with a clock, greeting, search box, quick links, daily quotes, wallpaper gallery, and optional RSS, reminders, and calendar widgets.

### Permission justifications

**`storage`**
> Stores the user's personalization locally: settings, quick links, custom quotes, reminders, RSS/calendar subscriptions, and UI preferences. No data leaves the device.

**`unlimitedStorage`**
> Users can upload their own wallpapers, which are stored as blobs in IndexedDB. unlimitedStorage prevents these local images from hitting the default quota. Images never leave the device.

**Host permissions — fixed API domains** (`zenquotes.io`, `v1.hitokoto.cn`, `api.mymemory.translated.net`, `api.animechan.io`, `yblog.org`)
> Used only when the matching feature is active: fetching daily quotes (ZenQuotes / Hitokoto / AnimeChan), translating English quotes for a Chinese UI (MyMemory), and downloading optional official theme packs (yblog.org). Requests are anonymous.

**`optional_host_permissions` (`http://*/*`, `https://*/*`)** — broad, but requested at runtime only
> Broad host access is NOT granted at install. It is requested via `chrome.permissions.request` only on a user gesture, in two cases: (1) enabling the RSS reader, to fetch the user's chosen feed URLs; (2) adding an ICS calendar subscription, to fetch the user's private iCal URL. Because these URLs are entirely user-supplied and can be on any domain, a narrow host list isn't possible. Permission is released when the user removes the subscription. Both features are off by default.

**`topSites`** (optional permission) — requested at runtime only
> Used solely for the "Import top sites" helper in Quick Links: when the user clicks Import, the extension reads their most-visited / pinned sites so they can pick which to add as shortcuts. Declared in `optional_permissions` and requested via `chrome.permissions.request` only at that moment — never at install. The list is shown locally and is not transmitted anywhere.

### Remote code（是否使用遠端程式碼）
> **No.** All logic is bundled; ZIP theme parsing uses the browser's native `DecompressionStream` (no eval/Function, no third-party library).

### Data usage（資料用途聲明）
> The extension does **not** collect, transmit, or sell any personal or user data. All personalization is stored locally. Network requests go only to the endpoints above and carry no identifiers.

### 中文對照（重點）
- `storage`：本機儲存使用者設定、捷徑、金句、提醒、RSS/行事曆訂閱與偏好，資料不外傳。
- `unlimitedStorage`：使用者自訂背景圖以 blob 存於 IndexedDB，避免受預設配額限制；圖片不離開裝置。
- 固定 host 權限：僅在對應功能啟用時，向金句／翻譯／動漫語錄 API 與官方主題下載站（yblog.org）發出匿名請求。
- `optional_host_permissions`（廣域 http/https）：安裝時不授予，僅在使用者「開啟 RSS」或「新增行事曆訂閱」的點擊當下動態索取，因訂閱／行事曆網址由使用者自填、可能位於任何網域，無法窄化；刪除訂閱即釋出。兩項功能皆預設關閉。
- `topSites`（選用權限）：僅用於捷徑的「匯入常用網站」，按下匯入當下才索取，讀取常用／釘選網站供使用者勾選加入；清單僅於本機顯示、不外傳。
- 未使用遠端程式碼；不收集、不傳輸、不販售任何個人資料。

---

## Firefox AMO（Notes to reviewer）

> This version (1.54) adds one **optional** permission, `topSites`, for the "Import top sites" helper in Quick Links. It is declared in `optional_permissions` and requested via `browser.permissions.request` only when the user clicks Import; it reads the user's most-visited / pinned sites so they can choose which to add as shortcuts. The list is shown locally and is never transmitted. (Earlier features — backup/restore, reminders, read-only ICS calendar — added no new permissions.)
>
> About `optional_host_permissions` (`http://*/*`, `https://*/*`): this is not requested at install. `browser.permissions.request` is called only on a user gesture when the user (a) enables the RSS reader or (b) adds an ICS calendar subscription, to fetch user-supplied feed/calendar URLs that may be on any domain. It is removed when the subscription is deleted. Both features default to OFF.
>
> No remote code is executed; ZIP theme packages are parsed with the native `DecompressionStream`. No analytics, ads, or trackers. All user data stays on the device; the manifest declares `data_collection_permissions: { required: ["none"] }`, which remains accurate — reminders are local-only, the ICS calendar only fetches the user's own private URL (read-only), and top-sites data is shown locally without being sent anywhere.

---

## 送審前檢查清單 / Pre-submission checklist

- [ ] 兩個 `manifest.json` 版本一致（目前 1.53）
- [ ] `python package_zip.py` 重新產生 `dist/` 封裝包
- [ ] Chrome：上傳 `dist/just-a-new-tab-chrome-v<ver>.zip`
- [ ] Firefox：上傳 `dist/just-a-new-tab-firefox-v<ver>.xpi`
- [ ] 填入上方「此版本更新內容」與權限 justification
- [ ] 隱私權政策網址（內容見 `privacy_policy.md`）
- [ ] 商店描述（內容見 `store_description.md`）
