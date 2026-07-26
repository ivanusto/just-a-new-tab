// Just a New Tab - State & Storage Module
import { DEFAULT_SETTINGS, DEFAULT_QUICK_LINKS, WORLD_CITIES, DEFAULT_BG_COUNT } from './config.js';

export let settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
export let quickLinks = JSON.parse(JSON.stringify(DEFAULT_QUICK_LINKS));

export let isChineseUser = true;
export let isSimplifiedChinese = false;

// Synchronous execution using cached settings to prevent flickers
export function preLoadCache() {
  const cachedSettingsStr = localStorage.getItem("just_new_tab_settings");
  const cachedLinksStr = localStorage.getItem("just_new_tab_links");
  
  // Detect UI language
  const uiLang = (typeof chrome !== "undefined" && chrome.i18n) ? chrome.i18n.getUILanguage() : navigator.language;
  isChineseUser = uiLang ? uiLang.startsWith("zh") : true;
  isSimplifiedChinese = uiLang ? uiLang.toLowerCase().replace('_', '-') === 'zh-cn' : false;

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
}

// Load settings from Chrome/Browser local storage
export async function loadSettings() {
  const defaultSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  
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

  // Filter out invalid default wallpaper IDs
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
  if (settings.secondClock === undefined) settings.secondClock = defaultSettings.secondClock;
  if (settings.secondClockCity === undefined) settings.secondClockCity = defaultSettings.secondClockCity;
  if (settings.secondClockCustom === undefined) settings.secondClockCustom = defaultSettings.secondClockCustom;
  if (settings.secondClockPosition === undefined) settings.secondClockPosition = defaultSettings.secondClockPosition;
  if (settings.thirdClock === undefined) settings.thirdClock = defaultSettings.thirdClock;
  if (settings.thirdClockCity === undefined) settings.thirdClockCity = defaultSettings.thirdClockCity;
  if (settings.thirdClockCustom === undefined) settings.thirdClockCustom = defaultSettings.thirdClockCustom;
  if (settings.thirdClockPosition === undefined) settings.thirdClockPosition = defaultSettings.thirdClockPosition;
  if (settings.weather === undefined) settings.weather = defaultSettings.weather;
  if (settings.weatherCity === undefined) settings.weatherCity = defaultSettings.weatherCity;
  if (settings.weatherUnit === undefined) settings.weatherUnit = defaultSettings.weatherUnit;
  if (settings.bgRotateSyncQuote === undefined) settings.bgRotateSyncQuote = defaultSettings.bgRotateSyncQuote;
  if (settings.cloudQuoteSource === undefined) {
    settings.cloudQuoteSource = isSimplifiedChinese ? "hitokoto" : "zenquotes";
  }

  // Write back to localStorage to cache it
  localStorage.setItem("just_new_tab_settings", JSON.stringify(settings));
  localStorage.setItem("just_new_tab_links", JSON.stringify(quickLinks));
}

// Save settings to storage
export async function saveSettings() {
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

export function updateQuickLinks(newLinks) {
  quickLinks = newLinks;
  saveSettings();
}

export function getCityByKey(key) {
  return WORLD_CITIES.find(c => c.key === key) || WORLD_CITIES.find(c => c.key === "new_york");
}

export function cityDisplayName(city) {
  if (!city) return "";
  if (city.custom) return city.name;
  if (isSimplifiedChinese) return city.zhCN;
  if (isChineseUser) return city.zh;
  return city.en;
}

export function getClockCity(prefix) {
  if (settings[prefix + "ClockCity"] === "custom") {
    return settings[prefix + "ClockCustom"] || null;
  }
  return getCityByKey(settings[prefix + "ClockCity"]);
}
