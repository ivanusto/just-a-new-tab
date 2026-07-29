// Just a New Tab - UI Drawer & Visibility Module
import { settings, saveSettings, isChineseUser, isSimplifiedChinese, quickLinks, getClockCity } from './storage.js';
import { applyClockConfig, initGreeting, initClock, normalizeClockPositions, refreshClockPositionSelects, setClockPosition, clockEls, REMOTE_CLOCKS, CLOCK_POSITIONS } from './clock.js';
import { initWeather } from './weather.js';
import { initQuote, renderLocalQuoteSynchronously, runBrowserSearch } from './quoteSearch.js';
import { renderQuickLinks, initQuickLinks } from './quickLinks.js';
import { renderDrawerWallpapers, revokeThumbnails, setRandomBackground, renderDrawerQuotes, renderDrawerThemes, initOfficialThemes } from './themesBackgrounds.js';
import { renderDrawerRssSubscriptions, loadRssFeeds } from './rss.js';
import { renderDrawerReminders, renderRemindersWidget, renderDrawerCalendars, fetchCalendars, renderCalendarWidget } from './remindersCalendar.js';
import { WORLD_CITIES } from './config.js';

let toastTimeout = null;

export function showToast(message) {
  let toast = document.getElementById("app-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "app-toast";
    toast.className = "toast-msg";
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.classList.add("show");
  
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

export function translatePage() {
  if (typeof chrome !== "undefined" && chrome.i18n) {
    const uiLang = chrome.i18n.getUILanguage();
    if (uiLang) document.documentElement.lang = uiLang;
    const titleText = chrome.i18n.getMessage("extName");
    if (titleText) document.title = titleText;
  }

  const elements = document.querySelectorAll("[data-i18n]");
  elements.forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (typeof chrome !== "undefined" && chrome.i18n) {
      const msg = chrome.i18n.getMessage(key);
      if (msg) {
        if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
          el.setAttribute("placeholder", msg);
        } else {
          el.textContent = msg;
        }
      }
    }
  });

  const titleElements = document.querySelectorAll("[data-i18n-title]");
  titleElements.forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    if (typeof chrome !== "undefined" && chrome.i18n) {
      const msg = chrome.i18n.getMessage(key);
      if (msg) {
        el.setAttribute("title", msg);
      }
    }
  });
}

export function applyWidgetVisibility() {
  const clockWidget = document.getElementById("clock-widget");
  const greetingWidget = document.getElementById("greeting-widget");
  const linksWidget = document.getElementById("links-widget");
  const quoteWidget = document.getElementById("quote-widget");
  const searchWidget = document.getElementById("search-widget");
  const searchSubOptions = document.getElementById("search-sub-options");
  const cloudQuoteSubOptions = document.getElementById("cloud-quote-sub-options");

  if (clockWidget) {
    if (settings.widgets.clock) clockWidget.classList.remove("widget-hidden");
    else clockWidget.classList.add("widget-hidden");
  }

  if (greetingWidget) {
    if (settings.widgets.greeting) greetingWidget.classList.remove("widget-hidden");
    else greetingWidget.classList.add("widget-hidden");
  }

  if (linksWidget) {
    if (settings.widgets.links) linksWidget.classList.remove("widget-hidden");
    else linksWidget.classList.add("widget-hidden");
  }

  if (quoteWidget) {
    if (settings.widgets.quote) quoteWidget.classList.remove("widget-hidden");
    else quoteWidget.classList.add("widget-hidden");
  }

  if (searchWidget) {
    if (settings.widgets.search !== false) searchWidget.classList.remove("widget-hidden");
    else searchWidget.classList.add("widget-hidden");
  }

  if (searchSubOptions) {
    if (settings.widgets.search !== false) searchSubOptions.style.display = "block";
    else searchSubOptions.style.display = "none";
  }

  if (cloudQuoteSubOptions) {
    if (settings.widgets.quote && settings.widgets.cloudQuotes) cloudQuoteSubOptions.style.display = "block";
    else cloudQuoteSubOptions.style.display = "none";
  }

  const rssWidget = document.getElementById("rss-widget");
  if (rssWidget) {
    if (settings.widgets.rss !== false) {
      rssWidget.classList.remove("widget-hidden");
    } else {
      rssWidget.classList.add("widget-hidden");
    }
  }

  const remindersBlock = document.getElementById("reminders-block");
  const calendarBlock = document.getElementById("calendar-block");
  const agendaWidget = document.getElementById("agenda-widget");
  if (remindersBlock) remindersBlock.style.display = settings.widgets.reminders ? "block" : "none";
  if (calendarBlock) calendarBlock.style.display = settings.widgets.calendar ? "block" : "none";
  if (agendaWidget) {
    if (settings.widgets.reminders || settings.widgets.calendar) {
      agendaWidget.classList.remove("widget-hidden");
    } else {
      agendaWidget.classList.add("widget-hidden");
    }
  }

  if (!settings.weather) {
    ["local-weather", "remote-weather", "third-weather"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add("widget-hidden");
    });
  }

  applyClockConfig();
}

