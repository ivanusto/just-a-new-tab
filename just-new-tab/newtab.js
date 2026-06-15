// Just a New Tab - Main Script

// Curated Traditional Chinese Quotes
const JUST_QUOTES = [
  { text: "生活不是等待暴風雨過去，而是學習在雨中跳舞。", author: "維維安·格林" },
  { text: "無論今天多麼黑暗，黎明總會如期而至。", author: "富蘭克林·羅斯福" },
  { text: "生活不在於你走得有多快，而在於你是否懂得欣賞沿途的風景。", author: "拉爾夫·沃爾多·愛默生" },
  { text: "每一天都是一個新的開始。深呼吸，微笑，然後重新出發。", author: "馬克·吐溫" },
  { text: "生活就像騎自行車，要想保持平衡，就必須不斷前進。", author: "阿爾伯特·愛因斯坦" },
  { text: "給自己一點時間，去成為你想成為的人。", author: "弗吉尼亞·伍爾芙" },
  { text: "你的好心情，是給生活最好的禮物。", author: "林清玄" },
  { text: "做一個溫柔的人，哪怕世界偶爾冷酷。", author: "泰戈爾" },
  { text: "最美的風景，不在遠方，而在你對生活的熱愛裡。", author: "羅曼·羅蘭" },
  { text: "慢慢來，比較快。找到自己的節奏，本身就是一種成就。", author: "老子" },
  { text: "只要心裡有陽光，何處不是明媚的春天。", author: "席慕蓉" },
  { text: "去熱愛，去前行，世界很大，你很溫柔。", author: "無名氏" },
  { text: "生活中的小確幸，都藏在用心感受的細節裡。", author: "村上春樹" },
  { text: "做你自己的太陽，無需憑藉誰的光。", author: "尼采" },
  { text: "今天也是充滿希望的一天，加油！", author: "Just a New Tab" }
];

// Curated English Quotes
const EN_QUOTES = [
  { text: "Life is not about waiting for the storm to pass, it's about learning to dance in the rain.", author: "Vivian Greene" },
  { text: "No matter how dark the moment, love and hope are always possible.", author: "George Alagiah" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Keep your face always toward the sunshine - and shadows will fall behind you.", author: "Walt Whitman" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Today is a beautiful day, enjoy it!", author: "Just a New Tab" }
];

// Default wallpapers count (1 to 6)
const DEFAULT_BG_COUNT = 5;

// State variables
let settings = {
  username: "",
  widgets: {
    clock: true,
    greeting: true,
    links: true,
    quote: true,
    zoom: true,
    cloudQuotes: false,
    search: true,
    rss: false,
    reminders: false,
    calendar: false
  },
  clockType: "digital", // "digital" or "analog"
  clockShowSeconds: false,
  clockPosition: "center", // "left" | "center" | "right"
  clockSize: "standard", // "small" | "standard" | "large"
  linkOpenMode: "newtab", // "current" | "newtab" | "newwindow"
  bgAutoRotate: false,
  bgRotateInterval: 180,
  searchEngine: "google",
  searchInNewTab: false,
  autoDownscaleUploads: true,
  cloudQuoteSource: "zenquotes",
  activeDefaults: [1, 2, 3, 4, 5],
  activeCustoms: [],
  hiddenDefaults: [],
  customQuotes: [],
  rssSubscriptions: [
    { id: 1, name: "CyberQ", url: "https://cyberq.tw/feed" }
  ],
  // Local reminders/todos (Tier 1) — each: { id, text, due|null, done, createdAt }
  reminders: [],
  // ICS calendar subscriptions (Tier 2) — each: { id, name, url, origin }
  calendars: []
};

let quickLinks = [
  { name: "Google", url: "https://www.google.com" },
  { name: "YouTube", url: "https://www.youtube.com" },
  { name: "GitHub", url: "https://github.com" },
  { name: "Gmail", url: "https://mail.google.com" },
  { name: "CyberQ", url: "https://cyberq.tw" }
];

// Keep track of active blob URLs to revoke them and avoid memory leaks
let activeBgBlobUrl = null;
let currentActiveLayer = 1; // 1 or 2
let thumbBlobUrls = [];
let isChineseUser = true;
let isSimplifiedChinese = false;

// Synchronous execution using cached settings to prevent flickers
(function preLoadCache() {
  const cachedSettingsStr = localStorage.getItem("just_new_tab_settings");
  const cachedLinksStr = localStorage.getItem("just_new_tab_links");
  
  // Detect UI language
  const uiLang = (typeof chrome !== "undefined" && chrome.i18n) ? chrome.i18n.getUILanguage() : navigator.language;
  isChineseUser = uiLang.startsWith("zh");
  isSimplifiedChinese = uiLang.toLowerCase().replace('_', '-') === 'zh-cn';

  if (cachedSettingsStr) {
    try {
      const cached = JSON.parse(cachedSettingsStr);
      settings = { ...settings, ...cached };
      if (cached.widgets) settings.widgets = { ...settings.widgets, ...cached.widgets };
    } catch(e) {}
  }
  if (cachedLinksStr) {
    try {
      quickLinks = JSON.parse(cachedLinksStr);
    } catch(e) {}
  }
})();

// Initialize script
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Instantly apply localization text tags
  translatePage();
  
  // 2. Load cached widgets instantly (No flicker!)
  initClock();
  initGreeting();
  initSearch();
  initQuoteSearch();
  applyWidgetVisibility();
  
  // Initialize shortcut buttons click handlers (Fixes the bug!)
  initQuickLinks();
  
  // Handle Quote display intelligently:
  // If cloud quotes are NOT enabled, render the local quote instantly to avoid any delay.
  // If cloud quotes ARE enabled, we keep the quote hidden (opacity 0) while fetching.
  if (!settings.widgets.cloudQuotes) {
    renderLocalQuoteSynchronously();
  } else {
    document.getElementById("quote-widget").style.opacity = "0";
  }
  
  // Render links
  renderQuickLinks();

  // 3. Load full settings asynchronously (source of truth)
  await loadSettings();
  
  // 4. Update elements if needed after loading from storage
  initGreeting();
  initSearch();
  initQuoteSearch();
  applyWidgetVisibility();
  renderQuickLinks();
  
  // 5. Initialize settings panel and upload handlers
  initDrawer();
  initUpload();
  initZipImport();
  initRssSettings();
  initOfficialThemes();
  initBackupRestore();
  initReminders();
  initCalendarSettings();
  initTopSitesImport();

  // 6. Set background and execute cloud quotes fetching if enabled
  await setRandomBackground();
  startBgAutoRotate();
  initRssWidget();
  renderRemindersWidget();
  initCalendarWidget();
  
  if (settings.widgets.cloudQuotes) {
    await loadCloudQuote();
  }
});

