// Just a New Tab - Backgrounds & Themes Module (with native DecompressionStream zip parser)
import { DEFAULT_BG_COUNT, OFFICIAL_THEMES } from './config.js';
import { settings, saveSettings, isChineseUser } from './storage.js';
import { showToast } from './uiDrawer.js';

let activeBgBlobUrl = null;
let currentActiveLayer = 1;
let thumbBlobUrls = [];

export async function setRandomBackground() {
  const activeDefaults = settings.activeDefaults;
  const activeCustoms = settings.activeCustoms;
  const hiddenDefaults = settings.hiddenDefaults || [];
  
  let allCustoms = [];
  try {
    if (window.justDB) {
      allCustoms = await window.justDB.getAllWallpapers();
    }
  } catch (err) {
    console.error("Failed to read from IndexedDB:", err);
  }
  
  const pool = [];
  
  activeDefaults.forEach(id => {
    if (!hiddenDefaults.includes(id)) {
      pool.push({ type: "default", id: id, path: `images/bg${id}.jpg` });
    }
  });
  
  allCustoms.forEach(item => {
    if (activeCustoms.includes(item.id)) {
      pool.push({ type: "custom", id: item.id, blob: item.blob });
    }
  });
  
  if (pool.length === 0) {
    let fallbackIds = [];
    for (let i = 1; i <= DEFAULT_BG_COUNT; i++) {
      if (!hiddenDefaults.includes(i)) fallbackIds.push(i);
    }
    if (fallbackIds.length === 0) {
      fallbackIds = [1, 2, 3, 4, 5];
    }
    fallbackIds.forEach(id => {
      pool.push({ type: "default", id: id, path: `images/bg${id}.jpg` });
    });
  }
  
  const selectedBg = pool[Math.floor(Math.random() * pool.length)];
  
  let bgUrl = "";
  let tempBlobUrl = null;
  
  if (selectedBg.type === "default") {
    bgUrl = selectedBg.path;
  } else {
    tempBlobUrl = URL.createObjectURL(selectedBg.blob);
    bgUrl = tempBlobUrl;
  }
  
  const layer1 = document.getElementById("bg-layer-1");
  const layer2 = document.getElementById("bg-layer-2");
  if (!layer1 || !layer2) return;
  
  const activeLayer = currentActiveLayer === 1 ? layer1 : layer2;
  const inactiveLayer = currentActiveLayer === 1 ? layer2 : layer1;
  
  inactiveLayer.style.backgroundImage = `url('${bgUrl}')`;
  
  if (settings.widgets.zoom) {
    inactiveLayer.classList.add("ken-burns");
  } else {
    inactiveLayer.classList.remove("ken-burns");
  }
  
  const img = new Image();
  img.src = bgUrl;
  
  const applyTransition = () => {
    inactiveLayer.classList.add("active");
    activeLayer.classList.remove("active");
    
    const oldBlobUrl = activeBgBlobUrl;
    setTimeout(() => {
      if (oldBlobUrl) {
        URL.revokeObjectURL(oldBlobUrl);
      }
      activeLayer.style.backgroundImage = "";
      activeLayer.classList.remove("ken-burns");
    }, 1300);
    
    activeBgBlobUrl = tempBlobUrl;
    currentActiveLayer = currentActiveLayer === 1 ? 2 : 1;
  };
  
  img.onload = applyTransition;
  img.onerror = applyTransition;
}

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const DOWNSCALE_MAX_DIM = 3840;

export function initUpload() {
  const uploadBox = document.getElementById("upload-box");
  const fileInput = document.getElementById("file-input");
  const toggleAutoDownscale = document.getElementById("toggle-auto-downscale");

  if (!uploadBox || !fileInput) return;

  if (toggleAutoDownscale) {
    toggleAutoDownscale.checked = settings.autoDownscaleUploads !== false;
    toggleAutoDownscale.addEventListener("change", async () => {
      settings.autoDownscaleUploads = toggleAutoDownscale.checked;
      await saveSettings();
    });
  }

  uploadBox.addEventListener("click", () => fileInput.click());
  
  fileInput.addEventListener("change", async (e) => {
    await handleUploadedFiles(e.target.files);
    fileInput.value = "";
  });
  
  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.classList.add("drag-over");
  });
  
  uploadBox.addEventListener("dragleave", () => uploadBox.classList.remove("drag-over"));
  
  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("drag-over");
    handleUploadedFiles(e.dataTransfer.files);
  });
}

