// Just a New Tab - RSS Ticker & Feed Module
import { settings, saveSettings, isChineseUser } from './storage.js';
import { showToast, applyWidgetVisibility } from './uiDrawer.js';

let rssRotationInterval = null;
let currentRssIndex = 0;

export function initRssWidget() {
  const refreshBtn = document.getElementById("btn-rss-refresh");
  if (refreshBtn && !refreshBtn.dataset.listenerBound) {
    refreshBtn.addEventListener("click", () => {
      loadRssFeeds(true);
    });
    refreshBtn.dataset.listenerBound = "true";
  }

  if (settings.widgets.rss !== false) {
    loadRssFeeds();
  }
}

export function startRssRotation(items) {
  if (rssRotationInterval) {
    clearInterval(rssRotationInterval);
  }
  
  const linkEl = document.getElementById("rss-ticker-link");
  if (!linkEl || !items || items.length === 0) return;

  currentRssIndex = 0;
  
  const displayItem = (index) => {
    const item = items[index];
    linkEl.classList.add("fade-out");
    
    setTimeout(() => {
      linkEl.href = item.link;
      linkEl.textContent = `[${item.source}] ${item.title}`;
      linkEl.classList.remove("fade-out");
      linkEl.classList.add("fade-in");
      void linkEl.offsetWidth;
      linkEl.classList.remove("fade-in");
    }, 300);
  };
  
  displayItem(currentRssIndex);
  
  rssRotationInterval = setInterval(() => {
    currentRssIndex = (currentRssIndex + 1) % items.length;
    displayItem(currentRssIndex);
  }, 5000);
}