// Run translation of elements with data-i18n attributes
function translatePage() {
  if (typeof chrome !== "undefined" && chrome.i18n) {
    // Reflect the actual UI language instead of the hardcoded zh-TW in the markup
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

// Load settings from Chrome local storage
async function loadSettings() {
  const defaultSettings = JSON.parse(JSON.stringify(settings)); // deep copy
  
  if (typeof browser !== "undefined" && browser.storage) {
    const data = await browser.storage.local.get(["settings", "quickLinks"]);
    if (data.settings) settings = { ...defaultSettings, ...data.settings };
    if (data.quickLinks) quickLinks = data.quickLinks;
  } else if (typeof chrome !== "undefined" && chrome.storage) {
    await new Promise((resolve) => {
      chrome.storage.local.get(["settings", "quickLinks"], (data) => {
        if (data.settings) settings = { ...defaultSettings, ...data.settings };
        if (data.quickLinks) quickLinks = data.quickLinks;
        resolve();
      });
    });
  }
  
  // Ensure nested structures are correctly merged
  if (!settings.widgets) settings.widgets = defaultSettings.widgets;
  else settings.widgets = { ...defaultSettings.widgets, ...settings.widgets };
  
  if (!settings.activeDefaults) settings.activeDefaults = defaultSettings.activeDefaults;
  if (!settings.activeCustoms) settings.activeCustoms = defaultSettings.activeCustoms;
  if (!settings.hiddenDefaults) settings.hiddenDefaults = defaultSettings.hiddenDefaults;
  // Drop stale default-wallpaper ids saved by older versions (e.g. id 6 before the set shrank to 5)
  settings.activeDefaults = settings.activeDefaults.filter(id => id >= 1 && id <= DEFAULT_BG_COUNT);
  settings.hiddenDefaults = settings.hiddenDefaults.filter(id => id >= 1 && id <= DEFAULT_BG_COUNT);
  if (!settings.customQuotes) settings.customQuotes = defaultSettings.customQuotes;
  if (!settings.rssSubscriptions) settings.rssSubscriptions = defaultSettings.rssSubscriptions;
  if (settings.widgets.rss === undefined) settings.widgets.rss = defaultSettings.widgets.rss;
  if (!settings.reminders) settings.reminders = defaultSettings.reminders;
  if (!settings.calendars) settings.calendars = defaultSettings.calendars;
  if (settings.widgets.reminders === undefined) settings.widgets.reminders = defaultSettings.widgets.reminders;
  if (settings.widgets.calendar === undefined) settings.widgets.calendar = defaultSettings.widgets.calendar;

  if (settings.searchInNewTab === undefined) settings.searchInNewTab = defaultSettings.searchInNewTab;
  if (settings.autoDownscaleUploads === undefined) settings.autoDownscaleUploads = defaultSettings.autoDownscaleUploads;
  if (settings.cloudQuoteSource === undefined) {
    settings.cloudQuoteSource = isSimplifiedChinese ? "hitokoto" : "zenquotes";
  }

  // Write back to localStorage to cache it
  localStorage.setItem("just_new_tab_settings", JSON.stringify(settings));
  localStorage.setItem("just_new_tab_links", JSON.stringify(quickLinks));
}

// Save settings to storage
async function saveSettings() {
  if (typeof browser !== "undefined" && browser.storage) {
    await browser.storage.local.set({ settings, quickLinks });
  } else if (typeof chrome !== "undefined" && chrome.storage) {
    await new Promise((resolve) => {
      chrome.storage.local.set({ settings, quickLinks }, () => resolve());
    });
  }
  localStorage.setItem("just_new_tab_settings", JSON.stringify(settings));
  localStorage.setItem("just_new_tab_links", JSON.stringify(quickLinks));
}

// Show widget state according to settings
function applyWidgetVisibility() {
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

  // Agenda card (reminders + calendar). Each block toggles independently and the
  // whole card hides when both are off.
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

  applyClockLayout();
}

// Apply the clock's horizontal position and size via classes on the widget,
// so users can shift/shrink it to avoid covering the background subject.
function applyClockLayout() {
  const clockWidget = document.getElementById("clock-widget");
  if (!clockWidget) return;

  const pos = settings.clockPosition || "center";
  const size = settings.clockSize || "standard";

  clockWidget.classList.remove("clock-pos-left", "clock-pos-center", "clock-pos-right");
  clockWidget.classList.add(`clock-pos-${pos}`);

  clockWidget.classList.remove("clock-size-small", "clock-size-standard", "clock-size-large");
  clockWidget.classList.add(`clock-size-${size}`);
}

/* ==========================================================================
   Clock & Greeting Widget
   ========================================================================== */

function initClock() {
  const timeEl = document.getElementById("clock-time");
  const dateEl = document.getElementById("clock-date");
  const digitalClock = timeEl;
  const analogClock = document.getElementById("analog-clock");
  const hourHand = document.getElementById("analog-hour");
  const minuteHand = document.getElementById("analog-minute");
  const secondHand = document.getElementById("analog-second");
  
  // Generate clock tick marks dynamically for Analog Clock
  const clockFace = document.getElementById("clock-face");
  if (clockFace && clockFace.querySelectorAll(".clock-mark").length === 0) {
    for (let i = 0; i < 12; i++) {
      const mark = document.createElement("div");
      mark.className = "clock-mark" + (i % 3 === 0 ? " quarter" : "");
      mark.style.transform = `rotate(${i * 30}deg)`;
      clockFace.appendChild(mark);
    }
  }
  
  function updateClock() {
    const now = new Date();
    const showSeconds = settings.clockShowSeconds !== false;
    const isAnalog = settings.clockType === "analog";
    
    if (isAnalog) {
      digitalClock.style.display = "none";
      analogClock.style.display = "flex";
      
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      
      const hrDegrees = ((hours % 12) * 30) + (minutes * 0.5);
      const minDegrees = (minutes * 6) + (seconds * 0.1);
      const secDegrees = seconds * 6;
      
      hourHand.style.transform = `rotate(${hrDegrees}deg)`;
      minuteHand.style.transform = `rotate(${minDegrees}deg)`;
      
      if (showSeconds) {
        secondHand.style.display = "block";
        secondHand.style.transform = `rotate(${secDegrees}deg)`;
      } else {
        secondHand.style.display = "none";
      }
    } else {
      analogClock.style.display = "none";
      digitalClock.style.display = "block";
      
      let hours = now.getHours().toString().padStart(2, '0');
      let minutes = now.getMinutes().toString().padStart(2, '0');
      if (showSeconds) {
        let seconds = now.getSeconds().toString().padStart(2, '0');
        digitalClock.textContent = `${hours}:${minutes}:${seconds}`;
      } else {
        digitalClock.textContent = `${hours}:${minutes}`;
      }
    }
    
    // Format Date based on system UI locale
    const years = now.getFullYear();
    const months = now.getMonth() + 1;
    const days = now.getDate();
    
    if (isChineseUser) {
      const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      const weekDayStr = weekDays[now.getDay()];
      dateEl.textContent = `${years}年${months}月${days}日 ${weekDayStr}`;
    } else {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      dateEl.textContent = now.toLocaleDateString(undefined, options);
    }
  }
  
  updateClock();
  
  if (window.clockInterval) {
    clearInterval(window.clockInterval);
  }
  window.clockInterval = setInterval(updateClock, 1000);
}

function initGreeting() {
  const greetingEl = document.getElementById("greeting-text");
  
  function updateGreeting() {
    const now = new Date();
    const hours = now.getHours();
    let greetWord = "";
    
    if (isChineseUser) {
      if (hours >= 5 && hours < 12) {
        greetWord = "早安";
      } else if (hours >= 12 && hours < 14) {
        greetWord = "午安";
      } else if (hours >= 14 && hours < 18) {
        greetWord = "下午好";
      } else if (hours >= 18 && hours < 22) {
        greetWord = "晚安，辛苦了";
      } else {
        greetWord = "夜深了，早點休息";
      }
    } else {
      if (hours >= 5 && hours < 12) {
        greetWord = "Good morning";
      } else if (hours >= 12 && hours < 17) {
        greetWord = "Good afternoon";
      } else if (hours >= 17 && hours < 22) {
        greetWord = "Good evening";
      } else {
        greetWord = "Night time, rest well";
      }
    }
    
    const nameStr = settings.username.trim() ? `, ${settings.username.trim()}` : "";
    greetingEl.textContent = `${greetWord}${nameStr}`;
  }
  
  updateGreeting();
  setInterval(updateGreeting, 60000);
}

/* ==========================================================================
   Quote Widget
   ========================================================================== */

// Renders local quote instantly on load. No async fetch.
function renderLocalQuoteSynchronously() {
  const textEl = document.getElementById("quote-text");
  const authorEl = document.getElementById("quote-author");
  const quotePool = isChineseUser 
    ? [...JUST_QUOTES, ...(settings.customQuotes || [])]
    : [...EN_QUOTES, ...(settings.customQuotes || [])];
    
  if (quotePool.length === 0) {
    textEl.textContent = isChineseUser ? "「今天也是充滿希望的一天，加油！」" : "\"Today is a beautiful day, enjoy it!\"";
    authorEl.textContent = "— Just a New Tab";
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * quotePool.length);
  const quote = quotePool[randomIndex];
  
  textEl.textContent = isChineseUser ? `「${quote.text}」` : `"${quote.text}"`;
  authorEl.textContent = `— ${quote.author || (isChineseUser ? '匿名' : 'Anonymous')}`;
  
  // Instant display
  document.getElementById("quote-widget").style.opacity = "1";
}

// Fetch quote from cloud API asynchronously, with smooth fade transition
// Translate English to Traditional Chinese using MyMemory API
async function translateToTraditional(text) {
  if (!text) return "";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 seconds timeout
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-TW`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (err) {
    console.log("MyMemory translation failed or timed out:", err.message || err);
  }
  return text; // Fall back to original English text
}

async function loadCloudQuote() {
  if (!settings.widgets.quote || !settings.widgets.cloudQuotes) return;
  
  const textEl = document.getElementById("quote-text");
  const authorEl = document.getElementById("quote-author");
  const widget = document.getElementById("quote-widget");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
  
  try {
    let quoteText = "";
    let quoteAuthor = "";
    const source = settings.cloudQuoteSource || (isSimplifiedChinese ? "hitokoto" : "zenquotes");
    
    if (source === "hitokoto") {
      // Fetch from Hitokoto
      const response = await fetch("https://v1.hitokoto.cn/?c=d&c=i", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        quoteText = `“${data.hitokoto}”`;
        quoteAuthor = `— ${data.from_author || data.from || '网络'}`;
      }
    } else if (source === "animechan") {
      // Fetch from AnimeChan
      const response = await fetch("https://api.animechan.io/v1/quotes/random", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        let rawText = "";
        let rawAuthor = "";
        
        if (data) {
          if (data.status === "success" && data.data) {
            rawText = data.data.content;
            const charName = data.data.character ? data.data.character.name : "";
            const animeName = data.data.anime ? data.data.anime.name : "";
            rawAuthor = charName + (animeName ? ` (${animeName})` : "");
          } else if (data.quote && data.character) {
            rawText = data.quote;
            rawAuthor = data.character + (data.anime ? ` (${data.anime})` : "");
          }
        }
        
        if (rawText) {
          if (isChineseUser && !isSimplifiedChinese) {
            // Translate English quote to Traditional Chinese
            const translatedText = await translateToTraditional(rawText);
            const isTranslated = translatedText !== rawText;
            
            let translatedAuthor = rawAuthor;
            if (rawAuthor && isTranslated) {
              translatedAuthor = await translateToTraditional(rawAuthor);
            }
            
            if (isTranslated) {
              quoteText = `「${translatedText}」`;
            } else {
              quoteText = `"${translatedText}"`;
            }
            quoteAuthor = `— ${translatedAuthor}`;
          } else {
            // English/Other -> Renders in English
            quoteText = `"${rawText}"`;
            quoteAuthor = `— ${rawAuthor || 'Anonymous'}`;
          }
        }
      }
    } else {
      // Default: ZenQuotes (cached locally for 24h to avoid latency/rate limits)
      let cachedQuotes = null;
      let cacheTime = 0;
      
      const getStorageData = () => {
        return new Promise((resolve) => {
          if (typeof browser !== "undefined" && browser.storage) {
            browser.storage.local.get(["cloudQuotesCache", "cloudQuotesCacheTime"]).then((data) => resolve(data || {}));
          } else if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.get(["cloudQuotesCache", "cloudQuotesCacheTime"], (data) => resolve(data || {}));
          } else {
            resolve({});
          }
        });
      };
      
      const storageData = await getStorageData();
      cachedQuotes = storageData.cloudQuotesCache;
      cacheTime = storageData.cloudQuotesCacheTime || 0;
      
      const isCacheValid = cachedQuotes && Array.isArray(cachedQuotes) && cachedQuotes.length > 0 && (Date.now() - cacheTime < 24 * 60 * 60 * 1000);
      
      let quotesList = [];
      if (isCacheValid) {
        quotesList = cachedQuotes;
      } else {
        try {
          const response = await fetch("https://zenquotes.io/api/quotes", { signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              quotesList = data;
              if (typeof browser !== "undefined" && browser.storage) {
                await browser.storage.local.set({ cloudQuotesCache: data, cloudQuotesCacheTime: Date.now() });
              } else if (typeof chrome !== "undefined" && chrome.storage) {
                chrome.storage.local.set({ cloudQuotesCache: data, cloudQuotesCacheTime: Date.now() });
              }
            }
          }
        } catch (fetchErr) {
          console.log("Failed to fetch cloud quotes from CDN, trying to use expired cache:", fetchErr.message || fetchErr);
          if (cachedQuotes && Array.isArray(cachedQuotes) && cachedQuotes.length > 0) {
            quotesList = cachedQuotes;
          }
        }
      }
      
      if (quotesList.length > 0) {
        const randomIndex = Math.floor(Math.random() * quotesList.length);
        const item = quotesList[randomIndex];
        // ZenQuotes uses { q, a }; keep item.text/author fallback for any stale cache
        const rawText = item.q || item.text || "";
        let rawAuthor = (item.a || item.author || 'Anonymous').trim();
        if (!rawAuthor || rawAuthor.toLowerCase() === 'zenquotes.io') {
          rawAuthor = 'Anonymous';
        }
        
        if (isChineseUser && !isSimplifiedChinese) {
          const translatedText = await translateToTraditional(rawText);
          const isTranslated = translatedText !== rawText;
          
          let translatedAuthor = rawAuthor;
          if (rawAuthor !== 'Anonymous' && isTranslated) {
            translatedAuthor = await translateToTraditional(rawAuthor);
          } else if (rawAuthor === 'Anonymous') {
            translatedAuthor = '無名氏';
          }
          
          if (isTranslated) {
            quoteText = `「${translatedText}」`;
          } else {
            quoteText = `"${translatedText}"`;
          }
          quoteAuthor = `— ${translatedAuthor}`;
        } else {
          quoteText = `"${rawText}"`;
          quoteAuthor = `— ${rawAuthor}`;
        }
      }
    }

    
    if (quoteText && quoteAuthor) {
      if (widget.style.opacity === "1") {
        widget.style.opacity = "0";
        setTimeout(() => {
          textEl.textContent = quoteText;
          authorEl.textContent = quoteAuthor;
          widget.style.opacity = "1";
        }, 300);
      } else {
        textEl.textContent = quoteText;
        authorEl.textContent = quoteAuthor;
        widget.style.opacity = "1";
      }
    } else {
      renderLocalQuoteSynchronously();
    }
  } catch (err) {
    console.log("Failed to fetch cloud quote, falling back to local list:", err.message || err);
    if (widget.style.opacity === "0" || !widget.style.opacity) {
      renderLocalQuoteSynchronously();
    }
  }
}

// Wrapper to re-initialize quote on demand (resets text or triggers load)
function initQuote() {
  if (settings.widgets.cloudQuotes) {
    document.getElementById("quote-widget").style.opacity = "0";
    loadCloudQuote();
  } else {
    renderLocalQuoteSynchronously();
  }
}

/* ==========================================================================
   v1.2 & v1.3 Search, Auto-rotation & Quote Utils
   ========================================================================== */

function initSearch() {
  const searchWidget = document.getElementById("search-widget");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const searchEngineSelect = document.getElementById("search-engine-select");
  
  if (!searchWidget) return;

  // Apply initial visibility
  if (settings.widgets.search !== false) {
    searchWidget.classList.remove("widget-hidden");
  } else {
    searchWidget.classList.add("widget-hidden");
  }
  
  // Set initial search engine
  if (settings.searchEngine) {
    searchEngineSelect.value = settings.searchEngine;
  } else {
    settings.searchEngine = "google";
    searchEngineSelect.value = "google";
  }
  
  // Listen to engine selection change
  if (!searchEngineSelect.dataset.listenerBound) {
    searchEngineSelect.addEventListener("change", async () => {
      settings.searchEngine = searchEngineSelect.value;
      await saveSettings();
    });
    searchEngineSelect.dataset.listenerBound = "true";
  }
  
  // Handle search submit
  if (!searchForm.dataset.listenerBound) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (!query) return;
      
      const engine = searchEngineSelect.value;
      let url = "";
      
      switch (engine) {
        case "google":
          url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          break;
        case "baidu":
          url = `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;
          break;
        case "bing":
          url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
          break;
        case "duckduckgo":
          url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
          break;
        case "yahoo":
          url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
          break;
        case "chatgpt":
          url = `https://chatgpt.com/?q=${encodeURIComponent(query)}`;
          break;
        case "claude":
          url = `https://claude.ai/new?q=${encodeURIComponent(query)}`;
          break;
        case "perplexity":
          url = `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`;
          break;
        default:
          url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      }
      
      if (url) {
        if (settings.searchInNewTab) {
          window.open(url, "_blank");
        } else {
          window.location.href = url;
        }
      }
    });
    searchForm.dataset.listenerBound = "true";
  }
}