let bgRotateIntervalId = null;

export function startBgAutoRotate() {
  if (bgRotateIntervalId) {
    clearInterval(bgRotateIntervalId);
    bgRotateIntervalId = null;
  }
  if (settings.bgAutoRotate) {
    let interval = parseInt(settings.bgRotateInterval, 10);
    if (isNaN(interval) || interval < 15) interval = 15;
    if (interval > 86400) interval = 86400;
    
    bgRotateIntervalId = setInterval(() => {
      setRandomBackground();
      if (settings.bgRotateSyncQuote && settings.widgets.quote) {
        initQuote();
      }
    }, interval * 1000);
  }
}

export function initQuoteSearch() {
  const quoteWidget = document.getElementById("quote-widget");
  if (quoteWidget && !quoteWidget.dataset.listenerBound) {
    quoteWidget.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("a")) return;
      
      const textEl = document.getElementById("quote-text");
      const authorEl = document.getElementById("quote-author");
      
      if (!textEl) return;
      
      const text = textEl.textContent || "";
      const cleanedText = text.replace(/^[「“"'\s]+|[」”"'\s]+$/g, "").trim();
      
      if (!cleanedText) return;
      
      let query = cleanedText;
      if (authorEl) {
        const author = authorEl.textContent || "";
        const cleanedAuthor = author.replace(/^[—\-\s\u2014]+/, "").trim();
        if (cleanedAuthor) {
          query = `${cleanedText} ${cleanedAuthor}`;
        }
      }
      
      if (query) {
        runBrowserSearch(query, "NEW_TAB");
      }
    });
    quoteWidget.dataset.listenerBound = "true";
  }
}

export function buildCitySelect(select) {
  if (!select) return;
  select.replaceChildren();
  WORLD_CITIES.forEach(city => {
    const opt = document.createElement("option");
    opt.value = city.key;
    opt.textContent = city.name || city.en;
    select.appendChild(opt);
  });
  const custom = document.createElement("option");
  custom.value = "custom";
  custom.textContent = isChineseUser ? "自訂城市…" : "Custom city…";
  select.appendChild(custom);
}

export function remoteClockControls(prefix) {
  return {
    toggle: document.getElementById(`toggle-${prefix}-clock`),
    sub: document.getElementById(`${prefix}-clock-sub-options`),
    citySelect: document.getElementById(`${prefix}-clock-city-select`),
    customRow: document.getElementById(`${prefix}-clock-custom-row`),
    customInput: document.getElementById(`${prefix}-clock-custom-input`),
    posSelect: document.getElementById(`${prefix}-clock-position-select`)
  };
}

export function populateRemoteClock(prefix) {
  const c = remoteClockControls(prefix);
  if (!c.toggle) return;
  buildCitySelect(c.citySelect);
  const defCity = prefix === "second" ? "new_york" : "tokyo";
  const defPos = prefix === "second" ? "right" : "left";
  c.toggle.checked = !!settings[prefix + "Clock"];
  c.citySelect.value = settings[prefix + "ClockCity"] || defCity;
  c.customInput.value = (settings[prefix + "ClockCustom"] && settings[prefix + "ClockCustom"].query) || "";
  c.posSelect.value = settings[prefix + "ClockPosition"] || defPos;
  c.sub.style.display = settings[prefix + "Clock"] ? "flex" : "none";
  c.customRow.style.display = settings[prefix + "ClockCity"] === "custom" ? "flex" : "none";
}

