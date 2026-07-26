// Just a New Tab - Weather Module (Open-Meteo)
import { settings, isChineseUser, isSimplifiedChinese, getClockCity } from './storage.js';

export function wmoInfo(code) {
  const T = (emoji, zh, zhCN, en) => ({ emoji, zh, zhCN, en });
  if (code === 0) return T("☀️", "晴朗", "晴朗", "Clear");
  if (code === 1) return T("🌤️", "大致晴朗", "大致晴朗", "Mainly clear");
  if (code === 2) return T("⛅", "局部多雲", "局部多云", "Partly cloudy");
  if (code === 3) return T("☁️", "陰天", "阴天", "Overcast");
  if (code === 45 || code === 48) return T("🌫️", "有霧", "有雾", "Fog");
  if (code >= 51 && code <= 57) return T("🌦️", "毛毛雨", "毛毛雨", "Drizzle");
  if (code >= 61 && code <= 67) return T("🌧️", "下雨", "下雨", "Rain");
  if (code >= 71 && code <= 77) return T("🌨️", "下雪", "下雪", "Snow");
  if (code >= 80 && code <= 82) return T("🌧️", "陣雨", "阵雨", "Rain showers");
  if (code >= 85 && code <= 86) return T("🌨️", "陣雪", "阵雪", "Snow showers");
  if (code >= 95) return T("⛈️", "雷雨", "雷雨", "Thunderstorm");
  return T("🌡️", "天氣", "天气", "Weather");
}

export async function geocodeCity(name) {
  const cacheKey = "jnt_geo_" + name.trim().toLowerCase();
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if (cached) return cached;
  } catch (e) {}

  try {
    const lang = isChineseUser ? "zh" : "en";
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=${lang}&format=json`;
    const res = await fetch(url);
    if (res.ok) {
      const d = await res.json();
      if (d.results && d.results.length) {
        const r = d.results[0];
        const loc = { lat: r.latitude, lon: r.longitude, name: r.name, tz: r.timezone || null, custom: true };
        localStorage.setItem(cacheKey, JSON.stringify(loc));
        return loc;
      }
    }
  } catch (e) {
    console.log("Geocoding failed:", e.message || e);
  }
  return null;
}

export async function fetchWeather(lat, lon, unit) {
  const tempUnit = unit === "f" ? "fahrenheit" : "celsius";
  const cacheKey = `jnt_wx_${lat.toFixed(2)}_${lon.toFixed(2)}_${tempUnit}`;
  try {
    const c = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if (c && Date.now() - c.t < 30 * 60 * 1000) return c.d;
  } catch (e) {}

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=${tempUnit}`;
    const res = await fetch(url);
    if (res.ok) {
      const j = await res.json();
      if (j.current) {
        const d = { temp: Math.round(j.current.temperature_2m), code: j.current.weather_code };
        localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), d }));
        return d;
      }
    }
  } catch (e) {
    console.log("Weather fetch failed:", e.message || e);
  }
  return null;
}

export async function renderWeatherSlot(slot, loc) {
  const widget = document.getElementById(`${slot}-weather`);
  if (!widget) return;

  if (!settings.weather || !loc) {
    widget.classList.add("widget-hidden");
    return;
  }

  const data = await fetchWeather(loc.lat, loc.lon, settings.weatherUnit);
  if (!data) {
    widget.classList.add("widget-hidden");
    return;
  }

  const iconEl = document.getElementById(`${slot}-weather-icon`);
  const tempEl = document.getElementById(`${slot}-weather-temp`);
  const descEl = document.getElementById(`${slot}-weather-desc`);
  const info = wmoInfo(data.code);

  if (iconEl) iconEl.textContent = info.emoji;
  if (tempEl) tempEl.textContent = `${data.temp}°${settings.weatherUnit === "f" ? "F" : "C"}`;
  if (descEl) descEl.textContent = isSimplifiedChinese ? info.zhCN : (isChineseUser ? info.zh : info.en);

  widget.classList.remove("widget-hidden");
}

export function remoteWeatherLoc(prefix) {
  const city = getClockCity(prefix);
  if (!city || city.lat == null || city.lon == null) return null;
  return { lat: city.lat, lon: city.lon };
}

export async function initWeather() {
  if (!settings.weather) {
    ["local-weather", "remote-weather", "third-weather"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add("widget-hidden");
    });
    return;
  }

  let localLoc = null;
  if ((settings.weatherCity || "").trim()) {
    localLoc = await geocodeCity(settings.weatherCity.trim());
  }
  await renderWeatherSlot("local", localLoc);

  await renderWeatherSlot("remote", settings.secondClock ? remoteWeatherLoc("second") : null);
  await renderWeatherSlot("third", settings.thirdClock ? remoteWeatherLoc("third") : null);

  if (!window.weatherInterval) {
    window.weatherInterval = setInterval(() => {
      if (settings.weather) initWeather();
    }, 30 * 60 * 1000);
  }
}
