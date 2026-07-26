// Just a New Tab - Main Script Entry (ES Modules)
import { preLoadCache, loadSettings, settings } from './js/storage.js';
import { translatePage, applyWidgetVisibility, initDrawer, startBgAutoRotate, initQuoteSearch, showToast } from './js/uiDrawer.js';
import { initClock, initGreeting } from './js/clock.js';
import { initSearch, initQuote, renderLocalQuoteSynchronously, loadCloudQuote } from './js/quoteSearch.js';
import { initQuickLinks, renderQuickLinks } from './js/quickLinks.js';
import { setRandomBackground, initUpload, initZipImport, initOfficialThemes } from './js/themesBackgrounds.js';
import { initRssSettings, initRssWidget } from './js/rss.js';
import { initBackupRestore } from './js/backup.js';
import { initReminders, renderRemindersWidget, initCalendarSettings, initCalendarWidget } from './js/remindersCalendar.js';
import { initTopSitesImport } from './js/uiDrawer.js';
import { initWeather } from './js/weather.js';

// Pre-load cache synchronously to prevent UI flickering
preLoadCache();

// Main Initialization Event
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Instantly apply localization text tags
  translatePage();
  
  // 2. Load cached widgets instantly (No flicker!)
  initClock();
  initGreeting();
  initSearch();
  initQuoteSearch();
  applyWidgetVisibility();
  
  // Initialize shortcut buttons click handlers
  initQuickLinks();
  
  // Handle Quote display intelligently
  if (!settings.widgets.cloudQuotes) {
    renderLocalQuoteSynchronously();
  } else {
    const quoteWidget = document.getElementById("quote-widget");
    if (quoteWidget) quoteWidget.style.opacity = "0";
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
  initWeather();
  
  if (settings.widgets.cloudQuotes) {
    await loadCloudQuote();
  }
});