export async function resolveCustomCity(prefix, query) {
  if (!query) {
    settings[prefix + "ClockCustom"] = null;
    await saveSettings();
    return;
  }
  const loc = await geocodeCity(query);
  if (loc) {
    settings[prefix + "ClockCustom"] = {
      query, name: loc.name || query, tz: loc.tz || null,
      lat: loc.lat != null ? loc.lat : null, lon: loc.lon != null ? loc.lon : null, custom: true
    };
  } else {
    settings[prefix + "ClockCustom"] = { query, name: query, tz: null, lat: null, lon: null, custom: true };
  }
  await saveSettings();
}

export function wireRemoteClock(prefix) {
  const c = remoteClockControls(prefix);
  if (!c.toggle || c.toggle.dataset.bound) return;
  c.toggle.dataset.bound = "true";

  c.toggle.addEventListener("change", async () => {
    settings[prefix + "Clock"] = c.toggle.checked;
    c.sub.style.display = c.toggle.checked ? "flex" : "none";
    if (c.toggle.checked) normalizeClockPositions();
    refreshClockPositionSelects();
    await saveSettings();
    applyClockConfig();
    if (settings.weather) initWeather();
  });

  c.citySelect.addEventListener("change", async () => {
    settings[prefix + "ClockCity"] = c.citySelect.value;
    c.customRow.style.display = c.citySelect.value === "custom" ? "flex" : "none";
    await saveSettings();
    if (c.citySelect.value === "custom") {
      await resolveCustomCity(prefix, c.customInput.value.trim());
    }
    applyClockConfig();
    if (settings.weather) initWeather();
  });

  const handleCustom = async () => {
    await resolveCustomCity(prefix, c.customInput.value.trim());
    applyClockConfig();
    if (settings.weather) initWeather();
  };
  c.customInput.addEventListener("change", handleCustom);
  c.customInput.addEventListener("blur", handleCustom);

  c.posSelect.addEventListener("change", async () => {
    setClockPosition(prefix, c.posSelect.value);
    refreshClockPositionSelects();
    await saveSettings();
    applyClockConfig();
  });
}

export function initQuoteSourceSelect() {
  const select = document.getElementById("cloud-quote-source-select");
  if (!select) return;
  select.replaceChildren();
  
  const getMsg = (key, fallback) => {
    if (typeof chrome !== "undefined" && chrome.i18n) {
      return chrome.i18n.getMessage(key) || fallback;
    }
    return fallback;
  };
  
  if (isSimplifiedChinese) {
    const optHito = document.createElement("option");
    optHito.value = "hitokoto";
    optHito.textContent = getMsg("quoteSourceHitokoto", "Hitokoto");
    select.appendChild(optHito);
    
    const optZen = document.createElement("option");
    optZen.value = "zenquotes";
    optZen.textContent = getMsg("quoteSourceZenQuotes", "ZenQuotes (英文)");
    select.appendChild(optZen);
    
    const optAnime = document.createElement("option");
    optAnime.value = "animechan";
    optAnime.textContent = getMsg("quoteSourceAnimeChan", "AnimeChan (英文)");
    select.appendChild(optAnime);
  } else if (isChineseUser) {
    const optZen = document.createElement("option");
    optZen.value = "zenquotes";
    optZen.textContent = getMsg("quoteSourceZenQuotes", "ZenQuotes (翻譯)");
    select.appendChild(optZen);
    
    const optAnime = document.createElement("option");
    optAnime.value = "animechan";
    optAnime.textContent = getMsg("quoteSourceAnimeChan", "AnimeChan (翻譯)");
    select.appendChild(optAnime);
    
    const optHito = document.createElement("option");
    optHito.value = "hitokoto";
    optHito.textContent = getMsg("quoteSourceHitokoto", "Hitokoto (原生為簡體字輸出)");
    select.appendChild(optHito);
  } else {
    const optZen = document.createElement("option");
    optZen.value = "zenquotes";
    optZen.textContent = getMsg("quoteSourceZenQuotes", "ZenQuotes");
    select.appendChild(optZen);
    
    const optAnime = document.createElement("option");
    optAnime.value = "animechan";
    optAnime.textContent = getMsg("quoteSourceAnimeChan", "AnimeChan (Anime Quotes)");
    select.appendChild(optAnime);
  }
  
  select.value = settings.cloudQuoteSource || (isSimplifiedChinese ? "hitokoto" : "zenquotes");
  
  if (!select.dataset.listenerBound) {
    select.addEventListener("change", async () => {
      settings.cloudQuoteSource = select.value;
      await saveSettings();
      initQuote();
    });
    select.dataset.listenerBound = "true";
  }
}