function startBgAutoRotate() {
  if (window.bgRotateIntervalId) {
    clearInterval(window.bgRotateIntervalId);
    window.bgRotateIntervalId = null;
  }
  if (settings.bgAutoRotate) {
    let interval = parseInt(settings.bgRotateInterval, 10);
    if (isNaN(interval) || interval < 15) interval = 15;
    if (interval > 86400) interval = 86400;
    
    window.bgRotateIntervalId = setInterval(() => {
      setRandomBackground();
    }, interval * 1000);
  }
}

function initQuoteSearch() {
  const quoteWidget = document.getElementById("quote-widget");
  if (!quoteWidget) return;
  
  if (!quoteWidget.dataset.listenerBound) {
    quoteWidget.addEventListener("click", () => {
      const textEl = document.getElementById("quote-text");
      const authorEl = document.getElementById("quote-author");
      if (!textEl) return;
      
      const text = textEl.textContent || "";
      const cleanedText = text.replace(/[「」\"“”]/g, "").trim();
      let query = cleanedText;
      
      if (authorEl) {
        const author = authorEl.textContent || "";
        const cleanedAuthor = author.replace(/^[—\-\s\u2014]+/, "").trim();
        if (cleanedAuthor) {
          query = `${cleanedText} ${cleanedAuthor}`;
        }
      }
      
      if (query) {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(searchUrl, "_blank");
      }
    });
    quoteWidget.dataset.listenerBound = "true";
  }
}

function initQuoteSourceSelect() {
  const select = document.getElementById("cloud-quote-source-select");
  if (!select) return;
  select.innerHTML = "";
  
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

/* ==========================================================================
   Quick Links Widget
   ========================================================================== */

// Modal state: index of the link being edited, or -1 when adding a new one.
let editingLinkIndex = -1;
// Custom icon (data URL) chosen in the modal; null falls back to favicon/letter.
let pendingLinkIcon = null;

function initQuickLinks() {
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

  // Open modal in "add" mode
  addBtn.addEventListener("click", () => {
    openLinkModal(-1);
  });

  // Close modal
  cancelBtn.addEventListener("click", () => {
    modal.classList.remove("open");
  });

  // Keep the preview live while the user types a name/URL
  nameInput.addEventListener("input", updateModalIconPreview);
  urlInput.addEventListener("input", updateModalIconPreview);

  // Open the hidden file picker for the custom icon
  iconUploadBtn.addEventListener("click", () => iconInput.click());

  // Resize the chosen image to 64px and stash it as a pending data URL
  iconInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    iconInput.value = ""; // allow re-selecting the same file later
    if (!file) return;
    try {
      pendingLinkIcon = await resizeImageToDataUrl(file, 64);
      updateModalIconPreview();
    } catch (err) {
      showToast(isChineseUser ? "圖示讀取失敗" : "Failed to load icon");
    }
  });

  // Drop the custom icon and fall back to favicon/letter
  iconResetBtn.addEventListener("click", () => {
    pendingLinkIcon = null;
    updateModalIconPreview();
  });

  // Save (handles both add and edit)
  saveBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();

    if (!name || !url) {
      showToast(isChineseUser ? "請填寫完整資訊" : "Please fill in all details");
      return;
    }

    // Auto prefix http/https if missing
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

// Opens the link modal for adding (index = -1) or editing an existing link.
function openLinkModal(index) {
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

// Renders the small icon preview inside the modal from the current state.
function updateModalIconPreview() {
  const preview = document.getElementById("link-icon-preview");
  if (!preview) return;
  preview.innerHTML = "";

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
    img.src = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    img.alt = "";
    img.onerror = () => { img.remove(); preview.textContent = name ? name.charAt(0).toUpperCase() : "?"; };
    preview.appendChild(img);
  } else {
    preview.textContent = name ? name.charAt(0).toUpperCase() : "?";
  }
}

// Loads an image file and returns a square data URL resized to `size` px,
// preserving aspect ratio (letterboxed within the square).
function resizeImageToDataUrl(file, size) {
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

function renderQuickLinks() {
  const linksGrid = document.getElementById("links-grid");

  // Remove all existing cards except the "Add New" button
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

    // Apply open behavior: current tab (default), new tab, or new window
    if (openMode === "newtab") {
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    } else if (openMode === "newwindow") {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        window.open(link.url, "_blank", "noopener,noreferrer,width=1200,height=800");
      });
    }

    // --- Drag-and-drop reordering ---
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

    // Delete Button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "link-delete-btn";
    deleteBtn.title = isChineseUser ? "刪除捷徑" : "Delete Shortcut";
    deleteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="12" height="12">
        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    `;

    deleteBtn.addEventListener("click", async (e) => {
      e.preventDefault(); // Stop click navigation
      e.stopPropagation(); // Stop click card

      quickLinks.splice(index, 1);
      await saveSettings();
      renderQuickLinks();
      showToast(isChineseUser ? `已刪除捷徑 ${link.name}` : `Shortcut ${link.name} deleted`);
    });

    // Edit Button
    const editBtn = document.createElement("button");
    editBtn.className = "link-edit-btn";
    editBtn.title = isChineseUser ? "編輯捷徑" : "Edit Shortcut";
    editBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="12" height="12">
        <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
    `;

    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLinkModal(index);
    });

    // Icon
    const iconWrapper = document.createElement("div");
    iconWrapper.className = "link-icon-wrapper";

    if (link.icon) {
      // User-supplied custom icon
      const img = document.createElement("img");
      img.className = "link-icon-img";
      img.src = link.icon;
      img.alt = link.name;
      iconWrapper.appendChild(img);
    } else {
      // Fall back to the site favicon, then the first letter
      let domain = "";
      try {
        domain = new URL(link.url).hostname;
      } catch(e) {
        domain = "";
      }

      if (domain) {
        const img = document.createElement("img");
        img.className = "link-icon-img";
        img.src = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
        img.alt = link.name;

        // Fallback in case Google favicon API fails or offline
        img.onerror = () => {
          img.remove();
          iconWrapper.textContent = link.name.charAt(0).toUpperCase();
        };

        iconWrapper.appendChild(img);
      } else {
        iconWrapper.textContent = link.name.charAt(0).toUpperCase();
      }
    }

    // Title
    const titleSpan = document.createElement("span");
    titleSpan.className = "link-title";
    titleSpan.textContent = link.name;

    card.appendChild(deleteBtn);
    card.appendChild(editBtn);
    card.appendChild(iconWrapper);
    card.appendChild(titleSpan);

    // Insert before the add button
    linksGrid.insertBefore(card, addBtn);
  });
}

