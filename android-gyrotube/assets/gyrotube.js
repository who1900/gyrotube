/* GyroTube — injected into m.youtube.com (after gvkit.js). Ad cleanup + Material 3 shell + GyroView gyro player
   (CSS translate3d pan on YouTube's own <video>). Every step is best-effort: on failure YouTube's UI keeps working. */
(function () {
'use strict';
if (window.__gyroTube || window.top !== window) return; window.__gyroTube = 1;
const K = window.GVKit; if (!K) return;
const NATIVE = window.GyroTubeNative || null;
const KEY = 'gyrotube2';
const log = (...a) => { try { console.debug('[GyroTube]', ...a); } catch (_) {} };

/* ---------------- settings (read synchronously so ad hooks know the switch at document-start) ---------------- */
let legacy = {}; try { legacy = JSON.parse(localStorage.getItem('gyrotube') || '{}') || {}; } catch (_) {}
let savedTube = {}; try { savedTube = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) {}
const profile0 = savedTube.profile || legacy.profile || 'esports';
const C = K.core({ key: KEY, native: NATIVE, toast: (m) => ui && ui.toast(m),
  defaults: {
    profile: profile0, zoom: legacy.zoom === undefined ? null : legacy.zoom, tilt: legacy.tilt !== false, autoGyro: legacy.autoGyro !== false,
    radar: Object.prototype.hasOwnProperty.call(savedTube, 'radar') ? !!savedTube.radar : profile0 === 'esports',
    radarCorner: 'tl', radarSize: 128, radarRegion: 0.18, radarPreset: 'cs2',
    radarSet: Object.prototype.hasOwnProperty.call(savedTube, 'radar'),
  } });
const S = C.S;
let ui = null;

/* ---------------- 1. ad stripping hooks ---------------- */
const AD_KEYS = ['adPlacements', 'playerAds', 'adSlots', 'adBreakHeartbeatParams'];
function strip(o) { if (!o || typeof o !== 'object') return o; for (const k of AD_KEYS) if (k in o) { try { delete o[k]; } catch (_) {} }
  if (o.playerResponse && typeof o.playerResponse === 'object') strip(o.playerResponse); return o; }
const hasAds = (r) => r && typeof r === 'object' && (r.adPlacements || r.playerAds || r.adSlots || (r.playerResponse && (r.playerResponse.adPlacements || r.playerResponse.playerAds)));
try {
  const jp = JSON.parse;
  JSON.parse = function () { const r = jp.apply(this, arguments); try { if (S.adblock && hasAds(r)) strip(r); } catch (_) {} return r; };
  const rj = Response.prototype.json;
  Response.prototype.json = function () { return rj.call(this).then((r) => { try { if (S.adblock && hasAds(r)) strip(r); } catch (_) {} return r; }); };
  let ipr; const d = Object.getOwnPropertyDescriptor(window, 'ytInitialPlayerResponse');
  if (!d || d.configurable) { if (d && 'value' in d) ipr = S.adblock ? strip(d.value) : d.value;
    Object.defineProperty(window, 'ytInitialPlayerResponse', { configurable: true, get: () => ipr, set: (v) => { ipr = S.adblock ? strip(v) : v; } }); }
} catch (e) { log('hook fail', e); }

/* ---------------- 2. page CSS ---------------- */
const AD_CSS = `ytm-promoted-sparkles-web-renderer,ytm-promoted-video-renderer,ytm-companion-ad-renderer,ytm-ad-slot-renderer,ad-slot-renderer,
ytm-display-ad-renderer,ytm-in-feed-ad-layout-renderer,ytm-banner-promo-renderer,ytm-statement-banner-renderer,ytm-mealbar-promo-renderer,
ytm-promoted-sparkles-text-search-renderer,ytm-rich-item-renderer:has(ytm-ad-slot-renderer),ytm-rich-item-renderer:has(ad-slot-renderer),
ytm-item-section-renderer:has(>ytm-ad-slot-renderer),ytm-reel-shelf-renderer:has(ytm-ad-slot-renderer),.ytp-ad-overlay-container,.ytp-ad-overlay-slot,
ytm-paid-content-overlay-renderer,ytm-engagement-panel-section-list-renderer[target-id*="ads"],#player-ads{display:none!important}`;
const PAGE_CSS = `
html.gt-shell ytm-mobile-topbar-renderer,html.gt-shell #header-bar,html.gt-shell ytm-pivot-bar-renderer{display:none!important}
html.gt-shell body{padding-top:calc(8px + var(--sat,0px))!important;padding-bottom:var(--sab,0px)!important;padding-left:var(--sal,0px)!important;padding-right:var(--sar,0px)!important;box-sizing:border-box!important}
html.gt-shell .sticky-player,html.gt-shell ytm-single-column-watch-next-results-renderer .player-container,html.gt-shell #player-container-id{top:calc(56px + var(--sat,0px))!important}
html.gt-shell bottom-sheet-container,html.gt-shell .bottom-sheet-container,html.gt-shell ytm-engagement-panel,html.gt-shell .engagement-panel-container{padding-bottom:var(--sab,0px)!important}
html.gt-on,html.gt-on body{overflow:hidden!important;overscroll-behavior:none!important}
html.gt-on .gt-anc{transform:none!important;filter:none!important;backdrop-filter:none!important;contain:none!important;will-change:auto!important;
  perspective:none!important;opacity:1!important;position:static!important;z-index:auto!important;isolation:auto!important;mix-blend-mode:normal!important;
  clip-path:none!important;mask:none!important}
html.gt-on video.gt-video{position:fixed!important;left:50%!important;top:50%!important;right:auto!important;bottom:auto!important;
  width:var(--gt-w,100vw)!important;height:var(--gt-h,100vh)!important;max-width:none!important;max-height:none!important;min-width:0!important;min-height:0!important;
  margin:0!important;padding:0!important;object-fit:contain!important;z-index:2147482500!important;background:#000!important;display:block!important;
  visibility:visible!important;opacity:1!important;transform:var(--gt-t,translate3d(-50%,-50%,0))!important;transform-origin:50% 50%!important;
  will-change:transform!important;backface-visibility:hidden!important;filter:none!important}
#gt-radar{position:fixed;z-index:2147482550;display:none;border-radius:10px;box-shadow:0 0 0 2px rgba(255,184,112,.9);pointer-events:none;background:#000}
#gt-radar[data-corner="tl"]{top:calc(64px + var(--sat,0px));left:calc(12px + var(--sal,0px))}
#gt-radar[data-corner="tr"]{top:calc(64px + var(--sat,0px));right:calc(12px + var(--sar,0px))}
#gt-radar[data-corner="bl"]{bottom:calc(88px + var(--sab,0px));left:calc(12px + var(--sal,0px))}
#gt-radar[data-corner="br"]{bottom:calc(88px + var(--sab,0px));right:calc(12px + var(--sar,0px))}`;
function addStyles() {
  const root = document.head || document.documentElement; if (!root) return;
  if (!document.getElementById('gt-style')) { const s = document.createElement('style'); s.id = 'gt-style'; s.textContent = PAGE_CSS; root.appendChild(s); }
  let a = document.getElementById('gt-adcss');
  if (S.adblock && !a) { a = document.createElement('style'); a.id = 'gt-adcss'; a.textContent = AD_CSS; root.appendChild(a); }
  else if (!S.adblock && a) a.remove();
}
try { addStyles(); } catch (_) {}

/* ---------------- 2b. YouTube fullscreen → GyroTube player ---------------- */
// YouTube's fullscreen button calls requestFullscreen() on the player; in a WebView that becomes a native custom view our
// overlay can't draw over (taps did nothing). Route it to our own full-viewport player instead.
let fsReroute = null;
try {
  const wrap = (proto, name) => { const orig = proto && proto[name]; if (typeof orig !== 'function') return;
    proto[name] = function () {
      try { if (fsReroute && (this.matches && (this.matches('#movie_player,.html5-video-player,#player,#player-container-id,ytm-player,video') || this.querySelector && this.querySelector('video'))) && fsReroute()) return Promise.resolve(); } catch (_) {}
      return orig.apply(this, arguments); }; };
  wrap(Element.prototype, 'requestFullscreen'); wrap(Element.prototype, 'webkitRequestFullscreen'); wrap(Element.prototype, 'webkitRequestFullScreen');
  wrap(HTMLVideoElement.prototype, 'webkitEnterFullscreen'); wrap(HTMLVideoElement.prototype, 'webkitEnterFullScreen');
} catch (_) {}
function fixViewport() {   // edge-to-edge: let content extend under the cutout; we pad with the native insets ourselves
  const m = document.querySelector('meta[name=viewport]');
  if (m && !/viewport-fit/.test(m.content)) m.content = m.content.replace(/[\s,]+$/, '') + ', viewport-fit=cover';
}

/* ---------------- 3. YouTube helpers ---------------- */
const player = () => document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
const isWatch = () => location.pathname === '/watch' || location.pathname.startsWith('/live/');
const videoId = () => { try { return new URL(location.href).searchParams.get('v') || location.pathname; } catch (_) { return location.pathname; } };
const findVideo = () => { const p = player(); return (p && p.querySelector('video')) || document.querySelector('video'); };
const title = () => (document.title || '').replace(/\s*-\s*YouTube\s*$/i, '');
const SIGN_IN_URL = 'https://accounts.google.com/ServiceLogin?hl=en&service=youtube&continue=' + encodeURIComponent('https://m.youtube.com/');
function signedIn() {
  if (NATIVE && typeof NATIVE.isSignedIn === 'function') { try { return !!NATIVE.isSignedIn(); } catch (_) {} }
  return /(?:^|;\s*)(?:SAPISID|__Secure-1PAPISID|__Secure-3PAPISID|LOGIN_INFO)=/.test(document.cookie || '');
}
function signIn() { location.href = SIGN_IN_URL; }
function signOut() {
  if (NATIVE && typeof NATIVE.signOut === 'function') { try { NATIVE.signOut(); return; } catch (_) {} }
  for (const name of ['SAPISID', 'APISID', 'LOGIN_INFO', 'SID', 'HSID', 'SSID', '__Secure-1PAPISID', '__Secure-3PAPISID', '__Secure-1PSID', '__Secure-3PSID']) {
    document.cookie = name + '=; Max-Age=0; Path=/; Domain=.youtube.com';
    document.cookie = name + '=; Max-Age=0; Path=/; Domain=.google.com';
  }
  location.href = 'https://m.youtube.com/';
}
function menuItems() {
  const on = signedIn();
  const items = [{ icon: 'home', label: 'Home', go: () => { location.href = '/'; } }];
  if (on) items.push({ icon: 'sub', label: 'Subscriptions', go: () => { location.href = '/feed/subscriptions'; } });
  items.push(
    { icon: 'shorts', label: 'Shorts', go: () => { location.href = '/shorts'; } },
    { icon: 'library', label: 'Library', go: () => { location.href = '/feed/library'; } },
    { icon: 'history', label: 'History', go: () => { location.href = '/feed/history'; } });
  items.push(on
    ? { icon: 'account', label: 'Account', go: () => { location.href = '/account'; } }
    : { icon: 'account', label: 'Sign in to YouTube', go: signIn });
  items.push({ icon: 'settings', label: 'Settings', go: () => { if (ui) ui.openSettings(); } });
  return items;
}

/* ---------------- 4. ad skipper: scoped MutationObserver on the player's class + 1 s fallback ---------------- */
let adMuted = null, adRate = null, adActive = false, obsPlayer = null, adMO = null;
function adCheck() {
  if (!S.adblock) { if (adActive) endAd(); return; }
  const p = player(); if (!p) return;
  const v = p.querySelector('video');
  const ad = p.classList.contains('ad-showing') || p.classList.contains('ad-interrupting');
  if (ad && v) {
    if (!adActive) { adActive = true; adMuted = v.muted; adRate = v.playbackRate; if (ui) ui.ad(true); }
    v.muted = true; try { if (v.playbackRate < 16) v.playbackRate = 16; } catch (_) {}
    if (isFinite(v.duration) && v.duration > 0 && v.currentTime < v.duration - 0.3) { try { v.currentTime = v.duration - 0.1; } catch (_) {} }
    const sk = p.querySelector('.ytp-ad-skip-button,.ytp-ad-skip-button-modern,.ytp-skip-ad-button,.ytp-ad-skip-button-slot button,button[class*="skip-button"]');
    if (sk) try { sk.click(); } catch (_) {}
  } else if (adActive) endAd();
}
function endAd() { adActive = false; const v = findVideo(); if (v) { v.muted = !!adMuted; try { v.playbackRate = adRate || 1; } catch (_) {} } if (ui) ui.ad(false); }
function watchPlayer() {
  const p = player(); if (p === obsPlayer) return; obsPlayer = p;
  if (adMO) adMO.disconnect(); if (!p) return;
  adMO = new MutationObserver(adCheck); adMO.observe(p, { attributes: true, attributeFilter: ['class'] }); adCheck();
}
let promoT = 0;   // debounced, cheap callback: just arms a timer
const promoMO = new MutationObserver(() => { if (promoT || !S.adblock) return; promoT = setTimeout(() => { promoT = 0;
  document.querySelectorAll('ytm-mealbar-promo-renderer button, .ytp-ad-overlay-close-button').forEach((b) => { try { b.click(); } catch (_) {} }); }, 400); });

/* ---------------- 5. gyro player mode (CSS transform renderer) ---------------- */
const G = { on: false, video: null, anc: [], L: null, suppressId: null, lastHref: '', raf: 0, lastT: '', W0: innerWidth, H0: innerHeight, nativeAuto: false };
if (NATIVE) { try { G.nativeAuto = !!NATIVE.isAutoRotate(); } catch (_) {} }
addEventListener('resize', () => { G.W0 = innerWidth; G.H0 = innerHeight; G.lastT = ''; }, { passive: true });
function markAncestors(v) { unmarkAncestors(); for (let n = v.parentElement; n && n !== document.documentElement; n = n.parentElement) { n.classList.add('gt-anc'); G.anc.push(n); } }
function unmarkAncestors() { for (const n of G.anc) try { n.classList.remove('gt-anc'); } catch (_) {} G.anc = []; }
function layout() {   // pure arithmetic on cached viewport size — no DOM layout reads per frame
  const v = G.video, W0 = G.W0, H0 = G.H0, browserLand = W0 > H0 * 1.05;
  const rot = !browserLand && C.phys !== 0 && !G.nativeAuto ? C.phys : 0;
  const W = rot ? H0 : W0, H = rot ? W0 : H0;
  const a = v && v.videoWidth && v.videoHeight ? v.videoWidth / v.videoHeight : 16 / 9, s = W / H;
  const zoomable = !browserLand && !rot && a > s * 1.001, mFit = zoomable ? a / s : 1;
  const M = !zoomable ? 1 : S.zoom == null ? mFit : Math.max(1, Math.min(mFit, S.zoom));
  return { rot, browserLand, W, H, a, s, zoomable, mFit, M, pan: zoomable && M > 1.001 };
}
let lastDims = '';
function apply() {
  const L = G.L, v = G.video, root = document.documentElement;
  const dims = L.W + 'x' + L.H;
  if (dims !== lastDims) { lastDims = dims; root.style.setProperty('--gt-w', L.W + 'px'); root.style.setProperty('--gt-h', L.H + 'px'); }
  ui.setRot(L.rot);
  const tx = L.pan ? (0.5 - C.X) * (L.M - 1) * L.W : 0;
  const t = `translate3d(-50%,-50%,0) rotate(${L.rot > 0 ? -90 : L.rot < 0 ? 90 : 0}deg) translate3d(${tx.toFixed(1)}px,0,0) scale(${L.M.toFixed(4)})`;
  if (t !== G.lastT) { G.lastT = t; v.style.setProperty('--gt-t', t); }
}
function enter(manual) {
  if (G.on || !mount()) return;
  const v = findVideo(); if (!v) { if (manual) ui.toast('No video found'); return; }
  G.on = true; G.video = v; G.lastT = ''; lastDims = '';
  C.startSensors(); C.recenterView();
  v.classList.add('gt-video'); markAncestors(v);
  document.documentElement.classList.add('gt-on');
  ui.setTitle(title()); ui.active(true); ui.setPlaying(!v.paused); ui.onboarding(false);
  keepOn(!v.paused);
  if (!G.raf) G.raf = requestAnimationFrame(frame);
}
function exit() {
  if (!G.on) return;
  G.on = false; C.stopSensors();
  if (G.video) { G.video.classList.remove('gt-video'); G.video.style.removeProperty('--gt-t'); }
  unmarkAncestors();
  const r = document.documentElement; r.classList.remove('gt-on'); r.style.removeProperty('--gt-w'); r.style.removeProperty('--gt-h');
  ui.setRot(0); ui.active(false); G.video = null; G.L = null;
  hideRadar();
  try { window.dispatchEvent(new Event('resize')); } catch (_) {}
}
/* ---------------- 5b. pinned radar: a corner of the source frame, drawn, never read back ---------------- */
const RADAR_PRESETS = {
  cs2: { label: 'CS2', corner: 'tl', region: 0.18 },
  dota2: { label: 'Dota 2', corner: 'br', region: 0.22 },
  lol: { label: 'LoL', corner: 'br', region: 0.20 },
  valorant: { label: 'Valorant', corner: 'tl', region: 0.16 },
};
const radar = { canvas: null, ctx: null, last: 0, dead: false, key: '' };
function ensureRadar() {
  if (radar.canvas) return;
  const c = document.createElement('canvas');
  c.id = 'gt-radar';
  c.setAttribute('aria-hidden', 'true');
  (document.body || document.documentElement).appendChild(c);
  radar.canvas = c;
  radar.ctx = c.getContext('2d', { alpha: false });
}
function radarSrc(v) {
  const vw = v.videoWidth, vh = v.videoHeight;
  if (!vw || !vh) return null;
  const frac = Math.max(0.08, Math.min(0.40, +S.radarRegion || 0.18));
  let sw = vw * frac, sh = sw;
  if (sh > vh) sh = vh;
  if (sw > vw) sw = vw;
  const right = S.radarCorner === 'tr' || S.radarCorner === 'br';
  const bottom = S.radarCorner === 'bl' || S.radarCorner === 'br';
  return { sx: right ? vw - sw : 0, sy: bottom ? vh - sh : 0, sw, sh };
}
function placeRadar() {
  const size = Math.max(72, Math.min(240, +S.radarSize || 128));
  const corner = RADAR_PRESETS[S.radarPreset] ? S.radarCorner : (S.radarCorner || 'tl');
  const key = size + corner;
  const c = radar.canvas;
  if (radar.key !== key) {
    radar.key = key;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(size * dpr);
    c.height = Math.round(size * dpr);
    c.style.width = size + 'px';
    c.style.height = size + 'px';
    c.dataset.corner = corner;
  }
}
function hideRadar() { if (radar.canvas) radar.canvas.style.display = 'none'; }
function drawRadar(now, v) {
  const show = !!(S.radar && G.on && v && G.L && G.L.pan && !radar.dead);
  if (!show) { hideRadar(); return; }
  ensureRadar();
  if (!radar.ctx) { radar.dead = true; hideRadar(); return; }
  placeRadar();
  radar.canvas.style.display = 'block';
  if (v.paused || now - radar.last < 40) return;   // pause drawing; ~25 fps while playing
  const src = radarSrc(v);
  if (!src) return;
  try {
    radar.ctx.drawImage(v, src.sx, src.sy, src.sw, src.sh, 0, 0, radar.canvas.width, radar.canvas.height);
    radar.last = now;
  } catch (_) {
    radar.dead = true;
    hideRadar();
  }
}
function syncRadarControls() {
  const root = ui && ui.sr && ui.sr.getElementById('gt-radar-sec');
  if (!root) return;
  const sw = root.querySelector('.sw');
  if (sw) sw.classList.toggle('on', !!S.radar);
  root.querySelectorAll('[data-radar-corner]').forEach((b) => b.classList.toggle('on', b.dataset.radarCorner === S.radarCorner));
  root.querySelectorAll('[data-radar-preset]').forEach((b) => b.classList.toggle('on', b.dataset.radarPreset === S.radarPreset));
  const size = root.querySelector('[data-radar-size]');
  const region = root.querySelector('[data-radar-region]');
  const focus = ui.sr.activeElement;
  if (size && focus !== size) { size.value = S.radarSize; size.style.setProperty('--p', ((size.value - 72) / (240 - 72) * 100) + '%'); }
  if (region && focus !== region) { region.value = Math.round((+S.radarRegion || 0.18) * 100); region.style.setProperty('--p', ((region.value - 8) / (40 - 8) * 100) + '%'); }
  const sv = root.querySelector('[data-radar-size-val]');
  const rv = root.querySelector('[data-radar-region-val]');
  if (sv) sv.textContent = Math.round(+S.radarSize || 128) + ' px';
  if (rv) rv.textContent = Math.round((+S.radarRegion || 0.18) * 100) + '%';
}
function installRadarSettings() {
  if (!ui || !ui.sr || ui.sr.getElementById('gt-radar-sec')) return;
  const sbody = ui.sr.getElementById('sbody');
  if (!sbody) return;
  const h = K.h;
  const seg = (attr, entries, onPick) => {
    const box = h('div', { class: 'seg', role: 'radiogroup' });
    for (const [id, label] of entries) {
      const b = h('button', { type: 'button', role: 'radio', [attr]: id }, h('span', { text: label }));
      b.dataset[attr === 'data-radar-corner' ? 'radarCorner' : 'radarPreset'] = id;
      K.tap(b, () => onPick(id));
      box.append(b);
    }
    return box;
  };
  const sw = h('div', { class: 'sw', role: 'switch' });
  const toggle = h('div', { class: 'row tapr' }, h('div', { class: 'tx' }, h('div', { class: 't', text: 'Pinned radar' }), h('div', { class: 's', text: 'A corner of the full frame, on top of the picture' })), sw);
  K.tap(toggle, () => C.set('radar', !S.radar));
  const sizeVal = h('span', { class: 'val', 'data-radar-size-val': '1' });
  const size = h('input', { type: 'range', min: '72', max: '240', step: '4', 'data-radar-size': '1', 'aria-label': 'Radar size' });
  size.addEventListener('input', () => { C.set('radarSize', +size.value); S.radarPreset = ''; C.save(); });
  const regionVal = h('span', { class: 'val', 'data-radar-region-val': '1' });
  const region = h('input', { type: 'range', min: '8', max: '40', step: '1', 'data-radar-region': '1', 'aria-label': 'Source region size' });
  region.addEventListener('input', () => { C.set('radarRegion', +region.value / 100); S.radarPreset = ''; C.save(); });
  const sec = h('div', { class: 'sec', id: 'gt-radar-sec' }, h('h3', { text: 'Radar' }), toggle,
    h('div', { class: 'row col' }, h('div', { class: 't', text: 'Game preset' }), h('div', { class: 's', text: 'CS2 and Valorant are top-left. Dota 2 and LoL are bottom-right.' }),
      seg('data-radar-preset', Object.entries(RADAR_PRESETS).map(([id, p]) => [id, p.label]), (id) => {
        const p = RADAR_PRESETS[id];
        S.radarCorner = p.corner; S.radarRegion = p.region; S.radarPreset = id; S.radar = true; S.radarSet = true;
        C.save(); radar.key = ''; syncRadarControls();
      })),
    h('div', { class: 'row col' }, h('div', { class: 't', text: 'Source corner' }),
      seg('data-radar-corner', [['tl', 'TL'], ['tr', 'TR'], ['bl', 'BL'], ['br', 'BR']], (id) => { C.set('radarCorner', id); S.radarPreset = ''; C.save(); radar.key = ''; })),
    h('div', { class: 'row col' }, h('div', { class: 'hd' }, h('div', { class: 't', text: 'Size' }), sizeVal), size),
    h('div', { class: 'row col' }, h('div', { class: 'hd' }, h('div', { class: 't', text: 'Source region' }), regionVal), region));
  sbody.append(sec);
  syncRadarControls();
}
let prevNow = 0, uiTick = 0;
function frame(now) {
  if (!G.on) { G.raf = 0; prevNow = 0; hideRadar(); return; }
  G.raf = requestAnimationFrame(frame);
  const dt = prevNow ? Math.min(0.1, (now - prevNow) / 1000) : 0.016; prevNow = now;
  const v = G.video; if (!v) return;
  G.L = layout();
  C.update(dt, now, G.L);
  apply();
  drawRadar(now, v);
  ui.mini(G.L.pan, 1 / G.L.M, C.X, now);
  if (now - uiTick > 250) { uiTick = now; ui.setTime(v.currentTime, v.duration); ui.setPlaying(!v.paused); }   // ~4 Hz
}
const act = (name) => {
  const v = G.video, p = player();
  if (name === 'back') { G.suppressId = videoId(); exit(); }
  else if (name === 'play' && v) { if (v.paused) { if (p && p.playVideo) p.playVideo(); else v.play().catch(() => {}); } else { if (p && p.pauseVideo) p.pauseVideo(); else v.pause(); } }
  else if ((name === 'rew' || name === 'fwd') && v) { const t = Math.max(0, v.currentTime + (name === 'rew' ? -10 : 10)); if (p && p.seekTo) p.seekTo(t, true); else v.currentTime = t; }
  else if (name === 'zoom') C.zoomCycle(G.L ? G.L.mFit : 4);
};
const seekTo = (f) => { const v = G.video, p = player(); if (!v || !isFinite(v.duration)) return; const t = f * v.duration; if (p && p.seekTo) p.seekTo(t, true); else v.currentTime = t; };

/* ---------------- 6. UI mount (Material 3 shell) ---------------- */
const TUBE_CSS = '';
function mount() {
  if (ui && ui.host.isConnected) return true;
  if (!document.body) return false;
  if (!ui) {
    ui = K.ui({ id: 'gyrotube-root', core: C, appName: 'GyroTube', version: '1.5', backIcon: 'close', css: TUBE_CSS,
      aboutText: 'Personal use. Not affiliated with YouTube or Google, and not for Google Play: blocking ads may violate the YouTube Terms of Service.',
      features: { backdrop: true, adblock: true, autoGyro: true }, act, seek: seekTo,
      onSetting: (k) => { if (k === 'adblock') { addStyles(); if (NATIVE && NATIVE.setAdblock) try { NATIVE.setAdblock(!!S.adblock); } catch (_) {} if (!S.adblock && adActive) endAd(); ui.toast(S.adblock ? 'Ad blocking on' : 'Ad blocking off'); } },
      account: {
        privacy: 'Your sign-in stays on this device inside GyroTube; the app never sees your password.',
        signedIn, signOut, signOutLabel: 'Sign out',
      },
      appbar: { back: () => history.back(), home: () => { location.href = '/'; }, gyro: () => { G.suppressId = null; enter(true); }, search: (q) => { location.href = '/results?search_query=' + encodeURIComponent(q); },
        menu: menuItems() } });
    C.bindTouch(ui.touch, { L: () => G.L, rot: () => (G.L ? G.L.rot : 0),
      onDown: () => { if (!ui.isShown()) { ui.show(); return true; } return false; },          // instant: controls appear on touch-down
      onTap: (shownOnDown) => { if (!shownOnDown) ui.hide(); } });
    C.on((k) => {
      if (k === 'zoom' || k === 'phys') G.lastT = '';
      if (k === 'radar') { S.radarSet = true; C.save(); }
      if (k === 'profile' && !S.radarSet) { S.radar = S.profile === 'esports'; C.save(); }
      if (k === 'radarCorner') radar.key = '';
      if (k === 'radar' || k === 'radarCorner' || k === 'radarSize' || k === 'radarRegion' || k === 'profile') syncRadarControls();
    });
    installRadarSettings();
  }
  document.documentElement.appendChild(ui.host);
  document.documentElement.classList.add('gt-shell');
  try { promoMO.observe(document.body, { childList: true, subtree: true }); } catch (_) {}
  return true;
}

/* ---------------- 7. native glue, navigation ---------------- */
function keepOn(b) { if (NATIVE && NATIVE.keepScreenOn) try { NATIVE.keepScreenOn(!!b); } catch (_) {} }
document.addEventListener('play', (e) => { if (e.target && e.target.tagName === 'VIDEO') { keepOn(true); if (ui && G.on) ui.setPlaying(true); } }, true);
document.addEventListener('pause', (e) => { if (e.target && e.target.tagName === 'VIDEO') { keepOn(false); if (ui && G.on) ui.setPlaying(false); } }, true);
document.addEventListener('ended', (e) => { if (e.target && e.target.tagName === 'VIDEO') keepOn(false); }, true);
fsReroute = () => { if (!isWatch()) return false; G.suppressId = null; if (!G.on) enter(true); if (G.on && ui) ui.show(); return G.on; };
window.gtFullscreen = () => !!(fsReroute && fsReroute());
window.gtSetAutoRotate = (on) => { G.nativeAuto = !!on; G.lastT = ''; };
window.gtBack = () => { if (ui && ui.back()) return true; if (G.on) { G.suppressId = videoId(); exit(); return true; } return false; };
window.gtPause = () => { const v = findVideo(); if (v && !v.paused) try { v.pause(); } catch (_) {} };
if (NATIVE && NATIVE.setAdblock) try { NATIVE.setAdblock(!!S.adblock); } catch (_) {}

let lastSigned = null;
function syncAccount() {
  const on = signedIn();
  if (on === lastSigned || !ui) return;
  lastSigned = on;
  if (ui.setMenu) ui.setMenu(menuItems());
  if (ui.refresh) ui.refresh();
}
function onNav() {
  const href = location.href; if (href === G.lastHref) return; G.lastHref = href;
  if (G.on && !isWatch()) exit();
  if (G.suppressId && G.suppressId !== videoId()) G.suppressId = null;
  if (ui) { ui.setGyroAvailable(isWatch()); ui.closeMenu(); if (G.on) ui.setTitle(title());
    try { const q = new URL(href).searchParams.get('search_query'); if (q != null) ui.setQuery(q); } catch (_) {} }
}
function tick() {
  try { addStyles(); fixViewport(); } catch (_) {}
  try { mount(); } catch (e) { log('ui fail', e); document.documentElement.classList.remove('gt-shell'); }
  try { onNav(); syncAccount(); } catch (_) {}
  try { watchPlayer(); adCheck(); } catch (_) {}
  try {
    if (G.on) {   // housekeeping at 2 Hz instead of per frame
      const nv = findVideo();
      if (nv && nv !== G.video) { if (G.video) G.video.classList.remove('gt-video'); G.video = nv; nv.classList.add('gt-video'); markAncestors(nv); G.lastT = ''; radar.dead = false; }
      if (G.anc.length && !G.anc[0].classList.contains('gt-anc')) markAncestors(G.video);
      if (G.video && G.video.style.getPropertyValue('--gt-t') !== G.lastT) G.lastT = '';   // YouTube clobbered inline style
      if (ui) ui.setTitle(title());
    } else if (S.autoGyro && isWatch() && G.suppressId !== videoId() && !adActive) {
      const v = findVideo(); if (v && v.readyState >= 1 && v.videoWidth > 0) enter(false);
    }
  } catch (_) {}
}
setInterval(tick, 500);
['yt-navigate-finish', 'state-navigateend', 'popstate'].forEach((ev) => addEventListener(ev, () => setTimeout(tick, 50)));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick); else tick();
window.__gt = { G, C, get ui() { return ui; } };
log('injected');
})();