export function initDrawer() {
  const drawer = document.getElementById("settings-drawer");
  const btnSettings = document.getElementById("btn-settings");
  const btnClose = document.getElementById("drawer-close");
  const btnRandomize = document.getElementById("btn-randomize");
  
  const usernameInput = document.getElementById("username-input");
  
  const toggleClock = document.getElementById("toggle-clock");
  const toggleGreeting = document.getElementById("toggle-greeting");
  const toggleLinks = document.getElementById("toggle-links");
  const toggleQuote = document.getElementById("toggle-quote");
  const toggleCloudQuote = document.getElementById("toggle-cloud-quote");
  const toggleZoom = document.getElementById("toggle-zoom");
  
  const toggleSearch = document.getElementById("toggle-search");
  const toggleBgRotate = document.getElementById("toggle-bg-rotate");
  const bgRotateSubOptions = document.getElementById("bg-rotate-sub-options");
  const inputBgRotateInterval = document.getElementById("input-bg-rotate-interval");
  
  const toggleSearchNewTab = document.getElementById("toggle-search-newtab");
  const searchSubOptions = document.getElementById("search-sub-options");
  const cloudQuoteSubOptions = document.getElementById("cloud-quote-sub-options");

  const toggleSeconds = document.getElementById("toggle-seconds");
  const clockTypeSelect = document.getElementById("clock-type-select");
  const clockPositionSelect = document.getElementById("clock-position-select");
  const clockSizeSelect = document.getElementById("clock-size-select");
  const clockSubOptions = document.getElementById("clock-sub-options");

  const toggleBgRotateSyncQuote = document.getElementById("toggle-bg-rotate-sync-quote");

  const toggleWeather = document.getElementById("toggle-weather");
  const weatherSubOptions = document.getElementById("weather-sub-options");
  const weatherCityInput = document.getElementById("weather-city-input");
  const weatherUnitSelect = document.getElementById("weather-unit-select");

  const linkOpenModeSelect = document.getElementById("link-open-mode-select");
  const linksSubOptions = document.getElementById("links-sub-options");
  
  const btnResetDefaults = document.getElementById("btn-reset-defaults");
  
  const quoteInputText = document.getElementById("quote-input-text");
  const quoteInputAuthor = document.getElementById("quote-input-author");
  const btnAddQuote = document.getElementById("btn-add-quote");
  
  if (!drawer || !btnSettings) return;

  btnRandomize.setAttribute("title", isChineseUser ? "隨機切換背景" : "Randomize Background");
  btnSettings.setAttribute("title", isChineseUser ? "偏好設定" : "Settings");
  document.getElementById("drawer-close").setAttribute("title", isChineseUser ? "關閉" : "Close");

  const tabButtons = drawer.querySelectorAll(".tab-btn");
  const tabPanes = drawer.querySelectorAll(".tab-pane");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      
      tabButtons.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));
      
      btn.classList.add("active");
      document.getElementById(targetTab).classList.add("active");
    });
  });

  btnSettings.addEventListener("click", () => {
    usernameInput.value = settings.username;
    toggleClock.checked = settings.widgets.clock;
    const toggleRss = document.getElementById("toggle-rss");
    if (toggleRss) {
      toggleRss.checked = settings.widgets.rss !== false;
    }
    toggleGreeting.checked = settings.widgets.greeting;
    toggleLinks.checked = settings.widgets.links;
    toggleQuote.checked = settings.widgets.quote;
    toggleCloudQuote.checked = settings.widgets.cloudQuotes || false;
    toggleZoom.checked = settings.widgets.zoom;
    toggleSearch.checked = settings.widgets.search !== false;
    toggleSearchNewTab.checked = settings.searchInNewTab || false;
    searchSubOptions.style.display = settings.widgets.search !== false ? "block" : "none";
    
    initQuoteSourceSelect();
    cloudQuoteSubOptions.style.display = settings.widgets.cloudQuotes ? "block" : "none";
    
    toggleBgRotate.checked = settings.bgAutoRotate || false;
    bgRotateSubOptions.style.display = settings.bgAutoRotate ? "block" : "none";
    inputBgRotateInterval.value = settings.bgRotateInterval || 180;
    toggleBgRotateSyncQuote.checked = settings.bgRotateSyncQuote || false;

    toggleSeconds.checked = settings.clockShowSeconds !== false;
    clockTypeSelect.value = settings.clockType || "digital";
    clockPositionSelect.value = settings.clockPosition || "center";
    clockSizeSelect.value = settings.clockSize || "standard";
    populateRemoteClock("second");
    populateRemoteClock("third");
    if (settings.widgets.clock) {
      clockSubOptions.classList.remove("disabled");
    } else {
      clockSubOptions.classList.add("disabled");
    }

    toggleWeather.checked = settings.weather || false;
    weatherCityInput.value = settings.weatherCity || "";
    weatherUnitSelect.value = settings.weatherUnit || "c";
    weatherSubOptions.style.display = settings.weather ? "block" : "none";

    linkOpenModeSelect.value = settings.linkOpenMode || "newtab";
    if (settings.widgets.links) {
      linksSubOptions.classList.remove("disabled");
    } else {
      linksSubOptions.classList.add("disabled");
    }

    tabButtons.forEach(b => b.classList.remove("active"));
    tabPanes.forEach(p => p.classList.remove("active"));
    tabButtons[0].classList.add("active");
    tabPanes[0].classList.add("active");
    
    const toggleReminders = document.getElementById("toggle-reminders");
    if (toggleReminders) toggleReminders.checked = !!settings.widgets.reminders;
    const toggleCalendar = document.getElementById("toggle-calendar");
    if (toggleCalendar) toggleCalendar.checked = !!settings.widgets.calendar;

    renderDrawerWallpapers();
    renderDrawerQuotes();
    renderDrawerThemes();
    renderDrawerRssSubscriptions();
    renderDrawerReminders();
    renderDrawerCalendars();

    drawer.classList.add("open");
  });
  
  btnClose.addEventListener("click", () => {
    drawer.classList.remove("open");
    revokeThumbnails();
  });
  
  btnRandomize.addEventListener("click", () => {
    setRandomBackground();
    showToast(isChineseUser ? "已為您切換隨機背景" : "Background randomized");
  });
  
  usernameInput.addEventListener("input", async () => {
    settings.username = usernameInput.value;
    await saveSettings();
    initGreeting();
  });
  
  btnResetDefaults.addEventListener("click", async () => {
    settings.hiddenDefaults = [];
    for (let i = 1; i <= DEFAULT_BG_COUNT; i++) {
      if (!settings.activeDefaults.includes(i)) {
        settings.activeDefaults.push(i);
      }
    }
    await saveSettings();
    renderDrawerWallpapers();
    showToast(isChineseUser ? "內建背景圖片已全部重置並顯示" : "Default wallpapers restored");
  });
  
  btnAddQuote.addEventListener("click", async () => {
    const text = quoteInputText.value.trim();
    const author = quoteInputAuthor.value.trim();
    
    if (!text) {
      showToast(isChineseUser ? "請輸入金句內容" : "Please enter quote text");
      return;
    }
    
    if (!settings.customQuotes) settings.customQuotes = [];
    
    const newQuote = {
      id: Date.now(),
      text: text,
      author: author || (isChineseUser ? "自訂" : "Custom")
    };
    
    settings.customQuotes.push(newQuote);
    await saveSettings();
    
    quoteInputText.value = "";
    quoteInputAuthor.value = "";
    
    renderDrawerQuotes();
    showToast(isChineseUser ? "金句新增成功" : "Quote added successfully");
    initQuote();
  });
  
  const handleToggle = (key, checkbox) => {
    checkbox.addEventListener("change", async () => {
      settings.widgets[key] = checkbox.checked;
      await saveSettings();
      applyWidgetVisibility();
      
      if (key === "clock") {
        if (checkbox.checked) {
          clockSubOptions.classList.remove("disabled");
        } else {
          clockSubOptions.classList.add("disabled");
        }
      }
      
      if (key === "zoom") {
        const activeLayer = currentActiveLayer === 1 ? document.getElementById("bg-layer-2") : document.getElementById("bg-layer-1");
        if (checkbox.checked) {
          activeLayer.classList.add("ken-burns");
        } else {
          activeLayer.classList.remove("ken-burns");
        }
      }
      
      if (key === "cloudQuotes" || key === "quote") {
        initQuote();
        if (key === "cloudQuotes") {
          cloudQuoteSubOptions.style.display = checkbox.checked ? "block" : "none";
        }
      }

      if (key === "search") {
        searchSubOptions.style.display = checkbox.checked ? "block" : "none";
      }

      if (key === "links") {
        if (checkbox.checked) {
          linksSubOptions.classList.remove("disabled");
        } else {
          linksSubOptions.classList.add("disabled");
        }
      }
    });
  };
  
  handleToggle("clock", toggleClock);
  handleToggle("greeting", toggleGreeting);
  handleToggle("links", toggleLinks);
  handleToggle("quote", toggleQuote);
  handleToggle("cloudQuotes", toggleCloudQuote);
  handleToggle("zoom", toggleZoom);
  handleToggle("search", toggleSearch);

  toggleSearchNewTab.addEventListener("change", async () => {
    settings.searchInNewTab = toggleSearchNewTab.checked;
    await saveSettings();
  });
  
  toggleBgRotate.addEventListener("change", async () => {
    settings.bgAutoRotate = toggleBgRotate.checked;
    bgRotateSubOptions.style.display = settings.bgAutoRotate ? "block" : "none";
    await saveSettings();
    startBgAutoRotate();
  });
  
  const handleIntervalChange = async () => {
    let val = parseInt(inputBgRotateInterval.value, 10);
    if (isNaN(val) || val < 15) val = 15;
    if (val > 86400) val = 86400;
    inputBgRotateInterval.value = val;
    settings.bgRotateInterval = val;
    await saveSettings();
    startBgAutoRotate();
  };
  
  inputBgRotateInterval.addEventListener("change", handleIntervalChange);
  inputBgRotateInterval.addEventListener("blur", handleIntervalChange);

  toggleBgRotateSyncQuote.addEventListener("change", async () => {
    settings.bgRotateSyncQuote = toggleBgRotateSyncQuote.checked;
    await saveSettings();
  });

  clockTypeSelect.addEventListener("change", async () => {
    settings.clockType = clockTypeSelect.value;
    await saveSettings();
    initClock();
  });
  
  toggleSeconds.addEventListener("change", async () => {
    settings.clockShowSeconds = toggleSeconds.checked;
    await saveSettings();
    initClock();
  });

  clockPositionSelect.addEventListener("change", async () => {
    setClockPosition("local", clockPositionSelect.value);
    refreshClockPositionSelects();
    await saveSettings();
    applyClockConfig();
  });

  clockSizeSelect.addEventListener("change", async () => {
    settings.clockSize = clockSizeSelect.value;
    await saveSettings();
    applyClockConfig();
  });

  wireRemoteClock("second");
  wireRemoteClock("third");

  toggleWeather.addEventListener("change", async () => {
    settings.weather = toggleWeather.checked;
    weatherSubOptions.style.display = settings.weather ? "block" : "none";
    await saveSettings();
    if (settings.weather) {
      initWeather();
    } else {
      ["local-weather", "remote-weather", "third-weather"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("widget-hidden");
      });
    }
  });

  const handleWeatherCityChange = async () => {
    settings.weatherCity = weatherCityInput.value.trim();
    await saveSettings();
    if (settings.weather) initWeather();
  };
  weatherCityInput.addEventListener("change", handleWeatherCityChange);
  weatherCityInput.addEventListener("blur", handleWeatherCityChange);

  weatherUnitSelect.addEventListener("change", async () => {
    settings.weatherUnit = weatherUnitSelect.value;
    await saveSettings();
    if (settings.weather) initWeather();
  });

  linkOpenModeSelect.addEventListener("change", async () => {
    settings.linkOpenMode = linkOpenModeSelect.value;
    await saveSettings();
    renderQuickLinks();
  });
}

