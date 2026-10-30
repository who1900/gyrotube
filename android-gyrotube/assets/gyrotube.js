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
const C = K.core({ key: KEY, native: NATIVE, toast: (m) => ui && ui.toast(m),
  defaults: { profile: legacy.profile || 'esports', zoom: legacy.zoom === undefined ? null : legacy.zoom, tilt: legacy.tilt !== false, autoGyro: legacy.autoGyro !== false } });
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
  will-change:transform!important;backface-visibility:hidden!important;filter:none!important}`;
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
  try { window.dispatchEvent(new Event('resize')); } catch (_) {}
}
let prevNow = 0, uiTick = 0;
function frame(now) {
  if (!G.on) { G.raf = 0; prevNow = 0; return; }
  G.raf = requestAnimationFrame(frame);
  const dt = prevNow ? Math.min(0.1, (now - prevNow) / 1000) : 0.016; prevNow = now;
  const v = G.video; if (!v) return;
  G.L = layout();
  C.update(dt, now, G.L);
  apply();
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
    ui = K.ui({ id: 'gyrotube-root', core: C, appName: 'GyroTube', version: '1.4', backIcon: 'close', css: TUBE_CSS,
      aboutText: 'Personal use. Not affiliated with YouTube or Google, and not for Google Play: blocking ads may violate the YouTube Terms of Service.',
      features: { backdrop: true, adblock: true, autoGyro: true }, act, seek: seekTo,
      onSetting: (k) => { if (k === 'adblock') { addStyles(); if (NATIVE && NATIVE.setAdblock) try { NATIVE.setAdblock(!!S.adblock); } catch (_) {} if (!S.adblock && adActive) endAd(); ui.toast(S.adblock ? 'Ad blocking on' : 'Ad blocking off'); } },
      appbar: { back: () => history.back(), home: () => { location.href = '/'; }, gyro: () => { G.suppressId = null; enter(true); }, search: (q) => { location.href = '/results?search_query=' + encodeURIComponent(q); },
        menu: [{ icon: 'home', label: 'Home', go: () => { location.href = '/'; } }, { icon: 'sub', label: 'Subscriptions', go: () => { location.href = '/feed/subscriptions'; } },
          { icon: 'shorts', label: 'Shorts', go: () => { location.href = '/shorts'; } }, { icon: 'library', label: 'Library', go: () => { location.href = '/feed/library'; } },
          { icon: 'history', label: 'History', go: () => { location.href = '/feed/history'; } }, { icon: 'account', label: 'Account', go: () => { location.href = '/account'; } },
          { icon: 'settings', label: 'Settings', go: () => ui.openSettings() }] } });
    C.bindTouch(ui.touch, { L: () => G.L, rot: () => (G.L ? G.L.rot : 0),
      onDown: () => { if (!ui.isShown()) { ui.show(); return true; } return false; },          // instant: controls appear on touch-down
      onTap: (shownOnDown) => { if (!shownOnDown) ui.hide(); } });
    C.on((k) => { if (k === 'zoom' || k === 'phys') G.lastT = ''; });
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
  try { onNav(); } catch (_) {}
  try { watchPlayer(); adCheck(); } catch (_) {}
  try {
    if (G.on) {   // housekeeping at 2 Hz instead of per frame
      const nv = findVideo();
      if (nv && nv !== G.video) { if (G.video) G.video.classList.remove('gt-video'); G.video = nv; nv.classList.add('gt-video'); markAncestors(nv); G.lastT = ''; }
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