/* ==========================================================================
   Background & Wallpaper Logic
   ========================================================================== */

async function setRandomBackground() {
  const activeDefaults = settings.activeDefaults;
  const activeCustoms = settings.activeCustoms;
  const hiddenDefaults = settings.hiddenDefaults || [];
  
  // Custom wallpapers list from DB
  let allCustoms = [];
  try {
    allCustoms = await window.justDB.getAllWallpapers();
  } catch (err) {
    console.error("Failed to read from IndexedDB:", err);
  }
  
  // Build a pool of selectable background configs
  const pool = [];
  
  // Add defaults to pool if enabled AND not hidden
  activeDefaults.forEach(id => {
    if (!hiddenDefaults.includes(id)) {
      pool.push({ type: "default", id: id, path: `images/bg${id}.jpg` });
    }
  });
  
  // Add customs to pool if enabled and exist in DB
  allCustoms.forEach(item => {
    if (activeCustoms.includes(item.id)) {
      pool.push({ type: "custom", id: item.id, blob: item.blob });
    }
  });
  
  // Absolute fallback
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
  
  // Select random item
  const selectedBg = pool[Math.floor(Math.random() * pool.length)];
  
  // Prepare background URL
  let bgUrl = "";
  let tempBlobUrl = null;
  
  if (selectedBg.type === "default") {
    bgUrl = selectedBg.path;
  } else {
    // Custom uploaded image
    tempBlobUrl = URL.createObjectURL(selectedBg.blob);
    bgUrl = tempBlobUrl;
  }
  
  // Perform cross-fade transition
  const layer1 = document.getElementById("bg-layer-1");
  const layer2 = document.getElementById("bg-layer-2");
  
  const activeLayer = currentActiveLayer === 1 ? layer1 : layer2;
  const inactiveLayer = currentActiveLayer === 1 ? layer2 : layer1;
  
  // Apply background to inactive layer first, preload it
  inactiveLayer.style.backgroundImage = `url('${bgUrl}')`;
  
  // Apply Ken Burns Zoom class
  if (settings.widgets.zoom) {
    inactiveLayer.classList.add("ken-burns");
  } else {
    inactiveLayer.classList.remove("ken-burns");
  }
  
  // Wait for the background to load to avoid flickering
  const img = new Image();
  img.src = bgUrl;
  
  const applyTransition = () => {
    // Swap classes
    inactiveLayer.classList.add("active");
    activeLayer.classList.remove("active");
    
    // Revoke previous blob URL after some time (allow transition to finish)
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

/* ==========================================================================
   Settings Drawer Logic
   ========================================================================== */

function initDrawer() {
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
  const cloudQuoteSourceSelect = document.getElementById("cloud-quote-source-select");
  const cloudQuoteSubOptions = document.getElementById("cloud-quote-sub-options");

  const toggleSeconds = document.getElementById("toggle-seconds");
  const clockTypeSelect = document.getElementById("clock-type-select");
  const clockPositionSelect = document.getElementById("clock-position-select");
  const clockSizeSelect = document.getElementById("clock-size-select");
  const clockSubOptions = document.getElementById("clock-sub-options");

  const linkOpenModeSelect = document.getElementById("link-open-mode-select");
  const linksSubOptions = document.getElementById("links-sub-options");
  
  const btnResetDefaults = document.getElementById("btn-reset-defaults");
  
  const quoteInputText = document.getElementById("quote-input-text");
  const quoteInputAuthor = document.getElementById("quote-input-author");
  const btnAddQuote = document.getElementById("btn-add-quote");
  
  // Set randomize and settings button localized titles in JS
  btnRandomize.setAttribute("title", isChineseUser ? "隨機切換背景" : "Randomize Background");
  btnSettings.setAttribute("title", isChineseUser ? "偏好設定" : "Settings");
  document.getElementById("drawer-close").setAttribute("title", isChineseUser ? "關閉" : "Close");

  // Drawer Tab Switching Logic
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

  // Open Settings Drawer
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
    
    // Cloud quotes source dropdown
    initQuoteSourceSelect();
    cloudQuoteSubOptions.style.display = settings.widgets.cloudQuotes ? "block" : "none";
    
    toggleBgRotate.checked = settings.bgAutoRotate || false;
    bgRotateSubOptions.style.display = settings.bgAutoRotate ? "block" : "none";
    inputBgRotateInterval.value = settings.bgRotateInterval || 180;
    
    toggleSeconds.checked = settings.clockShowSeconds !== false;
    clockTypeSelect.value = settings.clockType || "digital";
    clockPositionSelect.value = settings.clockPosition || "center";
    clockSizeSelect.value = settings.clockSize || "standard";
    if (settings.widgets.clock) {
      clockSubOptions.classList.remove("disabled");
    } else {
      clockSubOptions.classList.add("disabled");
    }

    linkOpenModeSelect.value = settings.linkOpenMode || "newtab";
    if (settings.widgets.links) {
      linksSubOptions.classList.remove("disabled");
    } else {
      linksSubOptions.classList.add("disabled");
    }

    // Switch to first tab (General) upon opening drawer
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
  
  // Close Settings Drawer
  btnClose.addEventListener("click", () => {
    drawer.classList.remove("open");
    revokeThumbnails();
  });
  
  // Randomize background button
  btnRandomize.addEventListener("click", () => {
    setRandomBackground();
    showToast(isChineseUser ? "已為您切換隨機背景" : "Background randomized");
  });
  
  // Handle basic configuration inputs
  usernameInput.addEventListener("input", async () => {
    settings.username = usernameInput.value;
    await saveSettings();
    initGreeting(); // update live
  });
  
  // Reset Hidden Default Wallpapers
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
  
  // Add Custom Quote
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
    initQuote(); // update display live
  });
  
  // Widget Toggles
  const handleToggle = (key, checkbox) => {
    checkbox.addEventListener("change", async () => {
      settings.widgets[key] = checkbox.checked;
      await saveSettings();
      applyWidgetVisibility();
      
      // Special case for clock sub options
      if (key === "clock") {
        if (checkbox.checked) {
          clockSubOptions.classList.remove("disabled");
        } else {
          clockSubOptions.classList.add("disabled");
        }
      }
      
      // Special case for zoom
      if (key === "zoom") {
        const activeLayer = currentActiveLayer === 1 ? document.getElementById("bg-layer-2") : document.getElementById("bg-layer-1");
        if (checkbox.checked) {
          activeLayer.classList.add("ken-burns");
        } else {
          activeLayer.classList.remove("ken-burns");
        }
      }
      
      // Special case for cloud quotes
      if (key === "cloudQuotes" || key === "quote") {
        initQuote();
        if (key === "cloudQuotes") {
          cloudQuoteSubOptions.style.display = checkbox.checked ? "block" : "none";
        }
      }

      if (key === "search") {
        searchSubOptions.style.display = checkbox.checked ? "block" : "none";
      }

      // Special case for quick links sub options
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

  // Search In New Tab Listener
  toggleSearchNewTab.addEventListener("change", async () => {
    settings.searchInNewTab = toggleSearchNewTab.checked;
    await saveSettings();
  });
  
  // Auto Rotate Listeners
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
  
  // Clock Style & Seconds listeners
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
    settings.clockPosition = clockPositionSelect.value;
    await saveSettings();
    applyClockLayout();
  });

  clockSizeSelect.addEventListener("change", async () => {
    settings.clockSize = clockSizeSelect.value;
    await saveSettings();
    applyClockLayout();
  });

  // Quick Link Open Mode listener
  linkOpenModeSelect.addEventListener("change", async () => {
    settings.linkOpenMode = linkOpenModeSelect.value;
    await saveSettings();
    renderQuickLinks();
  });
}

// Render the list of wallpapers (default & custom) in the settings drawer
async function renderDrawerWallpapers() {
  revokeThumbnails();
  
  const defaultList = document.getElementById("default-wallpaper-list");
  const customList = document.getElementById("custom-wallpaper-list");
  const btnResetDefaults = document.getElementById("btn-reset-defaults");
  
  defaultList.innerHTML = "";
  customList.innerHTML = "";
  
  const hiddenDefaults = settings.hiddenDefaults || [];
  if (hiddenDefaults.length > 0) {
    btnResetDefaults.style.display = "block";
  } else {
    btnResetDefaults.style.display = "none";
  }
  
  // 1. Render Defaults (skipping hidden ones)
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
    overlay.innerHTML = `
      <svg class="wallpaper-check-icon" viewBox="0 0 24 24">
        <path fill="none" stroke="currentColor" stroke-width="3" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    `;
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "wallpaper-delete-btn";
    deleteBtn.title = isChineseUser ? "隱藏此內建背景" : "Hide default wallpaper";
    deleteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="12" height="12">
        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    `;
    
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation(); // Stop click item
      
      const visibleDefaults = DEFAULT_BG_COUNT - (settings.hiddenDefaults || []).length;
      if (visibleDefaults + settings.activeCustoms.length <= 1) {
        showToast(isChineseUser ? "必須保留至少一張背景圖片" : "Must keep at least one wallpaper active");
        return;
      }
      
      if (!settings.hiddenDefaults) settings.hiddenDefaults = [];
      settings.hiddenDefaults.push(i);
      
      const idx = settings.activeDefaults.indexOf(i);
      if (idx > -1) {
        settings.activeDefaults.splice(idx, 1);
      }
      
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
  
  // 2. Render Customs
  let customItems = [];
  try {
    customItems = await window.justDB.getAllWallpapers();
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
      overlay.innerHTML = `
        <svg class="wallpaper-check-icon" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" stroke-width="3" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      `;
      
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "wallpaper-delete-btn";
      deleteBtn.title = isChineseUser ? "刪除此背景" : "Delete wallpaper";
      deleteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="12" height="12">
          <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      `;
      
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

// Render the list of custom quotes in the settings drawer
function renderDrawerQuotes() {
  const customQuotesList = document.getElementById("custom-quotes-list");
  customQuotesList.innerHTML = "";
  
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
    deleteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14">
        <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
    `;
    
    deleteBtn.addEventListener("click", async () => {
      const idx = settings.customQuotes.findIndex(q => q.id === quote.id);
      if (idx > -1) {
        settings.customQuotes.splice(idx, 1);
        await saveSettings();
        renderDrawerQuotes();
        showToast(isChineseUser ? "自訂金句已刪除" : "Quote deleted");
        initQuote();
      }
    });
    
    item.appendChild(details);
    item.appendChild(deleteBtn);
    customQuotesList.appendChild(item);
  });
}

