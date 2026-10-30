/* GyroView — lightweight WebGL vertical player with gyro panning. Gyro core + Material 3 UI from gvkit.js. hls.js lazy. */
'use strict';
(() => {
const $ = (id) => document.getElementById(id);
const cv = $('gl'), video = $('v');
const K = window.GVKit;
const SAMPLE_MP4 = 'sample.mp4';
// Public Mux test stream of Big Buck Bunny (Blender Foundation, CC BY 3.0). Not bundled.
const SAMPLE_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const HLS_CDN = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js';
const HUD_UV = [0, 0, 0.16, 0.284];                 // top-left 16:9 region ≈ square (radar)
const NATIVE = window.GyroViewNative || null;
const VERSION = '1.4';

let legacy = {}; try { legacy = JSON.parse(localStorage.getItem('gv') || '{}') || {}; } catch (_) {}
const C = K.core({ key: 'gyroview2', native: NATIVE, toast: (m) => ui && ui.toast(m),
  defaults: { profile: legacy.profile || 'esports', zoom: legacy.zoom === undefined ? null : legacy.zoom } });
const S = C.S;
const st = { dirty: true, newFrame: false, hasTex: false, vw: 16, vh: 9, L: null, dpr: 1, nativeAuto: false, playing: false, W0: innerWidth, H0: innerHeight };
if (NATIVE) { try { st.nativeAuto = !!NATIVE.isAutoRotate(); } catch (_) {} document.documentElement.classList.add('native'); }

/* ---------------- UI ---------------- */
let ui = null;
const act = (name) => {
  if (name === 'back') { video.pause(); $('start').classList.remove('gone'); ui.active(false); C.stopSensors(); }
  else if (name === 'play') { video.paused ? play() : video.pause(); }
  else if (name === 'rew' || name === 'fwd') { if (isFinite(video.duration)) video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + (name === 'rew' ? -10 : 10))); }
  else if (name === 'zoom') C.zoomCycle(st.L ? st.L.mFit : 4);
  else if (name === 'fs') toggleFs();
};
ui = K.ui({ id: 'gyroview-ui', core: C, appName: 'GyroView', version: VERSION, backIcon: 'back',
  aboutText: 'Вертикальный плеер с гироскопическим панорамированием. WebGL, без фреймворков.',
  features: { hud: true, fs: !NATIVE }, act, seek: (f) => { if (isFinite(video.duration)) video.currentTime = f * video.duration; } });
document.body.appendChild(ui.host);
C.bindTouch(ui.touch, { L: () => st.L, rot: () => (st.L ? st.L.rot : 0),
  onDown: () => { if (!ui.isShown()) { ui.show(); return true; } return false; },     // instant: show on touch-down
  onTap: (shownOnDown) => { if (!shownOnDown) ui.hide(); } });
C.on((k) => { if (k === 'zoom' || k === 'phys' || k === 'hud' || k === 'profile') { layout(true); if (k === 'phys') tryLock(); } });
window.gvSetAutoRotate = (on) => { st.nativeAuto = !!on; layout(true); };
window.gvBack = () => { if (ui.back()) return true; const s = $('start'); if (s.classList.contains('gone')) { act('back'); return true; } return false; };
window.gvPause = () => { video.pause(); };

/* ---------------- WebGL ---------------- */
const gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false,
  premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power', desynchronized: true });
if (!gl) { $('sErr').textContent = 'WebGL недоступен в этом браузере'; return; }
const VS = `attribute vec2 aP;uniform vec4 uDst;uniform vec4 uUV;uniform mat2 uRot;varying vec2 vUV;
void main(){vec2 p=uDst.xy+aP*uDst.zw;gl_Position=vec4(uRot*p,0.,1.);
/* U_render = U_base*scaleX + offsetU */ vUV=vec2(uUV.x+aP.x*uUV.z,uUV.y+(1.-aP.y)*uUV.w);}`;
const FS = `precision mediump float;uniform sampler2D uT;varying vec2 vUV;void main(){gl_FragColor=texture2D(uT,vUV);}`;
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
const prog = gl.createProgram();
gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
gl.linkProgram(prog); gl.useProgram(prog);
const uDst = gl.getUniformLocation(prog, 'uDst'), uUV = gl.getUniformLocation(prog, 'uUV'), uRot = gl.getUniformLocation(prog, 'uRot');
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
const aP = gl.getAttribLocation(prog, 'aP'); gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
gl.clearColor(0, 0, 0, 1);
let corsWarned = false;
function upload() {
  try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video); st.hasTex = true; }
  catch (e) { if (!corsWarned) { corsWarned = true; ui.toast('Источник без CORS — WebGL не может читать кадры', 5000); } }
}

