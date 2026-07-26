// Just a New Tab - Quick Links (Shortcuts) & TopSites Module
import { quickLinks, settings, saveSettings, isChineseUser } from './storage.js';
import { showToast } from './uiDrawer.js';

let editingLinkIndex = -1;
let pendingLinkIcon = null;

export function initQuickLinks() {
  renderQuickLinks();

  const addBtn = document.getElementById("add-link-btn");
  const modal = document.getElementById("link-modal");
  const cancelBtn = document.getElementById("modal-cancel");
  const saveBtn = document.getElementById("modal-save");
  const nameInput = document.getElementById("link-name-input");
  const urlInput = document.getElementById("link-url-input");
  const iconInput = document.getElementById("link-icon-input");
  const iconUploadBtn = document.getElementById("link-icon-upload-btn");
  const iconResetBtn = document.getElementById("link-icon-reset-btn");

  if (addBtn) addBtn.addEventListener("click", () => openLinkModal(-1));
  if (cancelBtn) cancelBtn.addEventListener("click", () => modal.classList.remove("open"));

  if (nameInput) nameInput.addEventListener("input", updateModalIconPreview);
  if (urlInput) urlInput.addEventListener("input", updateModalIconPreview);

  if (iconUploadBtn && iconInput) {
    iconUploadBtn.addEventListener("click", () => iconInput.click());
    iconInput.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      iconInput.value = "";
      if (!file) return;
      try {
        pendingLinkIcon = await resizeImageToDataUrl(file, 64);
        updateModalIconPreview();
      } catch (err) {
        showToast(isChineseUser ? "圖示讀取失敗" : "Failed to load icon");
      }
    });
  }

  if (iconResetBtn) {
    iconResetBtn.addEventListener("click", () => {
      pendingLinkIcon = null;
      updateModalIconPreview();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const name = nameInput.value.trim();
      let url = urlInput.value.trim();

      if (!name || !url) {
        showToast(isChineseUser ? "請填寫完整資訊" : "Please fill in all details");
        return;
      }

      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }

      const isEditing = editingLinkIndex >= 0 && quickLinks[editingLinkIndex];
      if (isEditing) {
        const link = quickLinks[editingLinkIndex];
        link.name = name;
        link.url = url;
        if (pendingLinkIcon) link.icon = pendingLinkIcon;
        else delete link.icon;
      } else {
        const link = { name, url };
        if (pendingLinkIcon) link.icon = pendingLinkIcon;
        quickLinks.push(link);
      }

      await saveSettings();
      renderQuickLinks();
      modal.classList.remove("open");
      showToast(isChineseUser
        ? (isEditing ? `已更新捷徑 ${name}` : `已新增捷徑 ${name}`)
        : (isEditing ? `Shortcut ${name} updated` : `Shortcut ${name} added`));
    });
  }
}

export function openLinkModal(index) {
  const modal = document.getElementById("link-modal");
  const title = document.getElementById("link-modal-title");
  const nameInput = document.getElementById("link-name-input");
  const urlInput = document.getElementById("link-url-input");

  editingLinkIndex = index;

  if (index >= 0 && quickLinks[index]) {
    const link = quickLinks[index];
    nameInput.value = link.name || "";
    urlInput.value = link.url || "";
    pendingLinkIcon = link.icon || null;
    title.textContent = isChineseUser ? "編輯快捷網頁" : "Edit Shortcut";
  } else {
    nameInput.value = "";
    urlInput.value = "";
    pendingLinkIcon = null;
    title.textContent = isChineseUser ? "新增快捷網頁" : "Add Shortcut";
  }

  updateModalIconPreview();
  modal.classList.add("open");
  nameInput.focus();
}