export async function handleUploadedFiles(files) {
  if (!files || files.length === 0) return;
  let successCount = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (!file.type.startsWith("image/")) {
      showToast(isChineseUser ? `${file.name} 不是圖片檔案` : `${file.name} is not an image`);
      continue;
    }
    
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast(isChineseUser ? `${file.name} 檔案過大 (大於 25MB)，已略過` : `${file.name} exceeds 25MB limit`);
      continue;
    }

    try {
      const toStore = settings.autoDownscaleUploads !== false
        ? await downscaleImageBlob(file, DOWNSCALE_MAX_DIM, 0.9)
        : file;
      const insertedId = await window.justDB.addWallpaper(file.name, toStore);
      settings.activeCustoms.push(insertedId);
      successCount++;
    } catch (err) {
      console.error(err);
      showToast(isChineseUser ? `儲存 ${file.name} 失敗` : `Failed to save ${file.name}`);
    }
  }
  
  if (successCount > 0) {
    await saveSettings();
    await renderDrawerWallpapers();
    showToast(isChineseUser
      ? `成功上傳了 ${successCount} 張背景圖片！`
      : `Successfully uploaded ${successCount} wallpapers!`);
  }
}

export function downscaleImageBlob(file, maxDim, quality) {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const longest = Math.max(img.width, img.height);
        if (!longest || longest <= maxDim) {
          URL.revokeObjectURL(url);
          resolve(file);
          return;
        }
        const scale = maxDim / longest;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob && blob.size < file.size) {
            const newName = renameForType(file.name, outType);
            resolve(new File([blob], newName, { type: outType }));
          } else {
            resolve(file);
          }
        }, outType, quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    } catch (e) {
      resolve(file);
    }
  });
}

export function renameForType(name, type) {
  const ext = type === "image/png" ? ".png" : ".jpg";
  const base = name && name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : (name || "wallpaper");
  return base + ext;
}

export function revokeThumbnails() {
  thumbBlobUrls.forEach(url => URL.revokeObjectURL(url));
  thumbBlobUrls = [];
}