/* ---------------- Layout (cached viewport, no per-frame DOM reads) ---------------- */
function resize() {
  st.W0 = innerWidth; st.H0 = innerHeight;
  st.dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(st.W0 * st.dpr), h = Math.round(st.H0 * st.dpr);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  layout(true);
}
function layout(force) {
  const W = cv.width, H = cv.height;
  const browserLand = st.W0 > st.H0 * 1.05;
  const rot = !browserLand && C.phys !== 0 && !st.nativeAuto ? C.phys : 0;   // never double-rotate
  const vw = rot ? H : W, vh = rot ? W : H;
  const a = st.vw / st.vh, s = vw / vh;
  const zoomable = !browserLand && !rot && a > s * 1.001, mFit = a / s;
  const M = !zoomable ? 1 : S.zoom == null ? mFit : Math.max(1, Math.min(mFit, S.zoom));
  const prev = st.L;
  st.L = { rot, browserLand, pan: zoomable && M > 1.001, zoomable, a, s, vw, vh, M, mFit, sx: 1 / M, hc: 2 * Math.min(1, M * s / a), W: vw / st.dpr };
  if (force || !prev || prev.M !== M || prev.rot !== rot || prev.browserLand !== browserLand) {
    st.dirty = true; ui.setRot(rot);
    if (prev && prev.rot !== rot) ui.toast(rot ? 'Весь кадр — поворот заблокирован' : 'Вертикальный режим');
    else if (prev && prev.browserLand !== browserLand) ui.toast(browserLand ? 'Горизонтально: весь кадр' : 'Вертикальный режим');
  }
}
function hudRect(w) { const m = 16, s = Math.round(w * 0.34); return { x: m, y: 72, s }; }

/* ---------------- Draw ---------------- */
const ROT = { 0: [1, 0, 0, 1], 1: [0, 1, -1, 0], '-1': [0, -1, 1, 0] };
function draw() {
  const L = st.L;
  gl.viewport(0, 0, cv.width, cv.height); gl.clear(gl.COLOR_BUFFER_BIT);
  if (!st.hasTex) return;
  gl.uniformMatrix2fv(uRot, false, ROT[L.rot]);
  if (L.pan) {
    const sx = L.sx, off = C.X * (1 - sx);
    gl.uniform4f(uDst, -1, -L.hc / 2, 2, L.hc); gl.uniform4f(uUV, off, 0, sx, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (S.hud && S.profile === 'esports' && L.hc >= 1.999) {                     // Crop-and-Pin: 2nd draw, same texture
      const r = hudRect(L.vw / st.dpr), k = st.dpr, w = r.s * k / L.vw * 2, h = r.s * k / L.vh * 2;
      gl.uniform4f(uDst, -1 + r.x * k / L.vw * 2, 1 - r.y * k / L.vh * 2 - h, w, h);
      gl.uniform4f(uUV, HUD_UV[0], HUD_UV[1], HUD_UV[2], HUD_UV[3]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  } else {
    let w = 2, h = 2; if (L.a > L.s) h = 2 * L.s / L.a; else w = 2 * L.a / L.s;
    gl.uniform4f(uDst, -w / 2, -h / 2, w, h); gl.uniform4f(uUV, 0, 0, 1, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

/* ---------------- Frame pacing ---------------- */
const hasRVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
function onVF() { st.newFrame = true; video.requestVideoFrameCallback(onVF); }
if (hasRVFC) video.requestVideoFrameCallback(onVF);
let lastT = -1, prevNow = performance.now(), uiTick = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - prevNow) / 1000); prevNow = now;
  layout(false);
  if (C.update(dt, now, st.L)) st.dirty = true;
  if (!hasRVFC && video.readyState >= 2 && video.currentTime !== lastT) { lastT = video.currentTime; st.newFrame = true; }
  if (st.newFrame && video.readyState >= 2) { st.newFrame = false; upload(); st.dirty = true; }
  if (st.dirty) { st.dirty = false; draw(); }
  ui.mini(st.L.pan, st.L.sx, C.X, now);
  if (now - uiTick > 250) { uiTick = now; ui.setTime(video.currentTime, video.duration); }   // ~4 Hz
}

/* ---------------- Fullscreen / orientation lock ---------------- */
const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function toggleFs() {
  const d = document, el = d.documentElement;
  if (isFs()) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); return; }
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) { ui.toast('Полный экран не поддерживается (iPhone: «На экран Домой»)', 3500); return; }
  try { const p = req.call(el, { navigationUI: 'hide' }); if (p && p.then) p.then(tryLock, () => ui.toast('Полный экран отклонён')); } catch (_) {}
}
function tryLock() {
  const so = screen.orientation;
  if (!so || typeof so.lock !== 'function' || !isFs()) return;
  so.lock(C.phys === 0 ? 'portrait-primary' : C.phys < 0 ? 'landscape-primary' : 'landscape-secondary').catch(() => {});
}
const onFs = () => { if (!isFs() && screen.orientation && screen.orientation.unlock) { try { screen.orientation.unlock(); } catch (_) {} } resize(); };
document.addEventListener('fullscreenchange', onFs); document.addEventListener('webkitfullscreenchange', onFs);

