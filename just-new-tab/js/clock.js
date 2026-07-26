// Just a New Tab - Clock & Greeting Module
import { settings, isChineseUser, getClockCity, cityDisplayName } from './storage.js';

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function getZonedParts(tz) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false, weekday: "short",
    year: "numeric", month: "numeric", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
  const parts = {};
  for (const p of fmt.formatToParts(now)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return {
    hours: parseInt(parts.hour, 10) % 24,
    minutes: parseInt(parts.minute, 10),
    seconds: parseInt(parts.second, 10),
    year: parseInt(parts.year, 10),
    month: parseInt(parts.month, 10),
    day: parseInt(parts.day, 10),
    weekdayIndex: WEEKDAY_INDEX[parts.weekday] != null ? WEEKDAY_INDEX[parts.weekday] : now.getDay()
  };
}

export function formatClockDate(parts, tz) {
  if (isChineseUser) {
    const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    return `${parts.year}年${parts.month}月${parts.day}日 ${weekDays[parts.weekdayIndex]}`;
  }
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  if (tz) options.timeZone = tz;
  return new Date().toLocaleDateString(undefined, options);
}

export function renderClockFace(els, parts, showSeconds, isAnalog) {
  if (!els || !els.digital || !els.analog) return;
  if (isAnalog) {
    els.digital.style.display = "none";
    els.analog.style.display = "flex";

    const hrDegrees = ((parts.hours % 12) * 30) + (parts.minutes * 0.5);
    const minDegrees = (parts.minutes * 6) + (parts.seconds * 0.1);
    const secDegrees = parts.seconds * 6;

    if (els.hour) els.hour.style.transform = `rotate(${hrDegrees}deg)`;
    if (els.minute) els.minute.style.transform = `rotate(${minDegrees}deg)`;

    if (els.second) {
      if (showSeconds) {
        els.second.style.display = "block";
        els.second.style.transform = `rotate(${secDegrees}deg)`;
      } else {
        els.second.style.display = "none";
      }
    }
  } else {
    els.analog.style.display = "none";
    els.digital.style.display = "block";

    const hours = parts.hours.toString().padStart(2, "0");
    const minutes = parts.minutes.toString().padStart(2, "0");
    if (showSeconds) {
      const seconds = parts.seconds.toString().padStart(2, "0");
      els.digital.textContent = `${hours}:${minutes}:${seconds}`;
    } else {
      els.digital.textContent = `${hours}:${minutes}`;
    }
  }
}

export function buildClockMarks(faceId) {
  const face = document.getElementById(faceId);
  if (face && face.querySelectorAll(".clock-mark").length === 0) {
    for (let i = 0; i < 12; i++) {
      const mark = document.createElement("div");
      mark.className = "clock-mark" + (i % 3 === 0 ? " quarter" : "");
      mark.style.transform = `rotate(${i * 30}deg)`;
      face.appendChild(mark);
    }
  }
}

export const REMOTE_CLOCKS = [
  { el: "remote", cfg: "second" },
  { el: "third", cfg: "third" }
];

export function clockEls(prefix) {
  const analogId = prefix ? `${prefix}-analog-clock` : "analog-clock";
  const handId = h => prefix ? `${prefix}-analog-${h}` : `analog-${h}`;
  return {
    digital: document.getElementById(prefix ? `${prefix}-clock-time` : "clock-time"),
    analog: document.getElementById(analogId),
    hour: document.getElementById(handId("hour")),
    minute: document.getElementById(handId("minute")),
    second: document.getElementById(handId("second")),
    date: document.getElementById(prefix ? `${prefix}-clock-date` : "clock-date")
  };
}