export async function renderDrawerWallpapers() {
  revokeThumbnails();
  
  const defaultList = document.getElementById("default-wallpaper-list");
  const customList = document.getElementById("custom-wallpaper-list");
  const btnResetDefaults = document.getElementById("btn-reset-defaults");
  if (!defaultList || !customList) return;
  
  defaultList.replaceChildren();
  customList.replaceChildren();
  
  const hiddenDefaults = settings.hiddenDefaults || [];
  if (btnResetDefaults) {
    btnResetDefaults.style.display = hiddenDefaults.length > 0 ? "block" : "none";
  }
  
  for (let i = 1; i <= DEFAULT_BG_COUNT; i++) {
    if (hiddenDefaults.includes(i)) continue;
    
    const isActive = settings.activeDefaults.includes(i);
    const item = document.createElement("div");
    item.className = `wallpaper-item ${isActive ? "selected" : ""}`;
    item.dataset.id = i;
    
    const img = document.createElement("img");
    img.className = "wallpaper-thumb";
    img.src = `images/thumbs/bg${i}.jpg`;
    img.alt = `Default BG ${i}`;
    
    const overlay = document.createElement("div");
    overlay.className = "wallpaper-item-overlay";
    const checkSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    checkSvg.setAttribute("class", "wallpaper-check-icon");
    checkSvg.setAttribute("viewBox", "0 0 24 24");
    const checkPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    checkPath.setAttribute("fill", "none");
    checkPath.setAttribute("stroke", "currentColor");
    checkPath.setAttribute("stroke-width", "3");
    checkPath.setAttribute("d", "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z");
    checkSvg.appendChild(checkPath);
    overlay.appendChild(checkSvg);
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "wallpaper-delete-btn";
    deleteBtn.title = isChineseUser ? "隱藏此內建背景" : "Hide default wallpaper";
    const delSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    delSvg.setAttribute("viewBox", "0 0 24 24");
    delSvg.setAttribute("width", "12");
    delSvg.setAttribute("height", "12");
    const delPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    delPath.setAttribute("fill", "currentColor");
    delPath.setAttribute("d", "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z");
    delSvg.appendChild(delPath);
    deleteBtn.appendChild(delSvg);
    
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const visibleDefaults = DEFAULT_BG_COUNT - (settings.hiddenDefaults || []).length;
      if (visibleDefaults + settings.activeCustoms.length <= 1) {
        showToast(isChineseUser ? "必須保留至少一張背景圖片" : "Must keep at least one wallpaper active");
        return;
      }
      
      if (!settings.hiddenDefaults) settings.hiddenDefaults = [];
      settings.hiddenDefaults.push(i);
      
      const idx = settings.activeDefaults.indexOf(i);
      if (idx > -1) settings.activeDefaults.splice(idx, 1);
      
      await saveSettings();
      renderDrawerWallpapers();
      showToast(isChineseUser ? "已隱藏該內建背景圖片" : "Default wallpaper hidden");
    });
    
    item.appendChild(img);
    item.appendChild(overlay);
    item.appendChild(deleteBtn);
    
    item.addEventListener("click", async () => {
      const idx = settings.activeDefaults.indexOf(i);
      if (idx > -1) {
        if (settings.activeDefaults.length + settings.activeCustoms.length > 1) {
          settings.activeDefaults.splice(idx, 1);
          item.classList.remove("selected");
        } else {
          showToast(isChineseUser ? "必須保留至少一張背景圖片" : "Must keep at least one wallpaper active");
        }
      } else {
        settings.activeDefaults.push(i);
        item.classList.add("selected");
      }
      await saveSettings();
    });
    
    defaultList.appendChild(item);
  }
  
  let customItems = [];
  try {
    if (window.justDB) customItems = await window.justDB.getAllWallpapers();
  } catch (err) {
    console.error(err);
  }
  
  if (customItems.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.style.gridColumn = "span 2";
    emptyMsg.style.fontSize = "0.8rem";
    emptyMsg.style.color = "var(--text-muted)";
    emptyMsg.style.textAlign = "center";
    emptyMsg.textContent = isChineseUser ? "尚無自訂背景" : "No custom wallpapers";
    customList.appendChild(emptyMsg);
  } else {
    customItems.forEach(itemData => {
      const isActive = settings.activeCustoms.includes(itemData.id);
      const blobUrl = URL.createObjectURL(itemData.blob);
      thumbBlobUrls.push(blobUrl);
      
      const item = document.createElement("div");
      item.className = `wallpaper-item ${isActive ? "selected" : ""}`;
      
      const img = document.createElement("img");
      img.className = "wallpaper-thumb";
      img.src = blobUrl;
      img.alt = itemData.name;
      
      const overlay = document.createElement("div");
      overlay.className = "wallpaper-item-overlay";
      const checkSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      checkSvg.setAttribute("class", "wallpaper-check-icon");
      checkSvg.setAttribute("viewBox", "0 0 24 24");
      const checkPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      checkPath.setAttribute("fill", "none");
      checkPath.setAttribute("stroke", "currentColor");
      checkPath.setAttribute("stroke-width", "3");
      checkPath.setAttribute("d", "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z");
      checkSvg.appendChild(checkPath);
      overlay.appendChild(checkSvg);
      
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "wallpaper-delete-btn";
      deleteBtn.title = isChineseUser ? "刪除此背景" : "Delete wallpaper";
      const delSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      delSvg.setAttribute("viewBox", "0 0 24 24");
      delSvg.setAttribute("width", "12");
      delSvg.setAttribute("height", "12");
      const delPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      delPath.setAttribute("fill", "currentColor");
      delPath.setAttribute("d", "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z");
      delSvg.appendChild(delPath);
      deleteBtn.appendChild(delSvg);
      
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        
        const actIdx = settings.activeCustoms.indexOf(itemData.id);
        if (actIdx > -1) {
          if (settings.activeDefaults.length + settings.activeCustoms.length > 1) {
            settings.activeCustoms.splice(actIdx, 1);
          } else {
            showToast(isChineseUser ? "必須保留至少一張背景圖片" : "Must keep at least one wallpaper active");
            return;
          }
        }
        
        try {
          await window.justDB.deleteWallpaper(itemData.id);
          await saveSettings();
          renderDrawerWallpapers();
          showToast(isChineseUser ? "自訂背景已刪除" : "Custom wallpaper deleted");
        } catch (err) {
          console.error(err);
          showToast(isChineseUser ? "刪除失敗" : "Delete failed");
        }
      });
      
      item.appendChild(img);
      item.appendChild(overlay);
      item.appendChild(deleteBtn);
      
      item.addEventListener("click", async () => {
        const actIdx = settings.activeCustoms.indexOf(itemData.id);
        if (actIdx > -1) {
          if (settings.activeDefaults.length + settings.activeCustoms.length > 1) {
            settings.activeCustoms.splice(actIdx, 1);
            item.classList.remove("selected");
          } else {
            showToast(isChineseUser ? "必須保留至少一張背景圖片" : "Must keep at least one wallpaper active");
          }
        } else {
          settings.activeCustoms.push(itemData.id);
          item.classList.add("selected");
        }
        await saveSettings();
      });
      
      customList.appendChild(item);
    });
  }
}