/* ---------------- Wake Lock ---------------- */
let wl = null, wlPending = false;
async function wakeOn() {
  if (!('wakeLock' in navigator) || wl || wlPending || document.visibilityState !== 'visible') return;
  wlPending = true;
  try { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } catch (_) {}
  wlPending = false; if (video.paused) wakeOff();
}
function wakeOff() { if (wl) { wl.release().catch(() => {}); wl = null; } }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !video.paused) wakeOn(); });

/* ---------------- Video / sources ---------------- */
let hls = null, hlsLoading = null;
function loadHlsJs() {
  if (window.Hls) return Promise.resolve();
  return hlsLoading || (hlsLoading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = HLS_CDN; s.async = true; s.onload = res; s.onerror = () => { hlsLoading = null; rej(new Error('hls.js')); }; document.head.appendChild(s); }));
}
function play() { const p = video.play(); if (p && p.catch) p.catch(() => { ui.show(); ui.toast('Нажмите ▶'); }); }
async function openSource(url, label) {
  $('sErr').textContent = '';
  if (hls) { hls.destroy(); hls = null; }
  st.hasTex = false; corsWarned = false; C.recenterView();
  const isBlob = url.startsWith('blob:');
  if (isBlob || new URL(url, location.href).origin === location.origin) video.removeAttribute('crossorigin'); else video.crossOrigin = 'anonymous';
  const isHls = !isBlob && /\.m3u8(\?|#|$)/i.test(url);
  if (isHls) {
    try { await loadHlsJs(); } catch (e) { /* native fallback */ }
    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({ enableWorker: true, lowLatencyMode: true, capLevelToPlayerSize: false });
      hls.on(window.Hls.Events.ERROR, (_, d) => { if (d.fatal) ui.toast('HLS ошибка: ' + d.details, 4000); });
      hls.loadSource(url); hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = url;
    else { fail('HLS не поддерживается'); return; }
  } else video.src = url;
  ui.setTitle(label || decodeURIComponent(url.split('/').pop().split('?')[0]) || 'Видео');
  $('start').classList.add('gone'); ui.active(true); C.startSensors(); play();
  setTimeout(() => ui.onboarding(false), 400);
}
function fail(msg) { $('sErr').textContent = msg; $('start').classList.remove('gone'); ui.active(false); }
video.addEventListener('loadedmetadata', onDims); video.addEventListener('resize', onDims);
function onDims() { if (video.videoWidth && video.videoHeight) { st.vw = video.videoWidth; st.vh = video.videoHeight; layout(true); } st.newFrame = true; }
video.addEventListener('seeked', () => { st.newFrame = true; });
video.addEventListener('loadeddata', () => { st.newFrame = true; });
video.addEventListener('play', () => { ui.setPlaying(true); wakeOn(); });
video.addEventListener('pause', () => { ui.setPlaying(false); wakeOff(); });
video.addEventListener('ended', wakeOff);
video.addEventListener('error', () => { const c = video.error && video.error.code; fail(`Не удалось открыть видео (код ${c}). Для ссылки нужен CORS.`); });

// start screen — every action is a user gesture: ask sensor permission first (sync, iOS), then load.
const gesture = (fn) => () => { C.requestPermission(); fn(); };
K.tap($('sDemo'), gesture(() => openSource(SAMPLE_MP4, 'Тестовый ролик')));
K.tap($('sHls'), gesture(() => openSource(SAMPLE_HLS, 'Big Buck Bunny · HLS')));
$('sFile').addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; C.requestPermission(); openSource(URL.createObjectURL(f), f.name); });
const openUrl = gesture(() => { const u = $('sUrl').value.trim(); if (!u) return; try { openSource(new URL(u).href); } catch (_) { $('sErr').textContent = 'Неверная ссылка'; } });
K.tap($('sOpen'), openUrl);
$('sUrl').addEventListener('keydown', (e) => { if (e.key === 'Enter') openUrl(); });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

addEventListener('resize', resize, { passive: true });
if (window.visualViewport) visualViewport.addEventListener('resize', resize, { passive: true });
if (screen.orientation) screen.orientation.addEventListener('change', resize); else addEventListener('orientationchange', resize);
resize();
requestAnimationFrame(frame);
window.__gv = { st, C, S, ui };   // debug
})();
