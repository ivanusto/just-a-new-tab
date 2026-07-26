// Just a New Tab - Reminders & ICS Calendar Module
import { settings, saveSettings, isChineseUser } from './storage.js';
import { showToast, applyWidgetVisibility } from './uiDrawer.js';
import { requestHostPermission } from './rss.js';

export function fmtAgendaWhen(d, allDay) {
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

export function parseFlexibleTime(raw) {
  const s = String(raw == null ? "" : raw).trim();
  if (!s) return null;
  let h, m;
  if (s.includes(":")) {
    const parts = s.split(":");
    if (parts.length !== 2 || !/^\d{1,2}$/.test(parts[0]) || !/^\d{1,2}$/.test(parts[1])) return null;
    h = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
  } else {
    if (!/^\d{1,4}$/.test(s)) return null;
    if (s.length <= 2) { h = parseInt(s, 10); m = 0; }
    else if (s.length === 3) { h = parseInt(s.slice(0, 1), 10); m = parseInt(s.slice(1), 10); }
    else { h = parseInt(s.slice(0, 2), 10); m = parseInt(s.slice(2), 10); }
  }
  if (!(Number.isInteger(h) && Number.isInteger(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59)) return null;
  return { h, m };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function initReminders() {
  const toggle = document.getElementById("toggle-reminders");
  const addBtn = document.getElementById("btn-add-reminder");
  const inputText = document.getElementById("reminder-input-text");
  const inputDate = document.getElementById("reminder-input-date");
  const inputTime = document.getElementById("reminder-input-time");

  if (toggle) {
    toggle.checked = !!settings.widgets.reminders;
    toggle.addEventListener("change", async () => {
      settings.widgets.reminders = toggle.checked;
      await saveSettings();
      applyWidgetVisibility();
      renderRemindersWidget();
    });
  }

  if (inputTime) {
    inputTime.addEventListener("blur", () => {
      const parsed = parseFlexibleTime(inputTime.value);
      if (parsed) inputTime.value = `${pad2(parsed.h)}:${pad2(parsed.m)}`;
    });
  }

  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      const text = inputText.value.trim();
      if (!text) {
        showToast(isChineseUser ? "請輸入提醒內容" : "Please enter a reminder");
        return;
      }

      const dateVal = inputDate ? inputDate.value : "";
      const timeRaw = inputTime ? inputTime.value.trim() : "";

      let due = null;
      if (dateVal || timeRaw) {
        let hm = { h: 0, m: 0 };
        if (timeRaw) {
          const parsed = parseFlexibleTime(timeRaw);
          if (!parsed) {
            showToast(isChineseUser ? "請輸入有效時間（例如 09:30 或 0930）" : "Please enter a valid time (e.g. 09:30 or 0930)");
            return;
          }
          hm = parsed;
        }
        let base;
        if (dateVal) {
          const dm = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (!dm) {
            showToast(isChineseUser ? "請選擇有效的日期" : "Please pick a valid date");
            return;
          }
          base = new Date(+dm[1], +dm[2] - 1, +dm[3], hm.h, hm.m, 0, 0);
        } else {
          const now = new Date();
          base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hm.h, hm.m, 0, 0);
        }
        if (isNaN(base.getTime())) {
          showToast(isChineseUser ? "日期或時間無效" : "Invalid date or time");
          return;
        }
        due = base.getTime();
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
      if (inputDate) inputDate.value = "";
      if (inputTime) inputTime.value = "";

      renderDrawerReminders();
      renderRemindersWidget();
      showToast(isChineseUser ? "提醒新增成功" : "Reminder added");
    });
  }
}

export function sortedReminders() {
  const list = (settings.reminders || []).slice();
  return list.sort((a, b) => {
    if (!!a.done !== !!b.done) return a.done ? 1 : -1;
    if (a.due && b.due) return a.due - b.due;
    if (a.due) return -1;
    if (b.due) return 1;
    return b.createdAt - a.createdAt;
  });
}