export function renderDrawerQuotes() {
  const customQuotesList = document.getElementById("custom-quotes-list");
  if (!customQuotesList) return;
  customQuotesList.replaceChildren();
  
  const quotes = settings.customQuotes || [];
  
  if (quotes.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.style.fontSize = "0.8rem";
    emptyMsg.style.color = "var(--text-muted)";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.padding = "1rem 0";
    emptyMsg.textContent = isChineseUser ? "尚無自訂金句" : "No custom quotes";
    customQuotesList.appendChild(emptyMsg);
    return;
  }
  
  quotes.forEach((quote) => {
    const item = document.createElement("div");
    item.className = "custom-quote-item";
    
    const details = document.createElement("div");
    details.className = "custom-quote-details";
    
    const textSpan = document.createElement("span");
    textSpan.className = "custom-quote-text";
    textSpan.textContent = quote.text;
    
    const authorSpan = document.createElement("span");
    authorSpan.className = "custom-quote-author";
    authorSpan.textContent = `— ${quote.author}`;
    
    details.appendChild(textSpan);
    details.appendChild(authorSpan);
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "custom-quote-delete-btn";
    deleteBtn.title = isChineseUser ? "刪除金句" : "Delete Quote";
    const delSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    delSvg.setAttribute("viewBox", "0 0 24 24");
    delSvg.setAttribute("width", "14");
    delSvg.setAttribute("height", "14");
    const delPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    delPath.setAttribute("fill", "currentColor");
    delPath.setAttribute("d", "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z");
    delSvg.appendChild(delPath);
    deleteBtn.appendChild(delSvg);
    
    deleteBtn.addEventListener("click", async () => {
      const idx = settings.customQuotes.findIndex(q => q.id === quote.id);
      if (idx > -1) {
        settings.customQuotes.splice(idx, 1);
        await saveSettings();
        renderDrawerQuotes();
        showToast(isChineseUser ? "自訂金句已刪除" : "Quote deleted");
      }
    });
    
    item.appendChild(details);
    item.appendChild(deleteBtn);
    customQuotesList.appendChild(item);
  });
}

