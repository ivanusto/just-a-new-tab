// 上傳 AMO 上架頁中繼資料：圖示、截圖、首頁網址、標籤（零相依，Node 18+）
//
// 使用方式：
//   AMO_JWT_ISSUER=... AMO_JWT_SECRET=... node scripts/amo-metadata.js
//
// 敘述與摘要已存在於 AMO，不在此處理。截圖來源為 store_assets/screenshot-*.png。

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AMO_ADDON_ID = 'just-a-new-tab-official@ivanusto.yblog.org';
const AMO_HOST = 'https://addons.mozilla.org';
const ADDON_BASE = `${AMO_HOST}/api/v5/addons/addon/${encodeURIComponent(AMO_ADDON_ID)}/`;

const HOMEPAGE = 'https://yblog.org/2026/06/11/just-a-new-tab-a-new-page/';
// AMO 標籤僅接受官方固定字彙（無 "new tab" / "wallpaper" 等）
const TAGS = ['search', 'dark mode'];
const ICON_PATH = path.join(__dirname, '..', 'just-new-tab', 'icons', 'icon-128.png');
const ASSETS_DIR = path.join(__dirname, '..', 'store_assets');

function amoJwt(issuer, secret) {
  const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url({ iss: issuer, jti: crypto.randomUUID(), iat: now, exp: now + 240 });
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

// AMO 寫入 API 有節流（429），依回應等待秒數自動重試；optsFn 每次呼叫重新產生（JWT 有效期短）
async function amoFetch(url, optsFn, what, tries = 6) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, optsFn());
    if (res.status !== 429) return res;
    const body = await res.clone().json().catch(() => ({}));
    const m = /in (\d+) seconds/.exec(body.detail ?? '');
    const wait = (m ? parseInt(m[1], 10) : 60) + 3;
    console.log(`[throttle] ${what} 被節流，${wait}s 後重試…`);
    await new Promise(r => setTimeout(r, wait * 1000));
  }
  throw new Error(`${what} 多次被節流仍失敗`);
}

async function main() {
  const issuer = process.env.AMO_JWT_ISSUER;
  const secret = process.env.AMO_JWT_SECRET;
  if (!issuer || !secret) throw new Error('缺少 AMO_JWT_ISSUER / AMO_JWT_SECRET');
  const auth = () => ({ Authorization: `JWT ${amoJwt(issuer, secret)}` });

  let failed = false;

  // 1. 圖示
  try {
    console.log('[icon] 上傳 icon-128.png…');
    const res = await amoFetch(ADDON_BASE, () => {
      const form = new FormData();
      form.append('icon', new Blob([fs.readFileSync(ICON_PATH)], { type: 'image/png' }), 'icon-128.png');
      return { method: 'PATCH', headers: auth(), body: form };
    }, 'icon');
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 500)}`);
    console.log('[icon] 完成');
  } catch (e) {
    failed = true;
    console.error(`[icon] 失敗：${e.message}`);
  }

  // 2. 首頁網址
  try {
    console.log('[homepage] 設定首頁網址…');
    const res = await amoFetch(ADDON_BASE, () => ({
      method: 'PATCH',
      headers: { ...auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ homepage: { 'zh-TW': HOMEPAGE } })
    }), 'homepage');
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 500)}`);
    console.log('[homepage] 完成');
  } catch (e) {
    failed = true;
    console.error(`[homepage] 失敗：${e.message}`);
  }

  // 3. 標籤（AMO 僅接受固定清單，遇到無效標籤時剔除後重試一次）
  try {
    console.log(`[tags] 設定標籤：${TAGS.join(', ')}`);
    const patchTags = (tags) => amoFetch(ADDON_BASE, () => ({
      method: 'PATCH',
      headers: { ...auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags })
    }), 'tags');
    let res = await patchTags(TAGS);
    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      const badIdx = Object.keys(body.tags ?? {}).map(Number);
      const valid = TAGS.filter((_, i) => !badIdx.includes(i));
      console.warn(`[tags] 無效標籤：${badIdx.map(i => TAGS[i]).join(', ')}，改用：${valid.join(', ') || '(無)'}`);
      if (valid.length) res = await patchTags(valid);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 500)}`);
    console.log('[tags] 完成');
  } catch (e) {
    failed = true;
    console.error(`[tags] 失敗：${e.message}`);
  }

  // 4. 截圖（依現有張數續傳，避免重複）
  try {
    const detail = await amoFetch(ADDON_BASE, () => ({ headers: auth() }), 'previews 查詢');
    if (!detail.ok) throw new Error(`查詢附加元件失敗：HTTP ${detail.status}`);
    const existing = (await detail.json()).previews?.length ?? 0;
    const shots = fs.readdirSync(ASSETS_DIR).filter(f => /^screenshot-\d+\.png$/.test(f))
      .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));
    if (!shots.length) throw new Error(`${ASSETS_DIR} 內沒有 screenshot-*.png`);
    if (existing >= shots.length) {
      console.log(`[previews] 已有 ${existing} 張截圖，跳過上傳`);
    } else {
      for (let i = existing; i < shots.length; i++) {
        console.log(`[previews] 上傳 ${shots[i]}（position ${i + 1}）…`);
        const res = await amoFetch(`${ADDON_BASE}previews/`, () => {
          const form = new FormData();
          form.append('image', new Blob([fs.readFileSync(path.join(ASSETS_DIR, shots[i]))], { type: 'image/png' }), shots[i]);
          form.append('position', String(i + 1));
          return { method: 'POST', headers: auth(), body: form };
        }, shots[i]);
        if (!res.ok) throw new Error(`${shots[i]} 上傳失敗：HTTP ${res.status} ${(await res.text()).slice(0, 500)}`);
      }
      console.log(`[previews] 完成，共 ${shots.length} 張`);
    }
  } catch (e) {
    failed = true;
    console.error(`[previews] 失敗：${e.message}`);
  }

  process.exit(failed ? 1 : 0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