function requestApiPermission(permissions) {
  return new Promise((resolve) => {
    try {
      if (typeof browser !== "undefined" && browser.permissions && browser.permissions.request) {
        browser.permissions.request({ permissions }).then(resolve).catch(() => resolve(false));
      } else if (typeof chrome !== "undefined" && chrome.permissions && chrome.permissions.request) {
        chrome.permissions.request({ permissions }, (granted) => resolve(!!granted));
      } else {
        resolve(false);
      }
    } catch (e) {
      resolve(false);
    }
  });
}

function getTopSites() {
  return new Promise((resolve) => {
    try {
      if (typeof browser !== "undefined" && browser.topSites && browser.topSites.get) {
        browser.topSites.get({ includePinned: true, includeSearchShortcuts: false, limit: 30 })
          .then((sites) => resolve(sites || []))
          .catch(() => resolve([]));
      } else if (typeof chrome !== "undefined" && chrome.topSites && chrome.topSites.get) {
        chrome.topSites.get((sites) => resolve(sites || []));
      } else {
        resolve(null);
      }
    } catch (e) {
      resolve(null);
    }
  });
}

function normalizeLinkUrl(u) {
  try {
    const url = new URL(u);
    return (url.hostname + url.pathname).replace(/\/$/, "").toLowerCase();
  } catch (e) {
    return (u || "").trim().toLowerCase();
  }
}