// Clean up thumbnail blob URLs to prevent memory leak
function revokeThumbnails() {
  thumbBlobUrls.forEach(url => URL.revokeObjectURL(url));
  thumbBlobUrls = [];
}

/* ==========================================================================
   File Upload & Drag & Drop
   ========================================================================== */

// Largest single uploaded image accepted (raised from 12MB in v1.55).
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
// Longest-edge cap used when "auto-downscale" is on, to keep stored images small.
const DOWNSCALE_MAX_DIM = 3840;

function initUpload() {
  const uploadBox = document.getElementById("upload-box");
  const fileInput = document.getElementById("file-input");
  const toggleAutoDownscale = document.getElementById("toggle-auto-downscale");

  if (toggleAutoDownscale) {
    toggleAutoDownscale.checked = settings.autoDownscaleUploads !== false;
    toggleAutoDownscale.addEventListener("change", async () => {
      settings.autoDownscaleUploads = toggleAutoDownscale.checked;
      await saveSettings();
    });
  }

  uploadBox.addEventListener("click", () => {
    fileInput.click();
  });
  
  fileInput.addEventListener("change", async (e) => {
    await handleUploadedFiles(e.target.files);
    fileInput.value = "";
  });
  
  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.classList.add("drag-over");
  });
  
  uploadBox.addEventListener("dragleave", () => {
    uploadBox.classList.remove("drag-over");
  });
  
  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("drag-over");
    handleUploadedFiles(e.dataTransfer.files);
  });
}