export function renderRemindersWidget() {
  const listEl = document.getElementById("reminders-widget-list");
  if (!listEl) return;
  listEl.replaceChildren();

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

export function renderDrawerReminders() {
  const listEl = document.getElementById("reminders-list");
  if (!listEl) return;
  listEl.replaceChildren();

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

const CAL_CACHE_KEY = "just_new_tab_cal_cache";
const CAL_CACHE_TIME_KEY = "just_new_tab_cal_cache_time";
const CAL_CACHE_TTL = 30 * 60 * 1000;
const CAL_WINDOW_DAYS = 14;

export function getCalendarOrigin(url) {
  try {
    return new URL(url).origin;
  } catch (e) {
    return null;
  }
}

export function initCalendarSettings() {
  const toggle = document.getElementById("toggle-calendar");
  const addBtn = document.getElementById("btn-add-calendar");
  const inputName = document.getElementById("calendar-input-name");
  const inputUrl = document.getElementById("calendar-input-url");

  if (toggle) {
    toggle.checked = !!settings.widgets.calendar;
    toggle.addEventListener("change", async () => {
      if (toggle.checked) {
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

      url = url.replace(/^webcal:\/\//i, "https://");
      if (!/^https?:\/\//i.test(url)) url = "https://" + url;

      const origin = getCalendarOrigin(url);
      if (!origin) {
        showToast(isChineseUser ? "網址格式錯誤" : "Invalid URL format");
        return;
      }

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

export function initCalendarWidget() {
  if (!settings.widgets.calendar) return;
  renderCalendarWidget();
  const cachedTime = parseInt(localStorage.getItem(CAL_CACHE_TIME_KEY) || "0", 10);
  if (Date.now() - cachedTime >= CAL_CACHE_TTL) {
    fetchCalendars();
  }
}

export async function fetchCalendars(forceRefresh = false) {
  const subs = settings.calendars || [];
  if (subs.length === 0) {
    localStorage.removeItem(CAL_CACHE_KEY);
    localStorage.removeItem(CAL_CACHE_TIME_KEY);
    renderCalendarWidget();
    return;
  }

  const cachedTime = parseInt(localStorage.getItem(CAL_CACHE_TIME_KEY) || "0", 10);
  if (!forceRefresh && Date.now() - cachedTime < CAL_CACHE_TTL) {
    return;
  }

  const now = new Date();
  const winStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

export function renderCalendarWidget() {
  const listEl = document.getElementById("calendar-widget-list");
  if (!listEl) return;
  listEl.replaceChildren();

  let events = [];
  try {
    const cached = localStorage.getItem(CAL_CACHE_KEY);
    if (cached) events = JSON.parse(cached);
  } catch (e) {}

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

export function renderDrawerCalendars() {
  const listEl = document.getElementById("calendars-list");
  if (!listEl) return;
  listEl.replaceChildren();

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
    urlSpan.textContent = sub.origin || sub.url;

    details.appendChild(nameSpan);
    details.appendChild(urlSpan);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "rss-delete-btn";
    deleteBtn.title = isChineseUser ? "刪除此訂閱" : "Delete subscription";
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
      const idx = settings.calendars.findIndex(c => c.id === sub.id);
      if (idx > -1) {
        const removed = settings.calendars.splice(idx, 1)[0];
        await saveSettings();
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

export function parseICS(text) {
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
    if (colonIdx < 0) continue;

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

export function unescapeICS(str) {
  return str
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

export function parseICSDate(value, params) {
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
  return {
    date: new Date(+y, +mo - 1, +d, +hh, +mm, sec),
    allDay: false
  };
}

export function parseRRule(value) {
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

export function expandRecurring(ev, winStart, winEnd) {
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
    let weekStart = new Date(base);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    for (let w = 0; w < MAX_ITER && !stopped; w++) {
      for (const wd of r.BYDAY) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + wd);
        d.setHours(base.getHours(), base.getMinutes(), base.getSeconds(), 0);
        if (d.getTime() < base.getTime()) continue;
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
      else break;
    }
  }

  return out;
}