export function initTopSitesImport() {
  const importBtn = document.getElementById("btn-import-topsites");
  const modal = document.getElementById("topsites-modal");
  const listEl = document.getElementById("topsites-list");
  const cancelBtn = document.getElementById("topsites-cancel");
  const addBtn = document.getElementById("topsites-add");
  if (!importBtn || !modal || !listEl) return;

  const closeModal = () => modal.classList.remove("open");

  importBtn.addEventListener("click", async () => {
    const granted = await requestApiPermission(["topSites"]);
    if (!granted) {
      showToast(isChineseUser ? "需要存取常用網站的權限" : "Permission to read top sites is required");
      return;
    }

    const sites = await getTopSites();
    if (sites === null) {
      showToast(isChineseUser ? "此瀏覽器不支援匯入常用網站" : "This browser does not support importing top sites");
      return;
    }

    const existing = new Set(quickLinks.map((l) => normalizeLinkUrl(l.url)));
    const seen = new Set();
    const candidates = [];
    sites.forEach((s) => {
      if (!s || !s.url) return;
      const key = normalizeLinkUrl(s.url);
      if (existing.has(key) || seen.has(key)) return;
      seen.add(key);
      let host = "";
      try { host = new URL(s.url).hostname; } catch (e) {}
      candidates.push({ name: (s.title && s.title.trim()) || host || s.url, url: s.url, host });
    });

    if (candidates.length === 0) {
      showToast(isChineseUser ? "找不到可匯入的新網站" : "No new sites to import");
      return;
    }

    listEl.replaceChildren();
    candidates.forEach((c, i) => {
      const item = document.createElement("label");
      item.className = "topsites-item";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = true;
      cb.dataset.index = String(i);

      const img = document.createElement("img");
      img.alt = "";
      if (c.host) {
        img.src = `https://www.google.com/s2/favicons?sz=128&domain=${c.host}`;
        img.onerror = () => { img.style.visibility = "hidden"; };
      }

      const meta = document.createElement("div");
      meta.className = "topsites-meta";
      const name = document.createElement("span");
      name.className = "topsites-name";
      name.textContent = c.name;
      const url = document.createElement("span");
      url.className = "topsites-url";
      url.textContent = c.url;
      meta.appendChild(name);
      meta.appendChild(url);

      item.appendChild(cb);
      item.appendChild(img);
      item.appendChild(meta);
      listEl.appendChild(item);
    });

    modal._candidates = candidates;
    modal.classList.add("open");
  });

  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      const candidates = modal._candidates || [];
      const checked = listEl.querySelectorAll('input[type="checkbox"]:checked');
      if (checked.length === 0) {
        showToast(isChineseUser ? "請至少勾選一個網站" : "Please select at least one site");
        return;
      }
      checked.forEach((cb) => {
        const c = candidates[parseInt(cb.dataset.index, 10)];
        if (c) quickLinks.push({ name: c.name.slice(0, 30), url: c.url });
      });
      await saveSettings();
      renderQuickLinks();
      closeModal();
      showToast(isChineseUser ? `已匯入 ${checked.length} 個網站` : `Imported ${checked.length} site(s)`);
    });
  }

  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
}