export async function loadRssFeeds(forceRefresh = false) {
  const linkEl = document.getElementById("rss-ticker-link");
  if (!linkEl) return;

  const cacheKey = "just_new_tab_rss_cache";
  const cacheTimeKey = "just_new_tab_rss_cache_time";
  const cachedData = localStorage.getItem(cacheKey);
  const cachedTime = localStorage.getItem(cacheTimeKey) || 0;

  if (!forceRefresh && cachedData && (Date.now() - cachedTime < 15 * 60 * 1000)) {
    try {
      const items = JSON.parse(cachedData);
      startRssRotation(items);
      return;
    } catch(e) {
      console.error("Failed to parse cached RSS data:", e);
    }
  }

  linkEl.replaceChildren();
  const spinner = document.createElement("div");
  spinner.className = "rss-loading-spinner";
  const span = document.createElement("span");
  span.textContent = isChineseUser ? "正在讀取訂閱內容..." : "Loading subscriptions...";
  linkEl.appendChild(spinner);
  linkEl.appendChild(span);
  linkEl.href = "#";

  const subscriptions = settings.rssSubscriptions || [];
  if (subscriptions.length === 0) {
    linkEl.textContent = isChineseUser ? "目前無訂閱來源，請至設定新增" : "No subscribed feeds. Add in settings.";
    return;
  }

  const allItems = [];
  const fetchPromises = subscriptions.map(async (sub) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(sub.url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Status ${response.status}`);
      const xmlText = await response.text();
      const items = parseRSS(xmlText, sub.name);
      allItems.push(...items);
    } catch(err) {
      console.error(`Failed to fetch RSS feed from ${sub.name} (${sub.url}):`, err.message || err);
    }
  });

  await Promise.allSettled(fetchPromises);

  allItems.sort((a, b) => b.date.getTime() - a.date.getTime());
  const finalItems = allItems.slice(0, 15);

  if (finalItems.length === 0) {
    linkEl.textContent = isChineseUser ? "讀取失敗，請檢查網路或連結格式" : "Failed to load feeds. Check connections.";
    return;
  }

  try {
    localStorage.setItem(cacheKey, JSON.stringify(finalItems));
    localStorage.setItem(cacheTimeKey, Date.now());
  } catch(e) {}

  startRssRotation(finalItems);
}

export function parseRSS(xmlText, sourceName) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const items = [];

  const getCleanText = (el) => {
    if (!el) return "";
    return el.textContent || el.text || "";
  };

  const rssItems = xmlDoc.querySelectorAll("item");
  if (rssItems && rssItems.length > 0) {
    rssItems.forEach(node => {
      const title = getCleanText(node.querySelector("title")) || "Untitled";
      
      let link = "";
      const linkEl = node.querySelector("link");
      if (linkEl) {
        link = linkEl.textContent || linkEl.text || "";
        link = link.trim();
      }
      
      const pubDateText = getCleanText(node.querySelector("pubDate")) || getCleanText(node.querySelector("date")) || "";
      let date = null;
      if (pubDateText) {
        try { date = new Date(pubDateText); } catch(e) {}
      }

      if (link) {
        items.push({
          title,
          link,
          date: date && !isNaN(date.getTime()) ? date : new Date(),
          source: sourceName
        });
      }
    });
  } else {
    const atomEntries = xmlDoc.querySelectorAll("entry");
    if (atomEntries && atomEntries.length > 0) {
      atomEntries.forEach(node => {
        const title = getCleanText(node.querySelector("title")) || "Untitled";
        
        let link = "";
        const linkNode = node.querySelector("link");
        if (linkNode) {
          link = linkNode.getAttribute("href") || linkNode.textContent || "";
          link = link.trim();
        }

        const updatedText = getCleanText(node.querySelector("updated")) || getCleanText(node.querySelector("published")) || "";
        let date = null;
        if (updatedText) {
          try { date = new Date(updatedText); } catch(e) {}
        }

        if (link) {
          items.push({
            title,
            link,
            date: date && !isNaN(date.getTime()) ? date : new Date(),
            source: sourceName
          });
        }
      });
    }
  }

  return items;
}

export function requestHostPermission(origins) {
  return new Promise((resolve) => {
    try {
      if (typeof browser !== "undefined" && browser.permissions && browser.permissions.request) {
        browser.permissions.request({ origins }).then(resolve).catch(() => resolve(false));
      } else if (typeof chrome !== "undefined" && chrome.permissions && chrome.permissions.request) {
        chrome.permissions.request({ origins }, (granted) => resolve(!!granted));
      } else {
        resolve(true);
      }
    } catch (e) {
      resolve(true);
    }
  });
}

export function ensureRssHostPermission() {
  return requestHostPermission(["http://*/*", "https://*/*"]);
}

export function initRssSettings() {
  const toggleRss = document.getElementById("toggle-rss");
  const btnAddRss = document.getElementById("btn-add-rss");
  const rssInputName = document.getElementById("rss-input-name");
  const rssInputUrl = document.getElementById("rss-input-url");

  if (toggleRss) {
    toggleRss.checked = settings.widgets.rss !== false;
    toggleRss.addEventListener("change", async () => {
      if (toggleRss.checked) {
        const granted = await ensureRssHostPermission();
        if (!granted) {
          toggleRss.checked = false;
          showToast(isChineseUser ? "需要網路存取權限才能讀取 RSS 訂閱" : "Network access permission is required for RSS feeds");
          return;
        }
      }
      settings.widgets.rss = toggleRss.checked;
      await saveSettings();
      applyWidgetVisibility();
      if (settings.widgets.rss !== false) {
        loadRssFeeds(true);
      }
    });
  }

  if (btnAddRss) {
    btnAddRss.addEventListener("click", async () => {
      const name = rssInputName.value.trim();
      let url = rssInputUrl.value.trim();

      if (!name || !url) {
        showToast(isChineseUser ? "請填寫訂閱名稱與連結網址" : "Please fill in subscription name and URL");
        return;
      }

      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }

      if (!settings.rssSubscriptions) {
        settings.rssSubscriptions = [];
      }

      const newSub = {
        id: Date.now(),
        name: name,
        url: url
      };

      settings.rssSubscriptions.push(newSub);
      await saveSettings();

      rssInputName.value = "";
      rssInputUrl.value = "";

      renderDrawerRssSubscriptions();
      showToast(isChineseUser ? "成功訂閱 RSS 來源" : "RSS subscription added");
      
      if (settings.widgets.rss !== false) {
        loadRssFeeds(true);
      }
    });
  }
}

export function renderDrawerRssSubscriptions() {
  const listEl = document.getElementById("rss-feeds-list");
  if (!listEl) return;
  listEl.textContent = "";

  const subs = settings.rssSubscriptions || [];

  if (subs.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.style.fontSize = "0.8rem";
    emptyMsg.style.color = "var(--text-muted)";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.padding = "1rem 0";
    emptyMsg.textContent = isChineseUser ? "目前尚無訂閱來源" : "No subscribed feeds yet";
    listEl.appendChild(emptyMsg);
    return;
  }

  subs.forEach((sub) => {
    const item = document.createElement("div");
    item.className = "custom-quote-item";

    const details = document.createElement("div");
    details.className = "custom-quote-details";

    const nameSpan = document.createElement("span");
    nameSpan.className = "custom-quote-text";
    nameSpan.style.fontWeight = "600";
    nameSpan.textContent = sub.name;

    const urlSpan = document.createElement("span");
    urlSpan.className = "custom-quote-author";
    urlSpan.style.textAlign = "left";
    urlSpan.textContent = sub.url;

    details.appendChild(nameSpan);
    details.appendChild(urlSpan);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "rss-delete-btn";
    deleteBtn.title = isChineseUser ? "刪除此訂閱" : "Delete subscription";
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("d", "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z");
    svg.appendChild(path);
    deleteBtn.appendChild(svg);

    deleteBtn.addEventListener("click", async () => {
      const idx = settings.rssSubscriptions.findIndex(s => s.id === sub.id);
      if (idx > -1) {
        settings.rssSubscriptions.splice(idx, 1);
        await saveSettings();
        renderDrawerRssSubscriptions();
        showToast(isChineseUser ? "已刪除訂閱來源" : "Subscription deleted");
        
        if (settings.widgets.rss !== false) {
          loadRssFeeds(true);
        }
      }
    });

    item.appendChild(details);
    item.appendChild(deleteBtn);
    listEl.appendChild(item);
  });
}