export async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readZip(fileOrBlob) {
  const buf = new Uint8Array(await fileOrBlob.arrayBuffer());
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const utf8 = new TextDecoder("utf-8");

  let eocd = -1;
  const minPos = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= minPos; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Invalid ZIP: end-of-central-directory not found");

  const entryCount = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);

  const records = [];
  for (let i = 0; i < entryCount; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method     = dv.getUint16(p + 10, true);
    const compSize   = dv.getUint32(p + 20, true);
    const nameLen    = dv.getUint16(p + 28, true);
    const extraLen   = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOff   = dv.getUint32(p + 42, true);
    const name = utf8.decode(buf.subarray(p + 46, p + 46 + nameLen));
    records.push({ name, method, compSize, localOff });
    p += 46 + nameLen + extraLen + commentLen;
  }

  const makeEntry = (e) => {
    let dataPromise = null;
    const getData = () => {
      if (!dataPromise) {
        dataPromise = (async () => {
          if (dv.getUint32(e.localOff, true) !== 0x04034b50) {
            throw new Error("Invalid ZIP: bad local header for " + e.name);
          }
          const nLen = dv.getUint16(e.localOff + 26, true);
          const xLen = dv.getUint16(e.localOff + 28, true);
          const start = e.localOff + 30 + nLen + xLen;
          const raw = buf.subarray(start, start + e.compSize);
          if (e.method === 0) return raw;
          if (e.method === 8) return inflateRaw(raw);
          throw new Error("Unsupported ZIP compression method " + e.method);
        })();
      }
      return dataPromise;
    };
    return {
      name: e.name,
      dir: e.name.endsWith("/"),
      async: async (type) => {
        const data = await getData();
        if (type === "string") return utf8.decode(data);
        if (type === "blob") return new Blob([data]);
        return data;
      }
    };
  };

  const entries = records.map(makeEntry);
  return {
    forEach(cb) { entries.forEach((en) => cb(en.name, en)); }
  };
}

export function initZipImport() {
  const zipImportBox = document.getElementById("zip-import-box");
  const zipFileInput = document.getElementById("zip-file-input");

  if (!zipImportBox || !zipFileInput) return;

  zipImportBox.addEventListener("click", () => zipFileInput.click());

  zipFileInput.addEventListener("change", async (e) => {
    await handleZipFile(e.target.files[0]);
    zipFileInput.value = "";
  });

  zipImportBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    zipImportBox.classList.add("drag-over");
  });

  zipImportBox.addEventListener("dragleave", () => zipImportBox.classList.remove("drag-over"));

  zipImportBox.addEventListener("drop", async (e) => {
    e.preventDefault();
    zipImportBox.classList.remove("drag-over");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleZipFile(e.dataTransfer.files[0]);
    }
  });
}

export function getUiLangCode() {
  const raw = (typeof chrome !== "undefined" && chrome.i18n)
    ? chrome.i18n.getUILanguage()
    : (navigator.language || "en");
  return (raw || "en").toLowerCase();
}

export function pickQuoteFileForLang(bases, langCode) {
  if (!bases || !bases.length) return null;
  const lang = (langCode || "en").toLowerCase();
  const primary = lang.split("-")[0];
  const has = (name) => bases.find(b => b === name);

  let hit = has(`quotes_${lang}.txt`) || has(`quotes_${lang}.json`) ||
            has(`金句_${lang}.txt`) || has(`金句_${lang}.json`);
  if (!hit) {
    hit = has(`quotes_${primary}.txt`) || has(`quotes_${primary}.json`) ||
          has(`金句_${primary}.txt`) || has(`金句_${primary}.json`);
  }
  if (!hit) {
    hit = bases.find(b => b.startsWith(`quotes_${primary}`) || b.startsWith(`金句_${primary}`));
  }
  if (!hit) {
    hit = has("quotes.txt") || has("quotes.json") || has("金句.txt") || has("金句.json");
  }
  if (!hit) hit = bases[0];
  return hit;
}