export function updateModalIconPreview() {
  const preview = document.getElementById("link-icon-preview");
  if (!preview) return;
  preview.replaceChildren();

  const name = document.getElementById("link-name-input").value.trim();
  const url = document.getElementById("link-url-input").value.trim();

  if (pendingLinkIcon) {
    const img = document.createElement("img");
    img.src = pendingLinkIcon;
    img.alt = "";
    preview.appendChild(img);
    return;
  }

  let domain = "";
  try {
    domain = new URL(/^https?:\/\//i.test(url) ? url : "https://" + url).hostname;
  } catch (e) {
    domain = "";
  }

  if (domain) {
    const img = document.createElement("img");
    img.src = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
    img.alt = "";
    img.onerror = () => { img.remove(); preview.textContent = name ? name.charAt(0).toUpperCase() : "?"; };
    preview.appendChild(img);
  } else {
    preview.textContent = name ? name.charAt(0).toUpperCase() : "?";
  }
}

export function resizeImageToDataUrl(file, size) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const scale = Math.min(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function renderQuickLinks() {
  const linksGrid = document.getElementById("links-grid");
  if (!linksGrid) return;

  const cards = linksGrid.querySelectorAll(".link-card:not(.add-link-btn)");
  cards.forEach(card => card.remove());

  const addBtn = document.getElementById("add-link-btn");
  const openMode = settings.linkOpenMode || "newtab";

  quickLinks.forEach((link, index) => {
    const card = document.createElement("a");
    card.className = "link-card";
    card.href = link.url;
    card.title = link.name;
    card.draggable = true;
    card.dataset.index = index;

    if (openMode === "newtab") {
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    } else if (openMode === "newwindow") {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        window.open(link.url, "_blank", "noopener,noreferrer,width=1200,height=800");
      });
    }

    card.addEventListener("dragstart", (e) => {
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      linksGrid.querySelectorAll(".drag-over").forEach(c => c.classList.remove("drag-over"));
    });
    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      card.classList.add("drag-over");
    });
    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });
    card.addEventListener("drop", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.remove("drag-over");
      const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
      const to = index;
      if (Number.isNaN(from) || from === to) return;
      const [moved] = quickLinks.splice(from, 1);
      quickLinks.splice(to, 0, moved);
      await saveSettings();
      renderQuickLinks();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "link-delete-btn";
    deleteBtn.title = isChineseUser ? "刪除捷徑" : "Delete Shortcut";
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
      e.preventDefault();
      e.stopPropagation();
      quickLinks.splice(index, 1);
      await saveSettings();
      renderQuickLinks();
      showToast(isChineseUser ? `已刪除捷徑 ${link.name}` : `Shortcut ${link.name} deleted`);
    });

    const editBtn = document.createElement("button");
    editBtn.className = "link-edit-btn";
    editBtn.title = isChineseUser ? "編輯捷徑" : "Edit Shortcut";
    const editSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    editSvg.setAttribute("viewBox", "0 0 24 24");
    editSvg.setAttribute("width", "12");
    editSvg.setAttribute("height", "12");
    const editPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    editPath.setAttribute("fill", "currentColor");
    editPath.setAttribute("d", "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z");
    editSvg.appendChild(editPath);
    editBtn.appendChild(editSvg);

    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLinkModal(index);
    });

    const iconWrapper = document.createElement("div");
    iconWrapper.className = "link-icon-wrapper";

    if (link.icon) {
      const img = document.createElement("img");
      img.className = "link-icon-img";
      img.src = link.icon;
      img.alt = link.name;
      iconWrapper.appendChild(img);
    } else {
      let domain = "";
      try {
        domain = new URL(link.url).hostname;
      } catch(e) {
        domain = "";
      }

      if (domain) {
        const img = document.createElement("img");
        img.className = "link-icon-img";
        img.src = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
        img.alt = link.name;
        img.onerror = () => {
          img.remove();
          iconWrapper.textContent = link.name.charAt(0).toUpperCase();
        };
        iconWrapper.appendChild(img);
      } else {
        iconWrapper.textContent = link.name.charAt(0).toUpperCase();
      }
    }

    const titleSpan = document.createElement("span");
    titleSpan.className = "link-title";
    titleSpan.textContent = link.name;

    card.appendChild(deleteBtn);
    card.appendChild(editBtn);
    card.appendChild(iconWrapper);
    card.appendChild(titleSpan);

    if (addBtn) linksGrid.insertBefore(card, addBtn);
  });
}
