# Changelog

本專案的版本更新紀錄。格式參考 [Keep a Changelog](https://keepachangelog.com/)。
Notable changes to this project. Format based on [Keep a Changelog](https://keepachangelog.com/).

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

[1.53]: https://github.com/ivanusto/just-new-tab/releases/tag/v1.53