export async function handleZipFile(fileOrBlob, customName = null) {
  if (!fileOrBlob) return;

  const fileName = customName || fileOrBlob.name || "theme.zip";

  if (!fileName.toLowerCase().endsWith(".zip")) {
    showToast(isChineseUser ? "請上傳 ZIP 壓縮包檔案" : "Please upload a ZIP file");
    return;
  }

  if (fileOrBlob.size > 100 * 1024 * 1024) {
    showToast(isChineseUser ? "ZIP 檔案過大 (大於 100MB)，已拒絕載入" : "ZIP file is too large (max 100MB)");
    return;
  }

  showToast(isChineseUser ? "正在解析主題包，請稍候..." : "Parsing theme package, please wait...");

  const packageId = `pkg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const packageName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

  try {
    const zip = await readZip(fileOrBlob);
    
    let imagesImported = 0;
    let quotesImported = 0;
    let customQuotesList = settings.customQuotes || [];

    const filePromises = [];
    const quoteEntries = [];

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;

      const nameLower = zipEntry.name.toLowerCase();
      const baseLower = nameLower.split("/").pop();

      if (nameLower.endsWith(".jpg") || nameLower.endsWith(".jpeg") || nameLower.endsWith(".png")) {
        const mimeType = nameLower.endsWith(".png") ? "image/png" : "image/jpeg";

        const promise = zipEntry.async("blob").then(async (blob) => {
          if (blob.size > 25 * 1024 * 1024) return;

          const fileBlob = new Blob([blob], { type: mimeType });
          try {
            const fileName = zipEntry.name.split("/").pop();
            const insertedId = await window.justDB.addWallpaper(fileName, fileBlob, packageId, packageName);
            settings.activeCustoms.push(insertedId);
            imagesImported++;
          } catch (err) {
            console.error(`Failed to save image ${zipEntry.name}:`, err);
          }
        });
        filePromises.push(promise);
      }
      else if (
        (baseLower.endsWith(".txt") || baseLower.endsWith(".json")) &&
        (baseLower.startsWith("quotes") || baseLower.startsWith("金句"))
      ) {
        quoteEntries.push({ base: baseLower, entry: zipEntry });
      }
    });

    const chosenQuote = pickQuoteFileForLang(quoteEntries.map(q => q.base), getUiLangCode());
    const chosenEntry = chosenQuote && quoteEntries.find(q => q.base === chosenQuote);

    if (chosenEntry) {
      const isJson = chosenEntry.base.endsWith(".json");
      const promise = chosenEntry.entry.async("string").then((text) => {
        if (isJson) {
          try {
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
              data.forEach(item => {
                if (item.text && item.text.trim()) {
                  customQuotesList.push({
                    id: Date.now() + Math.random(),
                    text: item.text.trim(),
                    author: item.author ? item.author.trim() : (isChineseUser ? "主題包匯入" : "Theme Package"),
                    packageId: packageId,
                    packageName: packageName
                  });
                  quotesImported++;
                }
              });
            }
          } catch (jsonErr) {
            console.error("Failed to parse quotes JSON:", jsonErr);
          }
          return;
        }

        const lines = text.split(/\r?\n/);
        lines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed) return;

          let quoteText = trimmed;
          let quoteAuthor = isChineseUser ? "主題包匯入" : "Theme Package";

          if (trimmed.includes("|")) {
            const parts = trimmed.split("|");
            quoteText = parts[0].trim();
            quoteAuthor = parts[1].trim() || quoteAuthor;
          } else if (trimmed.includes(" — ")) {
            const parts = trimmed.split(" — ");
            quoteText = parts[0].trim();
            quoteAuthor = parts[1].trim() || quoteAuthor;
          } else if (trimmed.includes(" - ")) {
            const parts = trimmed.split(" - ");
            quoteText = parts[0].trim();
            quoteAuthor = parts[1].trim() || quoteAuthor;
          }

          if (quoteText) {
            customQuotesList.push({
              id: Date.now() + Math.random(),
              text: quoteText,
              author: quoteAuthor,
              packageId: packageId,
              packageName: packageName
            });
            quotesImported++;
          }
        });
      });
      filePromises.push(promise);
    }

    await Promise.all(filePromises);

    if (imagesImported > 0 || quotesImported > 0) {
      settings.customQuotes = customQuotesList;
      await saveSettings();
      
      await renderDrawerWallpapers();
      renderDrawerQuotes();
      await renderDrawerThemes();

      const msg = isChineseUser
        ? `主題包匯入成功！匯入了 ${imagesImported} 張背景與 ${quotesImported} 條金句。`
        : `Theme package imported! Loaded ${imagesImported} wallpapers and ${quotesImported} quotes.`;
      showToast(msg);
    } else {
      showToast(isChineseUser ? "主題包內未包含有效的圖片或金句檔案" : "No valid images or quotes found in ZIP");
    }

  } catch (err) {
    console.error("ZIP import failure:", err);
    showToast(isChineseUser ? "解析 ZIP 檔案失敗" : "Failed to parse ZIP file");
  }
}

export async function renderDrawerThemes() {
  const themesListEl = document.getElementById("imported-themes-list");
  if (!themesListEl) return;
  themesListEl.replaceChildren();

  let allCustoms = [];
  try {
    if (window.justDB) allCustoms = await window.justDB.getAllWallpapers();
  } catch (err) {
    console.error("Failed to get wallpapers:", err);
  }

  const quotes = settings.customQuotes || [];
  const packagesMap = {};

  allCustoms.forEach(item => {
    if (item.packageId) {
      if (!packagesMap[item.packageId]) {
        packagesMap[item.packageId] = {
          id: item.packageId,
          name: item.packageName || item.packageId,
          wallpapers: [],
          quotes: []
        };
      }
      packagesMap[item.packageId].wallpapers.push(item.id);
    }
  });

  quotes.forEach(quote => {
    if (quote.packageId) {
      if (!packagesMap[quote.packageId]) {
        packagesMap[quote.packageId] = {
          id: quote.packageId,
          name: quote.packageName || quote.packageId,
          wallpapers: [],
          quotes: []
        };
      }
      packagesMap[quote.packageId].quotes.push(quote.id);
    }
  });

  const packageIds = Object.keys(packagesMap);

  if (packageIds.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.style.fontSize = "0.8rem";
    emptyMsg.style.color = "var(--text-muted)";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.padding = "1rem 0";
    emptyMsg.textContent = isChineseUser ? "目前尚無匯入的主題包" : "No imported packages yet";
    themesListEl.appendChild(emptyMsg);
    return;
  }

  packageIds.forEach(pkgId => {
    const pkg = packagesMap[pkgId];
    
    const card = document.createElement("div");
    card.className = "theme-package-card";

    const info = document.createElement("div");
    info.className = "theme-package-info";

    const nameSpan = document.createElement("span");
    nameSpan.className = "theme-package-name";
    nameSpan.textContent = pkg.name;

    const statsSpan = document.createElement("span");
    statsSpan.className = "theme-package-stats";
    
    const wallpapersText = isChineseUser ? `${pkg.wallpapers.length} 張背景` : `${pkg.wallpapers.length} wallpapers`;
    const quotesText = isChineseUser ? `${pkg.quotes.length} 條金句` : `${pkg.quotes.length} quotes`;
    statsSpan.textContent = `${wallpapersText}, ${quotesText}`;

    info.appendChild(nameSpan);
    info.appendChild(statsSpan);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "theme-delete-btn";
    deleteBtn.title = isChineseUser ? "刪除此主題包" : "Delete Theme Package";
    
    const delSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    delSvg.setAttribute("viewBox", "0 0 24 24");
    delSvg.setAttribute("width", "16");
    delSvg.setAttribute("height", "16");
    const delPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    delPath.setAttribute("fill", "currentColor");
    delPath.setAttribute("d", "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z");
    delSvg.appendChild(delPath);
    deleteBtn.appendChild(delSvg);

    deleteBtn.addEventListener("click", async () => {
      const confirmText = isChineseUser
        ? `您確定要刪除「${pkg.name}」主題包嗎？這將會一併移除該主題包內所有的背景圖片與自訂金句。`
        : `Are you sure you want to delete "${pkg.name}"? This will remove all of its wallpapers and quotes.`;

      if (confirm(confirmText)) {
        showToast(isChineseUser ? `正在刪除主題包「${pkg.name}」...` : `Deleting theme "${pkg.name}"...`);
        
        for (const wpId of pkg.wallpapers) {
          try {
            await window.justDB.deleteWallpaper(wpId);
            const actIdx = settings.activeCustoms.indexOf(wpId);
            if (actIdx > -1) settings.activeCustoms.splice(actIdx, 1);
          } catch (err) {
            console.error(`Failed to delete wallpaper ${wpId}:`, err);
          }
        }

        settings.customQuotes = (settings.customQuotes || []).filter(q => q.packageId !== pkgId);
        await saveSettings();

        await renderDrawerWallpapers();
        renderDrawerQuotes();
        await renderDrawerThemes();
        
        showToast(isChineseUser ? `主題包「${pkg.name}」已成功刪除` : `Theme "${pkg.name}" deleted successfully`);
      }
    });

    card.appendChild(info);
    card.appendChild(deleteBtn);
    themesListEl.appendChild(card);
  });
}

export function initOfficialThemes() {
  const container = document.getElementById("official-themes-list");
  if (!container) return;
  container.replaceChildren();

  OFFICIAL_THEMES.forEach(theme => {
    const card = document.createElement("div");
    card.className = "official-theme-card";

    const info = document.createElement("div");
    info.className = "official-theme-info";

    const nameSpan = document.createElement("span");
    nameSpan.className = "official-theme-name";
    nameSpan.textContent = theme.name;

    const descSpan = document.createElement("span");
    descSpan.className = "official-theme-desc";
    descSpan.textContent = isChineseUser ? (theme.desc || theme.name) : (theme.descEn || theme.name);

    info.appendChild(nameSpan);
    info.appendChild(descSpan);

    const btn = document.createElement("button");
    btn.className = "official-theme-download-btn";

    const dlSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    dlSvg.setAttribute("viewBox", "0 0 24 24");
    dlSvg.setAttribute("width", "12");
    dlSvg.setAttribute("height", "12");
    const dlPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    dlPath.setAttribute("fill", "currentColor");
    dlPath.setAttribute("d", "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z");
    dlSvg.appendChild(dlPath);

    const labelSpan = document.createElement("span");
    labelSpan.textContent = isChineseUser ? "下載匯入" : "Install";

    btn.appendChild(dlSvg);
    btn.appendChild(labelSpan);

    btn.addEventListener("click", async () => {
      btn.classList.add("loading");
      btn.disabled = true;
      btn.querySelector("span").textContent = isChineseUser ? "下載中..." : "Downloading...";

      showToast(isChineseUser ? `開始下載主題包 ${theme.name}...` : `Downloading theme ${theme.name}...`);

      try {
        const response = await fetch(theme.zipUrl || theme.url);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const blob = await response.blob();
        const filename = (theme.zipUrl || theme.url).split("/").pop() || `${theme.id}.zip`;
        await handleZipFile(blob, filename);
      } catch (err) {
        console.error("Failed to download preset theme package:", err);
        showToast(isChineseUser ? `下載主題包 ${theme.name} 失敗` : `Failed to download theme ${theme.name}`);
      } finally {
        btn.classList.remove("loading");
        btn.disabled = false;
        btn.querySelector("span").textContent = isChineseUser ? "下載匯入" : "Install";
      }
    });

    card.appendChild(info);
    card.appendChild(btn);
    container.appendChild(card);
  });
}
