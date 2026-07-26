// Just a New Tab - Backup & Restore Module
import { settings, quickLinks, saveSettings, isChineseUser } from './storage.js';
import { showToast } from './uiDrawer.js';

const BACKUP_FORMAT = "just-new-tab-backup";

export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function dataURLToBlob(dataURL) {
  const commaIdx = dataURL.indexOf(",");
  const header = dataURL.substring(0, commaIdx);
  const body = dataURL.substring(commaIdx + 1);
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function initBackupRestore() {
  const exportBtn = document.getElementById("btn-export-backup");
  const importBtn = document.getElementById("btn-import-backup");
  const fileInput = document.getElementById("backup-file-input");
  if (!exportBtn || !importBtn || !fileInput) return;

  exportBtn.addEventListener("click", exportBackup);
  importBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async (e) => {
    if (e.target.files && e.target.files[0]) {
      await importBackup(e.target.files[0]);
    }
    fileInput.value = "";
  });
}

export async function exportBackup() {
  showToast(isChineseUser ? "正在準備備份檔，請稍候..." : "Preparing backup, please wait...");
  try {
    let wallpapers = [];
    try {
      if (window.justDB) {
        const all = await window.justDB.getAllWallpapers();
        wallpapers = await Promise.all(all.map(async (w) => ({
          id: w.id,
          name: w.name,
          addedAt: w.addedAt,
          active: w.active,
          packageId: w.packageId || null,
          packageName: w.packageName || null,
          data: await blobToDataURL(w.blob)
        })));
      }
    } catch (err) {
      console.error("Failed to read wallpapers for backup:", err);
    }

    const backup = {
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: Date.now(),
      settings: settings,
      quickLinks: quickLinks,
      wallpapers: wallpapers
    };

    const json = JSON.stringify(backup);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    a.href = url;
    a.download = `just-new-tab-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast(isChineseUser
      ? `備份完成！已匯出設定與 ${wallpapers.length} 張背景圖片。`
      : `Backup ready! Exported settings and ${wallpapers.length} wallpapers.`);
  } catch (err) {
    console.error("Backup export failed:", err);
    showToast(isChineseUser ? "匯出備份失敗" : "Failed to export backup");
  }
}

export async function importBackup(file) {
  if (!file) return;

  if (file.size > 200 * 1024 * 1024) {
    showToast(isChineseUser ? "備份檔過大 (大於 200MB)，已拒絕載入" : "Backup file is too large (max 200MB)");
    return;
  }

  let backup;
  try {
    const text = await file.text();
    backup = JSON.parse(text);
  } catch (err) {
    showToast(isChineseUser ? "無法讀取備份檔 (格式錯誤)" : "Could not read backup file (invalid format)");
    return;
  }

  if (!backup || backup.format !== BACKUP_FORMAT || !backup.settings) {
    showToast(isChineseUser ? "這不是有效的 Just a New Tab 備份檔" : "Not a valid Just a New Tab backup file");
    return;
  }

  const confirmMsg = isChineseUser
    ? "還原備份將「覆蓋」目前所有設定、捷徑、金句與背景圖片，確定要繼續嗎？"
    : "Restoring will OVERWRITE all current settings, shortcuts, quotes and wallpapers. Continue?";
  if (!window.confirm(confirmMsg)) return;

  showToast(isChineseUser ? "正在還原備份，請稍候..." : "Restoring backup, please wait...");

  try {
    const idMap = {};
    if (Array.isArray(backup.wallpapers) && window.justDB) {
      try {
        if (typeof window.justDB.clearAllWallpapers === "function") {
          await window.justDB.clearAllWallpapers();
        }
      } catch (err) {
        console.error("Failed to clear existing wallpapers:", err);
      }
      for (const w of backup.wallpapers) {
        try {
          const blob = dataURLToBlob(w.data);
          const newId = await window.justDB.addWallpaper(w.name, blob, w.packageId || null, w.packageName || null);
          if (w.id !== undefined && w.id !== null) idMap[w.id] = newId;
        } catch (err) {
          console.error("Failed to restore a wallpaper:", err);
        }
      }
    }

    Object.assign(settings, backup.settings);
    if (Array.isArray(backup.quickLinks)) {
      quickLinks.length = 0;
      quickLinks.push(...backup.quickLinks);
    }

    if (Array.isArray(settings.activeCustoms)) {
      settings.activeCustoms = settings.activeCustoms
        .map((oldId) => idMap[oldId])
        .filter((id) => id !== undefined && id !== null);
    }

    await saveSettings();

    showToast(isChineseUser ? "還原成功！即將重新載入..." : "Restore complete! Reloading...");
    setTimeout(() => location.reload(), 1200);
  } catch (err) {
    console.error("Backup import failed:", err);
    showToast(isChineseUser ? "還原備份失敗" : "Failed to restore backup");
  }
}