async function handleUploadedFiles(files) {
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
      // Optionally downscale oversized images before storing to save space.
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

// Downscale an image to `maxDim` on its longest edge (aspect-preserving) so very
// large uploads don't bloat IndexedDB. Returns the original file unchanged when
// it's already small enough, when decoding fails, or when re-encoding wouldn't
// shrink it. PNG stays PNG (alpha preserved); everything else becomes JPEG.
function downscaleImageBlob(file, maxDim, quality) {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const longest = Math.max(img.width, img.height);
        if (!longest || longest <= maxDim) {
          URL.revokeObjectURL(url);
          resolve(file); // already within bounds — keep original bytes
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
            resolve(file); // re-encode didn't help — keep original
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

// Keep the filename extension consistent with the (possibly converted) MIME type.
function renameForType(name, type) {
  const ext = type === "image/png" ? ".png" : ".jpg";
  const base = name && name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : (name || "wallpaper");
  return base + ext;
}

/* ==========================================================================
   Toast Notification Helper
   ========================================================================== */

let toastTimeout = null;

function showToast(message) {
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

/* ==========================================================================
   Backup & Restore — export/import all settings, shortcuts, RSS, quotes
   and custom wallpapers as a single portable JSON file so the same
   experience can be carried across devices.
   ========================================================================== */

const BACKUP_FORMAT = "just-new-tab-backup";

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataURLToBlob(dataURL) {
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

function initBackupRestore() {
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

async function exportBackup() {
  showToast(isChineseUser ? "正在準備備份檔，請稍候..." : "Preparing backup, please wait...");
  try {
    let wallpapers = [];
    try {
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

async function importBackup(file) {
  if (!file) return;

  // Guard against pathologically large files (images are base64-inflated).
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
    // 1. Replace the wallpapers stored in IndexedDB and remember how the old
    //    auto-increment ids map to the freshly assigned ones.
    const idMap = {};
    if (Array.isArray(backup.wallpapers)) {
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

    // 2. Restore settings and shortcuts.
    settings = backup.settings;
    quickLinks = Array.isArray(backup.quickLinks) ? backup.quickLinks : quickLinks;

    // 3. Re-point active custom wallpaper references at the new ids.
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

/* ==========================================================================
   ZIP Theme Package Import
   ========================================================================== */

// Minimal ZIP reader built on the browser's native DecompressionStream.
// Replaces the bundled JSZip library entirely (no ~97KB dependency, no
// eval/Function-constructor warning). Parses the central directory and
// inflates each entry on demand.
async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZip(fileOrBlob) {
  const buf = new Uint8Array(await fileOrBlob.arrayBuffer());
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const utf8 = new TextDecoder("utf-8");

  // Locate the End Of Central Directory record (scanning back over any comment).
  let eocd = -1;
  const minPos = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= minPos; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Invalid ZIP: end-of-central-directory not found");

  const entryCount = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true); // start of central directory

  const records = [];
  for (let i = 0; i < entryCount; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break; // central directory header
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
          if (e.method === 0) return raw;             // stored
          if (e.method === 8) return inflateRaw(raw); // deflate
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

function initZipImport() {
  const zipImportBox = document.getElementById("zip-import-box");
  const zipFileInput = document.getElementById("zip-file-input");

  zipImportBox.addEventListener("click", () => {
    zipFileInput.click();
  });

  zipFileInput.addEventListener("change", async (e) => {
    await handleZipFile(e.target.files[0]);
    zipFileInput.value = "";
  });

  zipImportBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    zipImportBox.classList.add("drag-over");
  });

  zipImportBox.addEventListener("dragleave", () => {
    zipImportBox.classList.remove("drag-over");
  });

  zipImportBox.addEventListener("drop", async (e) => {
    e.preventDefault();
    zipImportBox.classList.remove("drag-over");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleZipFile(e.dataTransfer.files[0]);
    }
  });
}

async function handleZipFile(fileOrBlob, customName = null) {
  if (!fileOrBlob) return;

  const fileName = customName || fileOrBlob.name || "theme.zip";

  if (!fileName.toLowerCase().endsWith(".zip")) {
    showToast(isChineseUser ? "請上傳 ZIP 壓縮包檔案" : "Please upload a ZIP file");
    return;
  }

  // Limit ZIP size to 100MB
  if (fileOrBlob.size > 100 * 1024 * 1024) {
    showToast(isChineseUser ? "ZIP 檔案過大 (大於 100MB)，已拒絕載入" : "ZIP file is too large (max 100MB)");
    return;
  }

  showToast(isChineseUser ? "正在解析主題包，請稍候..." : "Parsing theme package, please wait...");

  // Generate packageId and packageName
  const packageId = `pkg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const packageName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

  try {
    const zip = await readZip(fileOrBlob);
    
    let imagesImported = 0;
    let quotesImported = 0;
    let customQuotesList = settings.customQuotes || [];

    const filePromises = [];

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;

      const nameLower = zipEntry.name.toLowerCase();

      // Only allow JPG, JPEG, PNG
      if (nameLower.endsWith(".jpg") || nameLower.endsWith(".jpeg") || nameLower.endsWith(".png")) {
        const mimeType = nameLower.endsWith(".png") ? "image/png" : "image/jpeg";
        
        const promise = zipEntry.async("blob").then(async (blob) => {
          if (blob.size > 25 * 1024 * 1024) {
            console.warn(`Skipped ${zipEntry.name}: image too large`);
            return;
          }
          
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
      
      // Quotes from txt or json
      else if (nameLower.endsWith("quotes.txt") || nameLower.endsWith("金句.txt")) {
        const promise = zipEntry.async("string").then((text) => {
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
      
      else if (nameLower.endsWith("quotes.json") || nameLower.endsWith("金句.json")) {
        const promise = zipEntry.async("string").then((text) => {
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
            console.error("Failed to parse quotes.json:", jsonErr);
          }
        });
        filePromises.push(promise);
      }
    });

    await Promise.all(filePromises);

    if (imagesImported > 0 || quotesImported > 0) {
      settings.customQuotes = customQuotesList;
      await saveSettings();
      
      await renderDrawerWallpapers();
      renderDrawerQuotes();
      await renderDrawerThemes();
      initQuote();

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

// Render list of imported ZIP theme packages and handle theme deletion
async function renderDrawerThemes() {
  const themesListEl = document.getElementById("imported-themes-list");
  if (!themesListEl) return;
  themesListEl.innerHTML = "";

  let allCustoms = [];
  try {
    allCustoms = await window.justDB.getAllWallpapers();
  } catch (err) {
    console.error("Failed to get wallpapers for theme grouping:", err);
  }

  const quotes = settings.customQuotes || [];

  // Group by packageId
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
    deleteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
    `;

    deleteBtn.addEventListener("click", async () => {
      const confirmText = isChineseUser
        ? `您確定要刪除「${pkg.name}」主題包嗎？這將會一併移除該主題包內所有的背景圖片與自訂金句。`
        : `Are you sure you want to delete "${pkg.name}"? This will remove all of its wallpapers and quotes.`;

      if (confirm(confirmText)) {
        showToast(isChineseUser ? `正在刪除主題包「${pkg.name}」...` : `Deleting theme "${pkg.name}"...`);
        
        // 1. Delete wallpapers from IndexedDB
        for (const wpId of pkg.wallpapers) {
          try {
            await window.justDB.deleteWallpaper(wpId);
            
            // Remove from activeCustoms
            const actIdx = settings.activeCustoms.indexOf(wpId);
            if (actIdx > -1) {
              settings.activeCustoms.splice(actIdx, 1);
            }
          } catch (err) {
            console.error(`Failed to delete wallpaper ${wpId} from package ${pkg.name}:`, err);
          }
        }

        // 2. Delete quotes from customQuotes
        settings.customQuotes = (settings.customQuotes || []).filter(q => q.packageId !== pkgId);

        await saveSettings();

        // 3. Re-render UI panels
        await renderDrawerWallpapers();
        renderDrawerQuotes();
        await renderDrawerThemes();
        initQuote();
        
        showToast(isChineseUser ? `主題包「${pkg.name}」已成功刪除` : `Theme "${pkg.name}" deleted successfully`);
      }
    });

    card.appendChild(info);
    card.appendChild(deleteBtn);
    themesListEl.appendChild(card);
  });
}

/* ==========================================================================
   Version 1.45: RSS Widget & Recommended Themes Logic
   ========================================================================== */

const OFFICIAL_THEMES = [
  {
    name: "Christian Theme Pack",
    url: "https://yblog.org/wp-content/uploads/2026/06/christian_pack.zip",
    desc: "精選基督教主題背景與溫暖金句",
    descEn: "Christian-themed backgrounds with warm, uplifting quotes"
  },
  {
    name: "Classic Moody Pack",
    url: "https://yblog.org/wp-content/uploads/2026/06/classic_moody.zip",
    desc: "極簡暗黑、深邃星空與哲學思考金句",
    descEn: "Minimal dark scenes, deep starry skies and philosophical quotes"
  },
  {
    name: "Nature & Zen Pack",
    url: "https://yblog.org/wp-content/uploads/2026/06/nature_zen.zip",
    desc: "寧靜自然風景與禪意生活金句",
    descEn: "Serene nature landscapes with zen living quotes"
  },
  {
    name: "Beauty Pack",
    url: "https://yblog.org/wp-content/uploads/2026/06/beauty_pack.zip",
    desc: "唯美浪漫背景與百句戀愛金句",
    descEn: "Romantic backgrounds with 100 love quotes"
  },
  {
    name: "Anime & Manga Pack",
    url: "https://yblog.org/wp-content/uploads/2026/06/anime_manga.zip",
    desc: "動漫風格背景與動漫角色熱血金句",
    descEn: "Anime-style backgrounds with iconic quotes from beloved anime"
  },
  {
    name: "Couple & Love Pack",
    url: "https://yblog.org/wp-content/uploads/2026/06/couple_love.zip",
    desc: "浪漫愛情場景與甜蜜戀愛金句",
    descEn: "Romantic couple scenes with sweet love quotes"
  },
  {
    name: "Elderly Nostalgia Pack",
    url: "https://yblog.org/wp-content/uploads/2026/06/elderly_nostalgia.zip",
    desc: "懷舊復古場景與長者人生智慧金句",
    descEn: "Vintage nostalgic scenes with timeless life wisdom from elders"
  },
  {
    name: "Funny & Humor Pack",
    url: "https://yblog.org/wp-content/uploads/2026/06/funny_humor.zip",
    desc: "趣味插圖背景與爆笑日常幽默金句",
    descEn: "Playful illustrated backgrounds with relatable everyday humor quotes"
  },
  {
    name: "Gaming Pack",
    url: "https://yblog.org/wp-content/uploads/2026/06/gaming.zip",
    desc: "電玩主題場景與遊戲智慧金句",
    descEn: "Gaming-themed backgrounds with gamer wisdom and wit"
  },
  {
    name: "Pets Pack",
    url: "https://yblog.org/wp-content/uploads/2026/06/pets.zip",
    desc: "可愛寵物場景與溫馨動物金句",
    descEn: "Adorable pet backgrounds with heartwarming quotes from pet lovers"
  },
  {
    name: "Politics Pack",
    url: "https://yblog.org/wp-content/uploads/2026/06/politics.zip",
    desc: "政治場景與民主自由名言金句",
    descEn: "Political landmarks with quotes on democracy, power and freedom"
  },
  {
    name: "Satire Pack",
    url: "https://yblog.org/wp-content/uploads/2026/06/satire.zip",
    desc: "諷刺插畫背景與辛辣反諷金句",
    descEn: "Satirical illustration backgrounds with sharp social commentary quotes"
  }
];

function initOfficialThemes() {
  const container = document.getElementById("official-themes-list");
  if (!container) return;
  container.innerHTML = "";

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
    descSpan.textContent = isChineseUser ? theme.desc : (theme.descEn || theme.name);

    info.appendChild(nameSpan);
    info.appendChild(descSpan);

    const btn = document.createElement("button");
    btn.className = "official-theme-download-btn";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="12" height="12">
        <path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
      </svg>
      <span>下載匯入</span>
    `;

    // Localize download button text
    btn.querySelector("span").textContent = isChineseUser ? "下載匯入" : "Install";

    btn.addEventListener("click", async () => {
      btn.classList.add("loading");
      btn.disabled = true;
      btn.querySelector("span").textContent = isChineseUser ? "下載中..." : "Downloading...";

      showToast(isChineseUser ? `開始下載主題包 ${theme.name}...` : `Downloading theme ${theme.name}...`);

      try {
        const response = await fetch(theme.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const filename = theme.url.split("/").pop() || `${theme.name}.zip`;
        
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

function initRssWidget() {
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

let rssRotationInterval = null;
let currentRssIndex = 0;

function startRssRotation(items) {
  if (rssRotationInterval) {
    clearInterval(rssRotationInterval);
  }
  
  const linkEl = document.getElementById("rss-ticker-link");
  if (!linkEl || !items || items.length === 0) return;

  currentRssIndex = 0;
  
  const displayItem = (index) => {
    const item = items[index];
    
    // Smooth transition
    linkEl.classList.add("fade-out");
    
    setTimeout(() => {
      linkEl.href = item.link;
      linkEl.textContent = `[${item.source}] ${item.title}`;
      linkEl.classList.remove("fade-out");
      linkEl.classList.add("fade-in");
      
      // Request reflow
      void linkEl.offsetWidth;
      
      linkEl.classList.remove("fade-in");
    }, 300);
  };
  
  // Display first item
  displayItem(currentRssIndex);
  
  // Rotate every 5 seconds
  rssRotationInterval = setInterval(() => {
    currentRssIndex = (currentRssIndex + 1) % items.length;
    displayItem(currentRssIndex);
  }, 5000);
}

async function loadRssFeeds(forceRefresh = false) {
  const linkEl = document.getElementById("rss-ticker-link");
  if (!linkEl) return;

  const cacheKey = "just_new_tab_rss_cache";
  const cacheTimeKey = "just_new_tab_rss_cache_time";
  const cachedData = localStorage.getItem(cacheKey);
  const cachedTime = localStorage.getItem(cacheTimeKey) || 0;

  // Cache is valid for 15 minutes
  if (!forceRefresh && cachedData && (Date.now() - cachedTime < 15 * 60 * 1000)) {
    try {
      const items = JSON.parse(cachedData);
      startRssRotation(items);
      return;
    } catch(e) {
      console.error("Failed to parse cached RSS data:", e);
    }
  }

  linkEl.innerHTML = `
    <div class="rss-loading-spinner"></div>
    <span>載入中...</span>
  `;
  linkEl.querySelector("span").textContent = isChineseUser ? "正在讀取訂閱內容..." : "Loading subscriptions...";
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
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
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

  // Sort by date descending
  allItems.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Limit to top 15 items
  const finalItems = allItems.slice(0, 15);

  if (finalItems.length === 0) {
    linkEl.textContent = isChineseUser ? "讀取失敗，請檢查網路或連結格式" : "Failed to load feeds. Check connections.";
    return;
  }

  // Cache final items
  try {
    localStorage.setItem(cacheKey, JSON.stringify(finalItems));
    localStorage.setItem(cacheTimeKey, Date.now());
  } catch(e) {}

  startRssRotation(finalItems);
}

function parseRSS(xmlText, sourceName) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const items = [];

  const getCleanText = (el) => {
    if (!el) return "";
    return el.textContent || el.text || "";
  };

  // RSS 2.0
  const rssItems = xmlDoc.querySelectorAll("item");
  if (rssItems && rssItems.length > 0) {
    rssItems.forEach(node => {
      const title = getCleanText(node.querySelector("title")) || "Untitled";
      
      let link = "";
      const linkEl = node.querySelector("link");
      if (linkEl) {
        link = linkEl.textContent || linkEl.text || linkEl.innerHTML || "";
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
    // Atom
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

// RSS can fetch arbitrary user-subscribed feeds, so the broad host access lives in
// optional_host_permissions and is only requested (via a user gesture) when RSS is enabled.
function requestHostPermission(origins) {
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

// request() resolves true immediately (no prompt) if the permission is already granted.
function ensureRssHostPermission() {
  return requestHostPermission(["http://*/*", "https://*/*"]);
}

function initRssSettings() {
  const toggleRss = document.getElementById("toggle-rss");
  const btnAddRss = document.getElementById("btn-add-rss");
  const rssInputName = document.getElementById("rss-input-name");
  const rssInputUrl = document.getElementById("rss-input-url");

  if (toggleRss) {
    toggleRss.checked = settings.widgets.rss !== false;
    toggleRss.addEventListener("change", async () => {
      // Acquire broad host access on demand the first time RSS is turned on.
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

function renderDrawerRssSubscriptions() {
  const listEl = document.getElementById("rss-feeds-list");
  if (!listEl) return;
  listEl.innerHTML = "";

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
    deleteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14">
        <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
    `;

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

/* ==========================================================================
   Reminders & Calendar — Tier 1 (local reminders, no permissions) and
   Tier 2 (read-only ICS calendar subscriptions). Both widgets default to OFF
   and live in the "Reminders & Calendar" drawer tab + the top-left agenda card.
   ========================================================================== */

// Format a date for the compact agenda card: "今天 / 明天 / M/D" plus optional time.
function fmtAgendaWhen(d, allDay) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startOfDay.getTime() - startOfToday.getTime()) / 86400000);

  let dayLabel;
  if (dayDiff === 0) dayLabel = isChineseUser ? "今天" : "Today";
  else if (dayDiff === 1) dayLabel = isChineseUser ? "明天" : "Tomorrow";
  else if (dayDiff === -1) dayLabel = isChineseUser ? "昨天" : "Yesterday";
  else dayLabel = `${d.getMonth() + 1}/${d.getDate()}`;

  if (allDay) return dayLabel;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${dayLabel} ${hh}:${mm}`;
}

/* -------------------------- Tier 1: Local reminders ----------------------- */

function initReminders() {
  const toggle = document.getElementById("toggle-reminders");
  const addBtn = document.getElementById("btn-add-reminder");
  const inputText = document.getElementById("reminder-input-text");
  const inputDue = document.getElementById("reminder-input-due");

  if (toggle) {
    toggle.checked = !!settings.widgets.reminders;
    toggle.addEventListener("change", async () => {
      settings.widgets.reminders = toggle.checked;
      await saveSettings();
      applyWidgetVisibility();
      renderRemindersWidget();
    });
  }

  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      const text = inputText.value.trim();
      if (!text) {
        showToast(isChineseUser ? "請輸入提醒內容" : "Please enter a reminder");
        return;
      }

      let due = null;
      if (inputDue && inputDue.value) {
        const parsed = new Date(inputDue.value);
        if (!isNaN(parsed.getTime())) due = parsed.getTime();
      }

      if (!settings.reminders) settings.reminders = [];
      settings.reminders.push({
        id: Date.now(),
        text: text,
        due: due,
        done: false,
        createdAt: Date.now()
      });
      await saveSettings();

      inputText.value = "";
      if (inputDue) inputDue.value = "";

      renderDrawerReminders();
      renderRemindersWidget();
      showToast(isChineseUser ? "提醒新增成功" : "Reminder added");
    });
  }
}

// Sort: incomplete first, then by due (earliest first, undated last), then newest.
function sortedReminders() {
  const list = (settings.reminders || []).slice();
  return list.sort((a, b) => {
    if (!!a.done !== !!b.done) return a.done ? 1 : -1;
    if (a.due && b.due) return a.due - b.due;
    if (a.due) return -1;
    if (b.due) return 1;
    return b.createdAt - a.createdAt;
  });
}

function renderRemindersWidget() {
  const listEl = document.getElementById("reminders-widget-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  // Only show outstanding reminders on the new tab page.
  const items = sortedReminders().filter(r => !r.done).slice(0, 6);

  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "agenda-empty";
    li.textContent = isChineseUser ? "目前沒有提醒事項" : "No reminders";
    listEl.appendChild(li);
    return;
  }

  const now = Date.now();
  items.forEach((r) => {
    const li = document.createElement("li");
    li.className = "agenda-item";

    const main = document.createElement("div");
    main.className = "agenda-item-main";

    const text = document.createElement("span");
    text.className = "agenda-item-text";
    text.textContent = r.text;
    main.appendChild(text);

    if (r.due) {
      const due = document.createElement("span");
      due.className = "agenda-item-due";
      if (r.due < now) due.classList.add("overdue");
      due.textContent = fmtAgendaWhen(new Date(r.due), false);
      main.appendChild(due);
    }

    li.appendChild(main);
    listEl.appendChild(li);
  });
}

function renderDrawerReminders() {
  const listEl = document.getElementById("reminders-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  const items = sortedReminders();
  if (items.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.style.fontSize = "0.8rem";
    emptyMsg.style.color = "var(--text-muted)";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.padding = "1rem 0";
    emptyMsg.textContent = isChineseUser ? "目前尚無提醒事項" : "No reminders yet";
    listEl.appendChild(emptyMsg);
    return;
  }

  items.forEach((r) => {
    const item = document.createElement("div");
    item.className = "custom-quote-item" + (r.done ? " done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!r.done;
    checkbox.style.marginRight = "0.5rem";
    checkbox.style.flexShrink = "0";
    checkbox.addEventListener("change", async () => {
      const target = settings.reminders.find(x => x.id === r.id);
      if (target) {
        target.done = checkbox.checked;
        await saveSettings();
        renderDrawerReminders();
        renderRemindersWidget();
      }
    });

    const details = document.createElement("div");
    details.className = "custom-quote-details";

    const textSpan = document.createElement("span");
    textSpan.className = "custom-quote-text";
    if (r.done) textSpan.style.textDecoration = "line-through";
    textSpan.textContent = r.text;
    details.appendChild(textSpan);

    if (r.due) {
      const dueSpan = document.createElement("span");
      dueSpan.className = "custom-quote-author";
      dueSpan.style.textAlign = "left";
      dueSpan.textContent = fmtAgendaWhen(new Date(r.due), false);
      details.appendChild(dueSpan);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "rss-delete-btn";
    deleteBtn.title = isChineseUser ? "刪除此提醒" : "Delete reminder";
    deleteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14">
        <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
    `;
    deleteBtn.addEventListener("click", async () => {
      const idx = settings.reminders.findIndex(x => x.id === r.id);
      if (idx > -1) {
        settings.reminders.splice(idx, 1);
        await saveSettings();
        renderDrawerReminders();
        renderRemindersWidget();
        showToast(isChineseUser ? "已刪除提醒" : "Reminder deleted");
      }
    });

    item.appendChild(checkbox);
    item.appendChild(details);
    item.appendChild(deleteBtn);
    listEl.appendChild(item);
  });
}

/* ------------------------ Tier 2: ICS calendar ---------------------------- */

const CAL_CACHE_KEY = "just_new_tab_cal_cache";
const CAL_CACHE_TIME_KEY = "just_new_tab_cal_cache_time";
const CAL_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const CAL_WINDOW_DAYS = 14;

function getCalendarOrigin(url) {
  try {
    return new URL(url).origin;
  } catch (e) {
    return null;
  }
}

function initCalendarSettings() {
  const toggle = document.getElementById("toggle-calendar");
  const addBtn = document.getElementById("btn-add-calendar");
  const inputName = document.getElementById("calendar-input-name");
  const inputUrl = document.getElementById("calendar-input-url");

  if (toggle) {
    toggle.checked = !!settings.widgets.calendar;
    toggle.addEventListener("change", async () => {
      if (toggle.checked) {
        // Ask for host access to the origins of any already-stored calendars.
        const origins = (settings.calendars || [])
          .map(c => c.origin || getCalendarOrigin(c.url))
          .filter(Boolean)
          .map(o => o + "/*");
        if (origins.length > 0) {
          const granted = await requestHostPermission(origins);
          if (!granted) {
            toggle.checked = false;
            showToast(isChineseUser ? "需要存取行事曆網址的權限" : "Permission to access the calendar URL is required");
            return;
          }
        }
      }
      settings.widgets.calendar = toggle.checked;
      await saveSettings();
      applyWidgetVisibility();
      if (settings.widgets.calendar) {
        renderCalendarWidget();
        fetchCalendars(true);
      }
    });
  }

  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      const name = inputName.value.trim();
      let url = inputUrl.value.trim();

      if (!name || !url) {
        showToast(isChineseUser ? "請填寫名稱與 iCal 網址" : "Please fill in the name and iCal URL");
        return;
      }

      // Google exposes ICS via a webcal:// link too; normalise to https.
      url = url.replace(/^webcal:\/\//i, "https://");
      if (!/^https?:\/\//i.test(url)) url = "https://" + url;

      const origin = getCalendarOrigin(url);
      if (!origin) {
        showToast(isChineseUser ? "網址格式錯誤" : "Invalid URL format");
        return;
      }

      // Request host access for this calendar's origin on the user gesture.
      const granted = await requestHostPermission([origin + "/*"]);
      if (!granted) {
        showToast(isChineseUser ? "需要存取此網址的權限才能讀取行事曆" : "Permission is required to read this calendar");
        return;
      }

      if (!settings.calendars) settings.calendars = [];
      settings.calendars.push({ id: Date.now(), name, url, origin });
      await saveSettings();

      inputName.value = "";
      inputUrl.value = "";

      renderDrawerCalendars();
      showToast(isChineseUser ? "已新增行事曆訂閱" : "Calendar subscription added");

      if (settings.widgets.calendar) fetchCalendars(true);
    });
  }
}

function initCalendarWidget() {
  if (!settings.widgets.calendar) return;
  renderCalendarWidget(); // show cached events instantly
  const cachedTime = parseInt(localStorage.getItem(CAL_CACHE_TIME_KEY) || "0", 10);
  if (Date.now() - cachedTime >= CAL_CACHE_TTL) {
    fetchCalendars(); // refresh in the background if stale
  }
}

async function fetchCalendars(forceRefresh = false) {
  const subs = settings.calendars || [];
  if (subs.length === 0) {
    localStorage.removeItem(CAL_CACHE_KEY);
    localStorage.removeItem(CAL_CACHE_TIME_KEY);
    renderCalendarWidget();
    return;
  }

  const cachedTime = parseInt(localStorage.getItem(CAL_CACHE_TIME_KEY) || "0", 10);
  if (!forceRefresh && Date.now() - cachedTime < CAL_CACHE_TTL) {
    return; // cache still fresh
  }

  const now = new Date();
  const winStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // start of today
  const winEnd = new Date(winStart.getTime() + CAL_WINDOW_DAYS * 86400000);

  const allEvents = [];
  const fetchPromises = subs.map(async (sub) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(sub.url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const text = await response.text();
      const events = parseICS(text);
      events.forEach((ev) => {
        expandRecurring(ev, winStart, winEnd).forEach((occ) => {
          allEvents.push({
            summary: occ.summary,
            start: occ.start.getTime(),
            allDay: occ.allDay,
            source: sub.name
          });
        });
      });
    } catch (err) {
      console.error(`Failed to fetch calendar ${sub.name} (${sub.url}):`, err.message || err);
    }
  });

  await Promise.allSettled(fetchPromises);

  allEvents.sort((a, b) => a.start - b.start);
  const finalEvents = allEvents.slice(0, 30);

  try {
    localStorage.setItem(CAL_CACHE_KEY, JSON.stringify(finalEvents));
    localStorage.setItem(CAL_CACHE_TIME_KEY, String(Date.now()));
  } catch (e) {}

  renderCalendarWidget();
}

function renderCalendarWidget() {
  const listEl = document.getElementById("calendar-widget-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  let events = [];
  try {
    const cached = localStorage.getItem(CAL_CACHE_KEY);
    if (cached) events = JSON.parse(cached);
  } catch (e) {}

  // Drop events that have already passed (cache may be up to 30 min old).
  const now = Date.now();
  events = events
    .filter(ev => ev.allDay || ev.start >= now - 60 * 60 * 1000)
    .slice(0, 6);

  if (events.length === 0) {
    const li = document.createElement("li");
    li.className = "agenda-empty";
    li.textContent = (settings.calendars || []).length === 0
      ? (isChineseUser ? "尚未新增行事曆" : "No calendar added")
      : (isChineseUser ? "近期沒有行程" : "No upcoming events");
    listEl.appendChild(li);
    return;
  }

  events.forEach((ev) => {
    const li = document.createElement("li");
    li.className = "agenda-item";

    const main = document.createElement("div");
    main.className = "agenda-item-main";

    const text = document.createElement("span");
    text.className = "agenda-item-text";
    text.textContent = ev.summary || (isChineseUser ? "(無標題)" : "(no title)");
    main.appendChild(text);

    li.appendChild(main);

    const time = document.createElement("span");
    time.className = "agenda-item-time";
    time.textContent = fmtAgendaWhen(new Date(ev.start), ev.allDay);
    li.appendChild(time);

    listEl.appendChild(li);
  });
}

function renderDrawerCalendars() {
  const listEl = document.getElementById("calendars-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  const subs = settings.calendars || [];
  if (subs.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.style.fontSize = "0.8rem";
    emptyMsg.style.color = "var(--text-muted)";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.padding = "1rem 0";
    emptyMsg.textContent = isChineseUser ? "目前尚無行事曆訂閱" : "No calendar subscriptions yet";
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
    // Avoid showing the full secret URL; the origin is enough to identify it.
    urlSpan.textContent = sub.origin || sub.url;

    details.appendChild(nameSpan);
    details.appendChild(urlSpan);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "rss-delete-btn";
    deleteBtn.title = isChineseUser ? "刪除此訂閱" : "Delete subscription";
    deleteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14">
        <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
    `;
    deleteBtn.addEventListener("click", async () => {
      const idx = settings.calendars.findIndex(c => c.id === sub.id);
      if (idx > -1) {
        const removed = settings.calendars.splice(idx, 1)[0];
        await saveSettings();
        // Release the host permission if no other calendar uses that origin.
        const origin = removed.origin || getCalendarOrigin(removed.url);
        if (origin && !settings.calendars.some(c => (c.origin || getCalendarOrigin(c.url)) === origin)) {
          try {
            if (typeof browser !== "undefined" && browser.permissions) {
              browser.permissions.remove({ origins: [origin + "/*"] });
            } else if (typeof chrome !== "undefined" && chrome.permissions) {
              chrome.permissions.remove({ origins: [origin + "/*"] }, () => {});
            }
          } catch (e) {}
        }
        renderDrawerCalendars();
        fetchCalendars(true);
        showToast(isChineseUser ? "已刪除行事曆訂閱" : "Calendar subscription deleted");
      }
    });

    item.appendChild(details);
    item.appendChild(deleteBtn);
    listEl.appendChild(item);
  });
}

/* ----------------------------- ICS parsing -------------------------------- */

// Parse an ICS document into raw VEVENTs. Recurrence is left as an rrule object
// for expandRecurring() to materialise within the display window.
function parseICS(text) {
  // Unfold folded lines (continuation lines start with a space or tab).
  const rawLines = text.split(/\r\n|\n|\r/);
  const lines = [];
  for (const line of rawLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }

  const events = [];
  let cur = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur && cur.start) {
        events.push({
          summary: cur.summary || "",
          start: cur.start,
          end: cur.end || null,
          allDay: !!cur.allDay,
          rrule: cur.rrule || null
        });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue; // malformed line; skip

    const namePart = line.slice(0, colonIdx);
    const value = line.slice(colonIdx + 1);
    const segments = namePart.split(";");
    const propName = segments[0].toUpperCase();
    const params = {};
    for (let i = 1; i < segments.length; i++) {
      const eq = segments[i].indexOf("=");
      if (eq > -1) params[segments[i].slice(0, eq).toUpperCase()] = segments[i].slice(eq + 1).toUpperCase();
    }

    if (propName === "SUMMARY") {
      cur.summary = unescapeICS(value);
    } else if (propName === "DTSTART") {
      const parsed = parseICSDate(value, params);
      if (parsed) { cur.start = parsed.date; cur.allDay = parsed.allDay; }
    } else if (propName === "DTEND") {
      const parsed = parseICSDate(value, params);
      if (parsed) cur.end = parsed.date;
    } else if (propName === "RRULE") {
      cur.rrule = parseRRule(value);
    }
  }

  return events;
}

function unescapeICS(str) {
  return str
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

// Returns { date: Date, allDay: boolean } or null.
function parseICSDate(value, params) {
  const v = (value || "").trim();
  const isDateOnly = (params && params.VALUE === "DATE") || /^\d{8}$/.test(v);

  if (isDateOnly) {
    const m = v.match(/^(\d{4})(\d{2})(\d{2})/);
    if (!m) return null;
    return {
      date: new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)),
      allDay: true
    };
  }

  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/);
  if (!m) return null;
  const [, y, mo, d, hh, mm, ss, z] = m;
  const sec = ss ? parseInt(ss, 10) : 0;
  if (z) {
    return {
      date: new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mm, sec)),
      allDay: false
    };
  }
  // Floating or TZID time: interpret in the local timezone (best effort).
  return {
    date: new Date(+y, +mo - 1, +d, +hh, +mm, sec),
    allDay: false
  };
}

function parseRRule(value) {
  const rule = {};
  value.split(";").forEach((pair) => {
    const eq = pair.indexOf("=");
    if (eq < 0) return;
    const key = pair.slice(0, eq).toUpperCase();
    const val = pair.slice(eq + 1);
    if (key === "BYDAY") {
      const map = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
      rule.BYDAY = val.split(",")
        .map(d => map[d.trim().toUpperCase().slice(-2)])
        .filter(n => n !== undefined)
        .sort((a, b) => a - b);
    } else if (key === "UNTIL") {
      const parsed = parseICSDate(val, {});
      if (parsed) rule.UNTIL = parsed.date;
    } else {
      rule[key] = val.toUpperCase();
    }
  });
  return rule;
}

// Materialise recurrence occurrences that fall within [winStart, winEnd].
// Supports DAILY/WEEKLY/MONTHLY/YEARLY with INTERVAL, COUNT, UNTIL and
// (for weekly) BYDAY. Capped to stay safe on pathological rules.
function expandRecurring(ev, winStart, winEnd) {
  if (!ev.rrule || !ev.rrule.FREQ) {
    if (ev.start >= winStart && ev.start <= winEnd) return [ev];
    return [];
  }

  const r = ev.rrule;
  const freq = r.FREQ;
  const interval = Math.max(1, parseInt(r.INTERVAL || "1", 10) || 1);
  const count = r.COUNT ? parseInt(r.COUNT, 10) : null;
  const until = r.UNTIL || null;
  const MAX_ITER = 800;

  const out = [];
  const base = ev.start;
  let total = 0;
  let stopped = false;

  const consider = (d) => {
    // Returns false to signal the generator to stop.
    if (until && d.getTime() > until.getTime()) return false;
    if (d.getTime() > winEnd.getTime()) return false;
    total++;
    if (count && total > count) return false;
    if (d.getTime() >= winStart.getTime() && d.getTime() <= winEnd.getTime()) {
      out.push({ summary: ev.summary, start: new Date(d), allDay: ev.allDay });
    }
    return true;
  };

  if (freq === "WEEKLY" && Array.isArray(r.BYDAY) && r.BYDAY.length > 0) {
    // Start from the Sunday of the base week.
    let weekStart = new Date(base);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    for (let w = 0; w < MAX_ITER && !stopped; w++) {
      for (const wd of r.BYDAY) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + wd);
        d.setHours(base.getHours(), base.getMinutes(), base.getSeconds(), 0);
        if (d.getTime() < base.getTime()) continue; // before the series start
        if (!consider(d)) { stopped = true; break; }
      }
      weekStart.setDate(weekStart.getDate() + 7 * interval);
    }
  } else {
    const cursor = new Date(base);
    for (let i = 0; i < MAX_ITER; i++) {
      if (!consider(new Date(cursor))) break;
      if (freq === "DAILY") cursor.setDate(cursor.getDate() + interval);
      else if (freq === "WEEKLY") cursor.setDate(cursor.getDate() + 7 * interval);
      else if (freq === "MONTHLY") cursor.setMonth(cursor.getMonth() + interval);
      else if (freq === "YEARLY") cursor.setFullYear(cursor.getFullYear() + interval);
      else break; // unsupported frequency
    }
  }

  return out;
}

/* ==========================================================================
   Import Top Sites — one-time helper to pull the browser's most-visited
   (and, on Firefox, pinned) sites into Quick Links. Uses the optional
   "topSites" permission, requested only when the user clicks Import.
   ========================================================================== */

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
        // Firefox: include the user's pinned shortcuts, skip search shortcuts.
        browser.topSites.get({ includePinned: true, includeSearchShortcuts: false, limit: 30 })
          .then((sites) => resolve(sites || []))
          .catch(() => resolve([]));
      } else if (typeof chrome !== "undefined" && chrome.topSites && chrome.topSites.get) {
        // Chrome: most-visited only (no access to manually pinned NTP tiles).
        chrome.topSites.get((sites) => resolve(sites || []));
      } else {
        resolve(null); // API unavailable
      }
    } catch (e) {
      resolve(null);
    }
  });
}

// Normalise a URL for dedupe: host + path, lower-cased, no trailing slash.
function normalizeLinkUrl(u) {
  try {
    const url = new URL(u);
    return (url.hostname + url.pathname).replace(/\/$/, "").toLowerCase();
  } catch (e) {
    return (u || "").trim().toLowerCase();
  }
}

function initTopSitesImport() {
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

    // Drop entries already present in Quick Links (and de-dupe the list itself).
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

    listEl.innerHTML = "";
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
        img.src = `https://www.google.com/s2/favicons?sz=64&domain=${c.host}`;
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

    // Stash candidates for the add handler.
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