export function initClock() {
  const localEls = clockEls("");
  const remoteSets = REMOTE_CLOCKS.map(rc => ({ ...rc, els: clockEls(rc.el) }));

  buildClockMarks("clock-face");
  buildClockMarks("remote-clock-face");
  buildClockMarks("third-clock-face");

  function updateClock() {
    const now = new Date();
    const showSeconds = settings.clockShowSeconds !== false;
    const isAnalog = settings.clockType === "analog";

    const localParts = {
      hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds(),
      year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(),
      weekdayIndex: now.getDay()
    };
    renderClockFace(localEls, localParts, showSeconds, isAnalog);
    if (localEls.date) localEls.date.textContent = formatClockDate(localParts, null);

    remoteSets.forEach(({ cfg, els }) => {
      if (!settings[cfg + "Clock"] || !els.digital) return;
      const city = getClockCity(cfg);
      if (!city || !city.tz) return;
      const rParts = getZonedParts(city.tz);
      renderClockFace(els, rParts, showSeconds, isAnalog);
      if (els.date) els.date.textContent = formatClockDate(rParts, city.tz);
    });
  }

  updateClock();

  if (window.clockInterval) {
    clearInterval(window.clockInterval);
  }
  window.clockInterval = setInterval(updateClock, 1000);
}

export const CLOCK_POSITIONS = ["left", "center", "right"];

export function clockPosKey(which) {
  return which === "local" ? "clockPosition" : which + "ClockPosition";
}
export function getClockPos(which) {
  const def = which === "local" ? "center" : which === "second" ? "right" : "left";
  return settings[clockPosKey(which)] || def;
}
export function setClockPos(which, pos) {
  settings[clockPosKey(which)] = pos;
}

export function enabledClocks() {
  const list = ["local"];
  if (settings.secondClock) list.push("second");
  if (settings.thirdClock) list.push("third");
  return list;
}

export function normalizeClockPositions() {
  const used = new Set();
  enabledClocks().forEach(which => {
    let pos = getClockPos(which);
    if (used.has(pos)) {
      const free = CLOCK_POSITIONS.find(p => !used.has(p));
      if (free) { setClockPos(which, free); pos = free; }
    }
    used.add(pos);
  });
}

export function setClockPosition(which, newPos) {
  const old = getClockPos(which);
  if (old === newPos) return;
  const conflict = enabledClocks().find(c => c !== which && getClockPos(c) === newPos);
  setClockPos(which, newPos);
  if (conflict) setClockPos(conflict, old);
}

export function refreshClockPositionSelects() {
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setVal("clock-position-select", getClockPos("local"));
  setVal("second-clock-position-select", getClockPos("second"));
  setVal("third-clock-position-select", getClockPos("third"));
}

export function applyClockConfig() {
  const clockOn = !!settings.widgets.clock;
  const secondOn = clockOn && !!settings.secondClock;
  const thirdOn = clockOn && !!settings.thirdClock;
  const count = 1 + (secondOn ? 1 : 0) + (thirdOn ? 1 : 0);

  normalizeClockPositions();

  document.body.classList.toggle("multi-clock", count > 1);
  document.body.classList.remove("clock-count-1", "clock-count-2", "clock-count-3");
  document.body.classList.add(`clock-count-${count}`);

  const size = settings.clockSize || "standard";
  document.body.classList.remove("clock-size-small", "clock-size-standard", "clock-size-large");
  document.body.classList.add(`clock-size-${size}`);

  const setPos = (id, pos) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("clock-pos-left", "clock-pos-center", "clock-pos-right");
    el.classList.add(`clock-pos-${pos || "center"}`);
  };
  setPos("clock-widget", getClockPos("local"));
  setPos("clock-widget-remote", getClockPos("second"));
  setPos("clock-widget-third", getClockPos("third"));

  const remoteWidget = document.getElementById("clock-widget-remote");
  const thirdWidget = document.getElementById("clock-widget-third");
  if (remoteWidget) remoteWidget.classList.toggle("widget-hidden", !secondOn);
  if (thirdWidget) thirdWidget.classList.toggle("widget-hidden", !thirdOn);

  const localLabel = document.getElementById("local-city-label");
  if (localLabel) localLabel.textContent = isChineseUser ? "本地" : "Local";
  REMOTE_CLOCKS.forEach(({ el, cfg }) => {
    const label = document.getElementById(`${el}-city-label`);
    if (label && settings[cfg + "Clock"]) {
      const city = getClockCity(cfg);
      label.textContent = city ? cityDisplayName(city) : (isChineseUser ? "（請設定城市）" : "(set a city)");
    }
  });

  initClock();
}

export function initGreeting() {
  const greetingEl = document.getElementById("greeting-text");
  if (!greetingEl) return;
  
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
