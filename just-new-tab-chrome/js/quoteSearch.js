// Just a New Tab - Quote & Search Module
import { JUST_QUOTES, EN_QUOTES } from './config.js';
import { settings, saveSettings, isChineseUser, isSimplifiedChinese } from './storage.js';

export function renderLocalQuoteSynchronously() {
  const textEl = document.getElementById("quote-text");
  const authorEl = document.getElementById("quote-author");
  if (!textEl || !authorEl) return;

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
  
  const quoteWidget = document.getElementById("quote-widget");
  if (quoteWidget) quoteWidget.style.opacity = "1";
}

export async function translateToTraditional(text) {
  if (!text) return "";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
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
  return text;
}

export async function loadCloudQuote() {
  if (!settings.widgets.quote || !settings.widgets.cloudQuotes) return;
  
  const textEl = document.getElementById("quote-text");
  const authorEl = document.getElementById("quote-author");
  const widget = document.getElementById("quote-widget");
  if (!textEl || !authorEl || !widget) return;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
  
  try {
    let quoteText = "";
    let quoteAuthor = "";
    const source = settings.cloudQuoteSource || (isSimplifiedChinese ? "hitokoto" : "zenquotes");
    
    if (source === "hitokoto") {
      const response = await fetch("https://v1.hitokoto.cn/?c=d&c=i", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        quoteText = `“${data.hitokoto}”`;
        quoteAuthor = `— ${data.from_author || data.from || '网络'}`;
      }
    } else if (source === "animechan") {
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
            quoteText = `"${rawText}"`;
            quoteAuthor = `— ${rawAuthor || 'Anonymous'}`;
          }
        }
      }
    } else {
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
          console.log("Failed to fetch cloud quotes, using fallback cache:", fetchErr.message || fetchErr);
          if (cachedQuotes && Array.isArray(cachedQuotes) && cachedQuotes.length > 0) {
            quotesList = cachedQuotes;
          }
        }
      }
      
      if (quotesList.length > 0) {
        const randomIndex = Math.floor(Math.random() * quotesList.length);
        const item = quotesList[randomIndex];
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
    console.log("Failed to fetch cloud quote, falling back to local:", err.message || err);
    if (widget.style.opacity === "0" || !widget.style.opacity) {
      renderLocalQuoteSynchronously();
    }
  }
}

export function initQuote() {
  if (settings.widgets.cloudQuotes) {
    const widget = document.getElementById("quote-widget");
    if (widget) widget.style.opacity = "0";
    loadCloudQuote();
  } else {
    renderLocalQuoteSynchronously();
  }
}

// Search goes through the browser's Search API so queries always run on an
// engine installed in the browser (CWS policy: new-tab search must honor user
// settings). Chrome only exposes the user's default engine; Firefox can also
// list installed engines and search with a chosen one.
export function runBrowserSearch(query, disposition) {
  if (typeof browser !== "undefined" && browser.search && browser.search.query) {
    browser.search.query({ text: query, disposition });
  } else if (typeof chrome !== "undefined" && chrome.search && chrome.search.query) {
    chrome.search.query({ text: query, disposition });
  }
}

// Firefox-only APIs for the engine picker (absent on Chrome).
function canPickEngine() {
  return typeof browser !== "undefined" && browser.search &&
    typeof browser.search.get === "function" &&
    typeof browser.search.search === "function";
}

async function populateEngineSelect(engineSelect) {
  try {
    const engines = await browser.search.get();
    if (!engines || !engines.length) return;
    engineSelect.replaceChildren();
    engines.forEach((engine) => {
      const opt = document.createElement("option");
      opt.value = engine.name;
      opt.textContent = engine.name;
      engineSelect.appendChild(opt);
    });
    const saved = settings.searchEngine;
    if (saved && engines.some((engine) => engine.name === saved)) {
      engineSelect.value = saved;
    } else {
      const def = engines.find((engine) => engine.isDefault);
      if (def) engineSelect.value = def.name;
    }
    engineSelect.style.display = "";
  } catch (e) {
    engineSelect.style.display = "none";
  }
}

export function initSearch() {
  const searchWidget = document.getElementById("search-widget");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const engineSelect = document.getElementById("search-engine-select");

  if (!searchWidget) return;

  if (settings.widgets.search !== false) {
    searchWidget.classList.remove("widget-hidden");
  } else {
    searchWidget.classList.add("widget-hidden");
  }

  if (engineSelect && canPickEngine()) {
    populateEngineSelect(engineSelect);
    if (!engineSelect.dataset.listenerBound) {
      engineSelect.addEventListener("change", async () => {
        settings.searchEngine = engineSelect.value;
        await saveSettings();
      });
      engineSelect.dataset.listenerBound = "true";
    }
  }

  if (!searchForm.dataset.listenerBound) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (!query) return;
      const disposition = settings.searchInNewTab ? "NEW_TAB" : "CURRENT_TAB";
      if (canPickEngine() && engineSelect && engineSelect.value) {
        browser.search.search({ query, engine: engineSelect.value, disposition });
      } else {
        runBrowserSearch(query, disposition);
      }
    });
    searchForm.dataset.listenerBound = "true";
  }
}
