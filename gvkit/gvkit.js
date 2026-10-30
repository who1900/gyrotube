/* GVKit — shared gyro core + Material 3 dark UI for GyroView & GyroTube.
   No innerHTML (YouTube Trusted Types), inline SVG icons, transform/opacity-only animations. */
(function () {
'use strict';
if (window.GVKit) return;
const NS = 'http://www.w3.org/2000/svg';

/* ============================== icons: Lucide (ISC) 24dp line set, 2px round stroke — one consistent family ============================== */
const ICONS = {"play":[["path",{"d":"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"}]],"pause":[["rect",{"x":"14","y":"3","width":"5","height":"18","rx":"1"}],["rect",{"x":"5","y":"3","width":"5","height":"18","rx":"1"}]],"rew":[["path",{"d":"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"}],["path",{"d":"M3 3v5h5"}],["text",{"x":"12","y":"15.4","text-anchor":"middle","font-size":"8","font-weight":"700","fill":"currentColor","stroke":"none","_t":"10"}]],"fwd":[["path",{"d":"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"}],["path",{"d":"M21 3v5h-5"}],["text",{"x":"12","y":"15.4","text-anchor":"middle","font-size":"8","font-weight":"700","fill":"currentColor","stroke":"none","_t":"10"}]],"back":[["path",{"d":"m12 19-7-7 7-7"}],["path",{"d":"M19 12H5"}]],"close":[["path",{"d":"M18 6 6 18"}],["path",{"d":"m6 6 12 12"}]],"settings":[["path",{"d":"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"}],["circle",{"cx":"12","cy":"12","r":"3"}]],"zoom":[["path",{"d":"M3 7V5a2 2 0 0 1 2-2h2"}],["path",{"d":"M17 3h2a2 2 0 0 1 2 2v2"}],["path",{"d":"M21 17v2a2 2 0 0 1-2 2h-2"}],["path",{"d":"M7 21H5a2 2 0 0 1-2-2v-2"}]],"esports":[["line",{"x1":"6","x2":"10","y1":"11","y2":"11"}],["line",{"x1":"8","x2":"8","y1":"9","y2":"13"}],["line",{"x1":"15","x2":"15.01","y1":"12","y2":"12"}],["line",{"x1":"18","x2":"18.01","y1":"10","y2":"10"}],["path",{"d":"M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"}]],"cinema":[["path",{"d":"m12.296 3.464 3.02 3.956"}],["path",{"d":"M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z"}],["path",{"d":"M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"}],["path",{"d":"m6.18 5.276 3.1 3.899"}]],"tune":[["path",{"d":"m12 14 4-4"}],["path",{"d":"M3.34 19a10 10 0 1 1 17.32 0"}]],"tilt":[["path",{"d":"m15.194 13.707 3.814 1.86-1.86 3.814"}],["path",{"d":"M16.47214 7.52786 A 5 10 0 1 0 13 21.79796"}],["path",{"d":"M21.79796 11 A 10 5 0 1 0 19 15.57071"}]],"center":[["line",{"x1":"2","x2":"5","y1":"12","y2":"12"}],["line",{"x1":"19","x2":"22","y1":"12","y2":"12"}],["line",{"x1":"12","x2":"12","y1":"2","y2":"5"}],["line",{"x1":"12","x2":"12","y1":"19","y2":"22"}],["circle",{"cx":"12","cy":"12","r":"7"}],["circle",{"cx":"12","cy":"12","r":"3"}]],"pip":[["path",{"d":"M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"}],["rect",{"width":"10","height":"7","x":"12","y":"13","rx":"2"}]],"fullscreen":[["path",{"d":"M8 3H5a2 2 0 0 0-2 2v3"}],["path",{"d":"M21 8V5a2 2 0 0 0-2-2h-3"}],["path",{"d":"M3 16v3a2 2 0 0 0 2 2h3"}],["path",{"d":"M16 21h3a2 2 0 0 0 2-2v-3"}]],"fsexit":[["path",{"d":"M8 3v3a2 2 0 0 1-2 2H3"}],["path",{"d":"M21 8h-3a2 2 0 0 1-2-2V3"}],["path",{"d":"M3 16h3a2 2 0 0 1 2 2v3"}],["path",{"d":"M16 21v-3a2 2 0 0 1 2-2h3"}]],"home":[["path",{"d":"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"}],["path",{"d":"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"}]],"menu":[["path",{"d":"M4 5h16"}],["path",{"d":"M4 12h16"}],["path",{"d":"M4 19h16"}]],"search":[["path",{"d":"m21 21-4.34-4.34"}],["circle",{"cx":"11","cy":"11","r":"8"}]],"gyro":[["path",{"d":"m15.194 13.707 3.814 1.86-1.86 3.814"}],["path",{"d":"M16.47214 7.52786 A 5 10 0 1 0 13 21.79796"}],["path",{"d":"M21.79796 11 A 10 5 0 1 0 19 15.57071"}]],"check":[["path",{"d":"M20 6 9 17l-5-5"}]],"info":[["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M12 16v-4"}],["path",{"d":"M12 8h.01"}]],"swipe":[["path",{"d":"m18 8 4 4-4 4"}],["path",{"d":"M2 12h20"}],["path",{"d":"m6 8-4 4 4 4"}]],"pinch":[["path",{"d":"m15 15 6 6"}],["path",{"d":"m15 9 6-6"}],["path",{"d":"M21 16v5h-5"}],["path",{"d":"M21 8V3h-5"}],["path",{"d":"M3 16v5h5"}],["path",{"d":"m3 21 6-6"}],["path",{"d":"M3 8V3h5"}],["path",{"d":"M9 9 3 3"}]],"ad":[["path",{"d":"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"}],["path",{"d":"m9 12 2 2 4-4"}]],"folder":[["path",{"d":"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"}]],"link":[["path",{"d":"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"}],["path",{"d":"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"}]],"sub":[["path",{"d":"M21 5H3"}],["path",{"d":"M10 12H3"}],["path",{"d":"M10 19H3"}],["path",{"d":"M15 12.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997a1 1 0 0 1-1.517-.86z"}]],"library":[["path",{"d":"m16 6 4 14"}],["path",{"d":"M12 6v14"}],["path",{"d":"M8 8v12"}],["path",{"d":"M4 4v16"}]],"history":[["path",{"d":"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"}],["path",{"d":"M3 3v5h5"}],["path",{"d":"M12 7v5l4 2"}]],"account":[["circle",{"cx":"12","cy":"12","r":"10"}],["circle",{"cx":"12","cy":"10","r":"3"}],["path",{"d":"M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"}]],"shorts":[["path",{"d":"M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"}]],"smartphone":[["rect",{"width":"14","height":"20","x":"5","y":"2","rx":"2","ry":"2"}],["path",{"d":"M12 18h.01"}]],"sliders":[["path",{"d":"M10 5H3"}],["path",{"d":"M12 19H3"}],["path",{"d":"M14 3v4"}],["path",{"d":"M16 17v4"}],["path",{"d":"M21 12h-9"}],["path",{"d":"M21 19h-5"}],["path",{"d":"M21 5h-7"}],["path",{"d":"M8 10v4"}],["path",{"d":"M8 12H3"}]]};
const FILLED = { play: 1, pause: 1 };
function fillIcon(s, name) {
  while (s.firstChild) s.removeChild(s.firstChild);
  for (const [tag, a] of ICONS[name] || []) { const e = document.createElementNS(NS, tag); for (const k in a) if (k !== '_t') e.setAttribute(k, a[k]); if (a._t) e.textContent = a._t; s.appendChild(e); }
  s.classList.toggle('fi', !!FILLED[name]);
}
function icon(name, size) {
  const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  if (size) { s.style.width = size + 'px'; s.style.height = size + 'px'; }
  fillIcon(s, name); return s;
}
function setIcon(svgEl, name) { fillIcon(svgEl, name); }
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) { const v = attrs[k]; if (v == null || v === false) continue; if (k === 'text') e.textContent = v; else e.setAttribute(k, v === true ? '' : v); }
  for (const c of kids) if (c != null && c !== false) e.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return e;
}
/** Fast activation: instant=true fires on pointerdown (zero delay); otherwise on pointerup if the finger barely moved
 *  (safe inside scrollers). Either way no 300 ms click delay and no double-tap wait. */
function tap(el, fn, instant) {
  let sx = 0, sy = 0, id = -1, moved = false;
  el.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    if (instant) { e.preventDefault(); fn(e); return; }
    id = e.pointerId; sx = e.clientX; sy = e.clientY; moved = false;
  });
  if (!instant) {
    el.addEventListener('pointermove', (e) => { if (e.pointerId === id && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) moved = true; }, { passive: true });
    el.addEventListener('pointerup', (e) => { if (e.pointerId !== id) return; id = -1; if (!moved) fn(e); });
    el.addEventListener('pointercancel', () => { id = -1; });
  }
  el.addEventListener('click', (e) => { if (e.detail !== 0) e.preventDefault(); }); // keyboard (detail 0) still works
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } });
}

/* ============================== design tokens & CSS ============================== */
const TOKENS = `:host{all:initial;--pri:#FFB870;--on-pri:#4A2800;--pri-c:#6A3C00;--on-pri-c:#FFDCBE;--sec-c:#3A2E22;--on-sec-c:#F6DEC8;
--sur:#121316;--sc-low:#1A1B1F;--sc:#1E1F23;--sch:#282A2F;--schh:#33353A;--on-sur:#E3E2E6;--on-sv:#C4C6CF;--outl:#8E9099;--outv:#44474E;
--inv-sur:#E3E2E6;--inv-on:#2F3033;--ease:cubic-bezier(.2,0,0,1);--dur:200ms;
--in-t:var(--sat,env(safe-area-inset-top,0px));--in-r:var(--sar,env(safe-area-inset-right,0px));--in-b:var(--sab,env(safe-area-inset-bottom,0px));--in-l:var(--sal,env(safe-area-inset-left,0px))}
*{box-sizing:border-box;margin:0;-webkit-tap-highlight-color:transparent;font-family:Roboto,"Google Sans",system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;touch-action:manipulation;-webkit-user-select:none;user-select:none;outline:none}
button:focus-visible{outline:2px solid var(--pri);outline-offset:2px}
svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none;display:block;overflow:visible}
svg.fi{fill:currentColor}
svg text{font-family:Roboto,system-ui,sans-serif}
.ib{width:48px;height:48px;border-radius:24px;display:grid;place-items:center;color:var(--on-sur);transition:background-color 150ms var(--ease),transform 150ms var(--ease);flex:none}
.ib:active{background:rgba(227,226,230,.14);transform:scale(.94)}
`;
const CSS = TOKENS + `
#bd{position:fixed;inset:0;background:#000;z-index:2147482000;display:none}
#touch{position:fixed;inset:0;z-index:2147482800;display:none;touch-action:none}
#frame{position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:2147482900;pointer-events:none;transform-origin:50% 50%;--ft:var(--in-t);--fr:var(--in-r);--fb:var(--in-b);--fl:var(--in-l)}
#frame.rotp{--ft:var(--in-l);--fr:var(--in-t);--fb:var(--in-r);--fl:var(--in-b)}
#frame.rotn{--ft:var(--in-r);--fr:var(--in-b);--fb:var(--in-l);--fl:var(--in-t)}
#frame.rot{left:50%;top:50%}
.player{position:absolute;inset:0;display:none}
:host(.active) #touch,:host(.active) .player{display:block}
:host(.active.backdrop) #bd{display:block}
/* top gradient bar: back · title · settings — padded clear of status bar / cutout */
#ptop{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:4px;padding:calc(4px + var(--ft)) calc(4px + var(--fr)) 40px calc(4px + var(--fl));
  background:linear-gradient(rgba(0,0,0,.66),rgba(0,0,0,0));pointer-events:auto;transition:opacity var(--dur) var(--ease),transform var(--dur) var(--ease)}
#ptop .ib{color:#fff}
#ptitle{flex:1;min-width:0;font-size:16px;line-height:24px;font-weight:500;letter-spacing:.15px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 8px}
/* sliders (settings + seek) */
input[type=range]{-webkit-appearance:none;appearance:none;flex:1;min-width:0;height:44px;background:transparent;margin:0;touch-action:none;cursor:pointer}
input[type=range]::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:linear-gradient(90deg,var(--pri) 0 var(--p,0%),var(--outv) var(--p,0%) 100%)}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:var(--pri);margin-top:-8px;transition:transform 150ms var(--ease)}
input[type=range]:active::-webkit-slider-thumb{transform:scale(1.25)}
input[type=range]::-moz-range-track{height:4px;border-radius:2px;background:var(--outv)}
input[type=range]::-moz-range-progress{height:4px;border-radius:2px;background:var(--pri)}
input[type=range]::-moz-range-thumb{width:20px;height:20px;border:0;border-radius:50%;background:var(--pri)}
/* centre transport: ±10 s and a large play/pause on translucent circular scrims (no blur) */
#pmid{position:absolute;left:50%;top:50%;display:flex;align-items:center;gap:40px;transform:translate3d(-50%,-50%,0);pointer-events:auto;
  transition:opacity var(--dur) var(--ease),transform var(--dur) var(--ease)}
.cb{position:relative;width:56px;height:56px;border-radius:50%;background:rgba(0,0,0,.42);color:#fff;display:grid;place-items:center;
  box-shadow:0 0 0 1px rgba(255,255,255,.08);transition:transform 150ms var(--ease),background-color 150ms var(--ease)}
.cb svg{width:28px;height:28px}
.cb.big{width:76px;height:76px;background:rgba(0,0,0,.5)}.cb.big svg{width:34px;height:34px}
.cb::after{content:'';position:absolute;inset:-8px;border-radius:50%}
.cb:active{transform:scale(.9);background:rgba(0,0,0,.66)}
/* bottom: slim seek bar + one compact row of icon-only round buttons */
#pbot{position:absolute;left:0;right:0;bottom:0;padding:56px calc(12px + var(--fr)) calc(4px + var(--fb)) calc(12px + var(--fl));pointer-events:auto;
  background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.72));transition:opacity var(--dur) var(--ease),transform var(--dur) var(--ease)}
.player.hide #ptop{opacity:0;transform:translate3d(0,-12px,0);pointer-events:none}
.player.hide #pbot{opacity:0;transform:translate3d(0,12px,0);pointer-events:none}
.player.hide #pmid{opacity:0;transform:translate3d(-50%,-50%,0) scale(.92);pointer-events:none}
#seek{display:block;width:100%;height:28px}
#seek::-webkit-slider-runnable-track{height:3px;border-radius:2px;background:linear-gradient(90deg,var(--pri) 0 var(--p,0%),rgba(255,255,255,.28) var(--p,0%) 100%);transition:height 150ms var(--ease)}
#seek::-webkit-slider-thumb{width:14px;height:14px;margin-top:-5.5px;background:var(--pri);box-shadow:0 0 0 4px rgba(255,184,112,0);transition:transform 150ms var(--ease),box-shadow 150ms var(--ease)}
#seek:active::-webkit-slider-thumb{transform:scale(1.3);box-shadow:0 0 0 6px rgba(255,184,112,.22)}
.brow{display:flex;align-items:center;gap:4px;height:48px}
#time{flex:1;min-width:0;padding-left:2px;font-size:13px;line-height:16px;font-weight:500;letter-spacing:.4px;color:#fff;font-variant-numeric:tabular-nums;white-space:nowrap}
#time i{font-style:normal;color:rgba(255,255,255,.62)}
.rb{position:relative;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;color:#fff;transition:background-color 150ms var(--ease),color 150ms var(--ease),transform 150ms var(--ease)}
.rb:active{background:rgba(255,255,255,.14);transform:scale(.92)}
.rb.on{color:var(--pri);background:rgba(255,184,112,.14)}
.rb .badge{position:absolute;right:0;top:4px;min-width:20px;height:16px;padding:0 4px;border-radius:8px;background:var(--pri);color:var(--on-pri);
  font-size:10px;line-height:16px;font-weight:700;text-align:center;letter-spacing:0;display:none}
.rb .badge.show{display:block}
/* minimap */
#mini{position:absolute;left:50%;top:calc(64px + var(--ft));width:136px;height:10px;margin-left:-68px;border-radius:5px;background:rgba(18,19,22,.78);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);opacity:0;transform:translate3d(0,-4px,0);transition:opacity 250ms var(--ease),transform 250ms var(--ease)}
#mini.show{opacity:1;transform:none}
#miniwin{position:absolute;left:0;top:0;height:10px;border-radius:5px;background:var(--pri);will-change:transform}
#minic{position:absolute;left:67px;top:-3px;width:2px;height:16px;border-radius:1px;background:rgba(255,255,255,.55)}
/* toast (M3 snackbar) */
#toast{position:absolute;left:50%;top:calc(88px + var(--ft));max-width:calc(100% - 32px);transform:translate3d(-50%,-8px,0);background:var(--inv-sur);color:var(--inv-on);
  font-size:14px;line-height:20px;letter-spacing:.25px;padding:12px 16px;border-radius:8px;opacity:0;transition:opacity var(--dur) var(--ease),transform var(--dur) var(--ease);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;z-index:5}
#toast.show{opacity:1;transform:translate3d(-50%,0,0)}
#adb{position:absolute;left:calc(16px + var(--fl));top:calc(64px + var(--ft));display:none;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:8px;
  background:var(--sec-c);color:var(--on-sec-c);font-size:13px;font-weight:500}
#adb.show{display:flex}#adb svg{width:18px;height:18px}
/* scrim + bottom sheet */
#scrim{position:absolute;inset:0;background:rgba(0,0,0,.5);opacity:0;pointer-events:none;transition:opacity 250ms var(--ease)}
#scrim.show{opacity:1;pointer-events:auto}
#sheet{position:absolute;left:var(--fl);right:var(--fr);bottom:0;margin:0 auto;max-width:640px;max-height:86%;display:flex;flex-direction:column;background:var(--sc-low);
  border-radius:28px 28px 0 0;transform:translate3d(0,105%,0);transition:transform 250ms var(--ease),visibility 0s linear 250ms;pointer-events:auto;visibility:hidden}
#sheet.open{transform:none;visibility:visible;transition:transform 250ms var(--ease),visibility 0s}
#sheet.drag{transition:none}
#shead{padding:0 0 4px;touch-action:none;cursor:grab}
.handle{width:32px;height:4px;border-radius:2px;background:var(--outl);opacity:.7;margin:16px auto 12px}
.shtitle{display:flex;align-items:center;padding:0 12px 0 24px}
.shtitle b{flex:1;font-size:22px;line-height:28px;font-weight:400;color:var(--on-sur)}
#sbody{overflow-y:auto;overscroll-behavior:contain;padding:0 0 calc(16px + var(--fb));touch-action:pan-y;-webkit-overflow-scrolling:touch}
.sec h3{font-size:14px;line-height:20px;font-weight:500;letter-spacing:.1px;color:var(--pri);padding:20px 24px 8px}
.sec+.sec{border-top:1px solid var(--outv)}
.row{min-height:56px;display:flex;align-items:center;gap:16px;padding:8px 24px;transition:background-color 150ms var(--ease)}
.row.tapr:active{background:rgba(227,226,230,.08)}
.row>svg{color:var(--on-sv)}
.tx{flex:1;min-width:0}.t{font-size:16px;line-height:24px;letter-spacing:.5px;color:var(--on-sur)}.s{font-size:14px;line-height:20px;letter-spacing:.25px;color:var(--on-sv)}
.row.col{flex-direction:column;align-items:stretch;gap:4px}
.hd{display:flex;align-items:center;gap:16px}.hd .t{flex:1}.val{font-size:14px;font-weight:500;color:var(--pri);font-variant-numeric:tabular-nums}
.row.col input[type=range]{width:100%;height:36px}
.sw{position:relative;width:52px;height:32px;border-radius:16px;background:var(--schh);box-shadow:inset 0 0 0 2px var(--outl);flex:none;transition:background-color 200ms var(--ease),box-shadow 200ms var(--ease)}
.sw::after{content:'';position:absolute;left:4px;top:4px;width:24px;height:24px;border-radius:50%;background:var(--outl);transform:scale(.667);transition:transform 200ms var(--ease),background-color 200ms var(--ease)}
.sw.on{background:var(--pri);box-shadow:none}.sw.on::after{background:var(--on-pri);transform:translate3d(20px,0,0) scale(1)}
.seg{display:flex;height:40px;border-radius:20px;box-shadow:inset 0 0 0 1px var(--outl);overflow:hidden;margin-top:8px}
.seg button{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;font-size:14px;font-weight:500;letter-spacing:.1px;color:var(--on-sur);border-left:1px solid var(--outl);transition:background-color 150ms var(--ease)}
.seg button:first-child{border-left:0}
.seg button svg{width:18px;height:18px;display:none}
.seg button.on{background:var(--sec-c);color:var(--on-sec-c)}.seg button.on svg{display:block}
.tbtn{height:40px;padding:0 12px;border-radius:20px;color:var(--pri);font-size:14px;font-weight:500;letter-spacing:.1px}
.tbtn:active{background:rgba(255,184,112,.12)}
.fbtn{height:40px;padding:0 24px;border-radius:20px;background:var(--pri);color:var(--on-pri);font-size:14px;font-weight:500;letter-spacing:.1px;transition:transform 150ms var(--ease)}
.fbtn:active{transform:scale(.96)}
.about{padding:8px 24px 8px;font-size:14px;line-height:20px;color:var(--on-sv)}
/* onboarding */
#onb{position:absolute;inset:0;padding:var(--ft) var(--fr) var(--fb) var(--fl);display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.62);pointer-events:auto;opacity:0;transition:opacity 250ms var(--ease)}
#onb.show{opacity:1}
.card{width:min(344px,calc(100% - 48px));background:var(--sch);border-radius:28px;padding:24px;color:var(--on-sur);transform:scale(.94);transition:transform 250ms var(--ease)}
#onb.show .card{transform:none}
.card h2{font-size:24px;line-height:32px;font-weight:400;margin:8px 0 16px;text-align:center}
.ill{display:block;width:132px;height:96px;margin:0 auto}
.ill .ph{transform-origin:66px 52px;animation:gvtilt 2.4s var(--ease) infinite}
@keyframes gvtilt{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}}
.tip{display:flex;gap:16px;align-items:flex-start;padding:8px 0;font-size:14px;line-height:20px;color:var(--on-sv)}
.tip svg{color:var(--pri);margin-top:-2px}.tip b{display:block;color:var(--on-sur);font-weight:500;font-size:16px;line-height:24px}
.card .act{display:flex;justify-content:flex-end;margin-top:16px}
/* app bar (GyroTube browse mode) */
#abar{position:fixed;left:0;right:0;top:0;z-index:2147483000;height:calc(56px + var(--in-t));padding:var(--in-t) calc(4px + var(--in-r)) 0 calc(4px + var(--in-l));display:none;align-items:center;gap:0;background:var(--sur);color:var(--on-sur);box-shadow:0 1px 0 rgba(255,255,255,.06)}
:host(.appbar:not(.active)) #abar{display:flex}
.sbar{flex:1;min-width:0;height:40px;margin:0 4px;border-radius:20px;background:var(--sch);display:flex;align-items:center;gap:10px;padding:0 12px 0 12px;color:var(--on-sv);transition:box-shadow 150ms var(--ease)}
.sbar:focus-within{box-shadow:inset 0 0 0 2px var(--pri)}
.sbar input{flex:1;min-width:0;height:40px;border:0;background:none;color:var(--on-sur);font:inherit;font-size:16px;outline:none}
.sbar input::placeholder{color:var(--on-sv)}
.sbar input::-webkit-search-cancel-button{-webkit-appearance:none}
#abar .ib.acc{color:var(--pri)}
#amenu{position:fixed;right:calc(8px + var(--in-r));top:calc(56px + var(--in-t));z-index:2147483001;min-width:220px;padding:8px 0;border-radius:16px;background:var(--sch);
  transform-origin:top right;transform:scale(.92);opacity:0;pointer-events:none;transition:transform 150ms var(--ease),opacity 150ms var(--ease)}
#amenu.show{transform:none;opacity:1;pointer-events:auto}
:host(.active) #amenu{display:none}
.mi{display:flex;align-items:center;gap:12px;height:48px;padding:0 16px;width:100%;font-size:14px;letter-spacing:.1px;color:var(--on-sur);text-align:left}
.mi svg{color:var(--on-sv)}.mi:active{background:rgba(227,226,230,.1)}
`;

/* ============================== gyro core ============================== */
// Velocity-adaptive smoothing (One-Euro style): λ = lerp(lmin, lmax, smoothstep(V_LO, V_HI, |ω|)) · speed.
// lead = short look-ahead along tilt velocity (pointer-acceleration feel); 0 when still → no drift.
const PROFILES = { esports: { name: 'Esports', icon: 'esports', lmin: 5, lmax: 30, lead: 0.07 }, cinema: { name: 'Cinema', icon: 'cinema', lmin: 2.5, lmax: 12, lead: 0.035 } };
const V_LO = 5, V_HI = 120, V_TAU = 0.05, LEAD_LO = 30, LEAD_HI = 200, LEAD_MAX = 6;
const GMAX = 22, P = 1.05, HANDBACK_MS = 1500, LAND_ON = 60, LAND_OFF = 30, LAND_HOLD_MS = 250;
const SENS_PRESETS = [1, 1.5, 2], ZOOMS = [null, 2, 1.5, 1];
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
const wrap180 = (a) => ((a + 540) % 360) - 180;
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const DEFAULTS = { tilt: true, sens: 1, speed: 1, invert: false, dz: 0.5, profile: 'esports', zoom: null, hud: false, autoGyro: true, adblock: true, onboarded: false };

function core(cfg) {
  const key = cfg.key || 'gvkit';
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (_) {}
  const S = Object.assign({}, DEFAULTS, cfg.defaults || {}, saved);
  if (!PROFILES[S.profile]) S.profile = 'esports';
  const N = cfg.native || null;
  const C = { S, X: 0.5, Xt: 0.5, cur: null, ref: null, sensors: false, touching: false, manual: false, touchEnd: 0, vel: 0,
    phys: 0, physCand: 0, physSince: 0, nativeActive: false, nativeSeq: '', lastSample: 0, autoCal: 0, listeners: [] };
  const emit = (k) => { for (const f of C.listeners) try { f(k); } catch (_) {} };
  C.on = (f) => C.listeners.push(f);
  C.native = N;
  C.save = () => { try { localStorage.setItem(key, JSON.stringify(S)); } catch (_) {} };
  C.set = (k, v) => { S[k] = v; if (k === 'tilt' && v && C.cur) rebase(); if (k === 'invert' || k === 'sens' || k === 'dz') { if (C.cur && !C.manual) rebase(); } C.save(); emit(k); };
  const toast = (m) => cfg.toast && cfg.toast(m);
  const gmax = () => GMAX / S.sens;
  const dz = () => Math.max(0, Math.min(3, S.dz));
  function mapTilt(d) {
    const a = Math.abs(d), z = dz(); if (a <= z) return 0.5;
    const t = Math.min(1, (a - z) / Math.max(1, gmax() - z));
    return clamp01(0.5 + Math.sign(d) * Math.pow(t, P) * 0.5);
  }
  function delta() { const c = C.cur, r = C.ref, w = c.w; const d = w * wrap180(c.roll - r.roll) + (1 - w) * wrap180(c.gamma - r.gamma); return S.invert ? -d : d; }
  function calibrate(silent) {
    if (!C.cur) { if (!silent) toast('No gyro data — swipe to pan'); C.Xt = 0.5; C.manual = false; return; }
    C.ref = { roll: C.cur.roll, gamma: C.cur.gamma }; velLastD = null; C.vel = 0; C.manual = false; C.Xt = 0.5;
    if (!silent) toast('Center set');
  }
  function rebase() {   // gyro takes control back without a jump: current angle ↔ current X
    if (!C.cur) return;
    const t = Math.abs(2 * C.X - 1), z = dz(), s = Math.sign(C.X - 0.5);
    let d = t > 0 ? s * (z + Math.pow(t, 1 / P) * Math.max(1, gmax() - z)) : 0; if (S.invert) d = -d;
    C.ref = { roll: C.cur.roll - d, gamma: C.cur.gamma - d }; velLastD = null; C.vel = 0; C.Xt = mapTilt(delta());
  }
  let velLastD = null, velLastT = 0;
  function trackVel() {
    if (!C.ref || !C.cur) return;
    const now = performance.now(), d = delta();
    if (velLastD !== null) {
      const dt = Math.min(0.1, Math.max(0.004, (now - velLastT) / 1000));
      let raw = wrap180(d - velLastD) / dt; if (!isFinite(raw)) raw = 0; raw = Math.max(-720, Math.min(720, raw));
      C.vel += (raw - C.vel) * (1 - Math.exp(-dt / V_TAU));
    }
    velLastD = d; velLastT = now;
  }
  const adaptiveLambda = () => { const p = PROFILES[S.profile]; return (p.lmin + (p.lmax - p.lmin) * smooth(V_LO, V_HI, Math.abs(C.vel))) * S.speed; };
  const leadDeg = () => { const p = PROFILES[S.profile]; return Math.max(-LEAD_MAX, Math.min(LEAD_MAX, C.vel * p.lead * smooth(LEAD_LO, LEAD_HI, Math.abs(C.vel)))); };
  function physLand(gx, gy) {
    if (Math.hypot(gx, gy) < 0.5) { C.physCand = C.phys; return; }
    const ang = Math.atan2(Math.abs(gx), Math.abs(gy)) * R2D; let want = C.phys;
    if (ang > LAND_ON) want = gx > 0 ? 1 : -1; else if (ang < LAND_OFF) want = 0;
    const now = performance.now();
    if (want !== C.physCand) { C.physCand = want; C.physSince = now; }
    else if (want !== C.phys && now - C.physSince > LAND_HOLD_MS) { C.phys = want; emit('phys'); }
  }
  /** gravity direction in device frame (W3C axes): upright portrait = (0,-1,0) */
  function ingest(gx, gy, gammaDeg) {
    C.cur = { gamma: gammaDeg, roll: Math.atan2(gx, -gy) * R2D, w: smooth(0.25, 0.55, -gy) };
    C.sensors = true; C.lastSample = performance.now();
    if (!C.ref) calibrate(true);
    if (C.autoCal === 0) C.autoCal = C.lastSample; else if (C.autoCal > 0 && C.lastSample - C.autoCal > 500) { C.autoCal = -1; if (!C.manual) calibrate(true); }
    trackVel(); physLand(gx, gy);
  }
  function onOrient(e) {
    if (C.nativeActive || e.beta == null || e.gamma == null) return;
    const b = e.beta * D2R, g = e.gamma * D2R;
    ingest(Math.cos(b) * Math.sin(g), -Math.sin(b), e.gamma);
  }
  function pollNative() {
    if (!C.nativeActive) return;
    let s = ''; try { s = N.rv(); } catch (_) { s = ''; }
    if (!s || s === C.nativeSeq) { if (performance.now() - (C.lastSample || C.nativeT0) > 1500) { /* stale → fall back */ C.nativeActive = false; } return; }
    C.nativeSeq = s; const p = s.split(','); const gx = +p[1], gy = +p[2], gz = +p[3];
    if (isFinite(gx)) ingest(gx, gy, Math.atan2(gx, -gz) * R2D);
  }
  let listening = false;
  C.startSensors = () => {
    if (!listening) { listening = true; addEventListener('deviceorientation', onOrient, { passive: true }); }
    if (N && typeof N.sensorStart === 'function') { try { C.nativeActive = !!N.sensorStart(); C.lastSample = 0; C.nativeT0 = performance.now(); } catch (_) { C.nativeActive = false; } }
  };
  document.addEventListener('visibilitychange', () => { if (listening && document.visibilityState === 'visible') C.startSensors(); });   // re-arm native after resume
  C.stopSensors = () => { if (N && typeof N.sensorStop === 'function') try { N.sensorStop(); } catch (_) {} C.nativeActive = false;
    if (listening) { listening = false; removeEventListener('deviceorientation', onOrient); } };
  C.requestPermission = () => {   // must be called synchronously in a user gesture (iOS Safari)
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') return DOE.requestPermission().then((r) => r === 'granted').catch(() => false);
    return Promise.resolve(true);
  };
  /** per-frame update; L = {pan, M, W}; returns true when X changed */
  C.update = (dt, now, L) => {
    pollNative();
    if (performance.now() - velLastT > 80) C.vel *= Math.exp(-dt / 0.08);
    if (!L || !L.pan) return false;
    if (!C.touching && C.manual && S.tilt && C.cur && now - C.touchEnd > HANDBACK_MS) { rebase(); C.manual = false; }
    if (!C.touching && !C.manual && S.tilt && C.cur && C.ref) C.Xt = mapTilt(delta() + leadDeg());
    const lam = C.touching ? 35 : adaptiveLambda(), diff = C.Xt - C.X;
    if (diff === 0) return false;
    C.X = Math.abs(diff) < 1e-4 ? C.Xt : C.X + diff * (1 - Math.exp(-lam * dt));
    return true;
  };
  C.calibrate = calibrate; C.rebase = rebase; C.mapTilt = mapTilt;
  C.recenterView = () => { C.X = C.Xt = 0.5; C.manual = false; if (C.cur) calibrate(true); };
  /* zoom helpers: S.zoom = null (fit height) | number magnification vs full width (1 = full 16:9) */
  C.zoomLabel = () => { const z = S.zoom; return z == null ? 'Height' : z <= 1.001 ? '16:9' : (Math.round(z * 10) / 10) + '×'; };
  C.setZoom = (z, quiet) => { C.set('zoom', z); if (!quiet) toast('Zoom: ' + (z == null ? 'fit height' : z <= 1.001 ? 'full 16:9 frame' : C.zoomLabel())); };
  C.zoomCycle = (mFit) => { let i = ZOOMS.findIndex((z) => z === S.zoom); if (i < 0) i = 0;
    for (let k = 1; k <= ZOOMS.length; k++) { const z = ZOOMS[(i + k) % ZOOMS.length]; if (z == null || z < (mFit || 4) - 0.05) { C.setZoom(z); return; } } };
  let prevZoom = null;
  C.toggleFit = () => { if (S.zoom !== null && S.zoom <= 1.001) C.setZoom(prevZoom); else { prevZoom = S.zoom; C.setZoom(1); } };
  C.sensCycle = () => { const i = SENS_PRESETS.findIndex((v) => v > S.sens + 0.05); const v = i < 0 ? SENS_PRESETS[0] : SENS_PRESETS[i]; C.set('sens', v); toast('Sensitivity ×' + v.toFixed(1)); };
  C.profileToggle = () => { C.set('profile', S.profile === 'esports' ? 'cinema' : 'esports'); const p = PROFILES[S.profile]; toast(`Profile: ${p.name}`); };
  C.tiltToggle = () => { C.set('tilt', !S.tilt); toast(S.tilt ? 'Tilt on' : 'Tilt off — swipe to pan'); };
  /** touch: 1 finger drag pans (gyro paused), pinch zooms, 2-finger double tap → 16:9; instant onDown for controls */
  C.bindTouch = (el, hk) => {
    const ptrs = new Map(); let two = null, lastTwo = 0, drag = null;
    const pd = () => { const p = [...ptrs.values()]; return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); };
    const vx = (e) => { const r = hk.rot(); return r === 0 ? e.clientX : r > 0 ? -e.clientY : e.clientY; };
    el.addEventListener('pointerdown', (e) => {
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      const now = performance.now(); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) { C.touching = true; drag = { x: e.clientX, y: e.clientY, X: C.X, t: now, moved: false, vx: vx(e), shown: hk.onDown ? hk.onDown() : false }; }
      else if (ptrs.size === 2) { if (drag) drag.moved = true; const L = hk.L(); two = { t: now, d0: pd(), M0: L ? L.M : 1, pinched: false }; }
    });
    el.addEventListener('pointermove', (e) => {
      const p = ptrs.get(e.pointerId); if (!p) return; p.x = e.clientX; p.y = e.clientY;
      const L = hk.L();
      if (ptrs.size === 2 && two) { const d = pd(); if (Math.abs(d - two.d0) > 12) two.pinched = true;
        if (two.pinched && L && L.zoomable && two.d0 > 0) { const M = Math.max(1, Math.min(L.mFit, two.M0 * d / two.d0)); S.zoom = M >= L.mFit - 0.02 ? null : M; emit('zoom'); } return; }
      if (!drag || ptrs.size !== 1) return;
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) drag.moved = true;
      if (!L || !L.pan || !drag.moved) return;
      C.Xt = clamp01(drag.X - (vx(e) - drag.vx) / (L.W * (L.M - 1))); C.manual = true;
    }, { passive: true });
    const up = (e) => {
      if (!ptrs.delete(e.pointerId)) return;
      if (two && ptrs.size === 1) { const now = performance.now(); if (two.pinched) C.save();
        else if (now - two.t < 300) { if (now - lastTwo < 450) { lastTwo = 0; C.toggleFit(); } else lastTwo = now; } two = null; }
      if (ptrs.size) return;
      const d = drag; drag = null; C.touching = false; C.touchEnd = performance.now();
      if (d && !d.moved && C.touchEnd - d.t < 350 && hk.onTap) hk.onTap(d.shown);
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
  return C;
}

/* ============================== safe-area insets (CSS px), pushed by the native shell ============================== */
function setInsets(t, r, b, l) {
  const st = document.documentElement && document.documentElement.style; if (!st) return;
  st.setProperty('--sat', (+t || 0) + 'px'); st.setProperty('--sar', (+r || 0) + 'px'); st.setProperty('--sab', (+b || 0) + 'px'); st.setProperty('--sal', (+l || 0) + 'px');
}
window.__gvInsets = setInsets;

/* ============================== UI ============================== */
const MINI_W = 136;
function ui(cfg) {
  const C = cfg.core, S = C.S, F = cfg.features || {};
  const host = h('div', { id: cfg.id || 'gvkit-root' });
  const sr = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style'); style.textContent = CSS + (cfg.css || ''); sr.appendChild(style);
  if (F.backdrop) host.classList.add('backdrop');
  const $ = (id) => sr.getElementById(id);
  const ib = (id, ic, label, extra) => h('button', { id, class: 'ib' + (extra ? ' ' + extra : ''), type: 'button', 'aria-label': label, title: label }, icon(ic));

  // ---- player layer
  const ptop = h('div', { id: 'ptop' }, ib('pback', cfg.backIcon || 'back', 'Back'), h('div', { id: 'ptitle', text: cfg.title || '' }),
    F.fs ? ib('pfs', 'fullscreen', 'Full screen') : null, ib('pset', 'settings', 'Settings'));
  const seek = h('input', { id: 'seek', type: 'range', min: '0', max: '1000', step: '1', value: '0', 'aria-label': 'Seek' });
  const cb = (id, ic, label, big) => h('button', { id, class: 'cb' + (big ? ' big' : ''), type: 'button', 'aria-label': label, title: label }, icon(ic));
  const rb = (id, ic, label, badge) => h('button', { id, class: 'rb', type: 'button', 'aria-label': label, title: label }, icon(ic), badge ? h('span', { class: 'badge', id: id + 'b' }) : null);
  const pmid = h('div', { id: 'pmid' }, cb('prew', 'rew', 'Back 10 seconds'), cb('pplay', 'play', 'Play or pause', true), cb('pfwd', 'fwd', 'Forward 10 seconds'));
  const pbot = h('div', { id: 'pbot' }, seek,
    h('div', { class: 'brow' }, h('div', { id: 'time' }, h('span', { id: 'tc', text: '0:00' }), h('i', { text: ' / ' }), h('i', { id: 'td', text: '0:00' })),
      rb('bzoom', 'zoom', 'Zoom', true), rb('btilt', 'tilt', 'Tilt'), rb('bcenter', 'center', 'Center')));
  const mini = h('div', { id: 'mini', 'aria-hidden': 'true' }, h('div', { id: 'miniwin' }), h('div', { id: 'minic' }));
  const adb = h('div', { id: 'adb' }, icon('ad'), h('span', { text: 'Skipping ad' }));
  const player = h('div', { class: 'player hide', id: 'player' }, ptop, mini, adb, pmid, pbot);

  // ---- settings sheet
  const sbody = h('div', { id: 'sbody' });
  const sheet = h('div', { id: 'sheet', role: 'dialog', 'aria-label': 'Settings' },
    h('div', { id: 'shead' }, h('div', { class: 'handle' }), h('div', { class: 'shtitle' }, h('b', { text: 'Settings' }), ib('sclose', 'close', 'Close'))), sbody);
  const scrim = h('div', { id: 'scrim' });
  // ---- onboarding
  const ill = document.createElementNS(NS, 'svg'); ill.setAttribute('viewBox', '0 0 132 96'); ill.setAttribute('class', 'ill');
  const mk = (tag, a) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
  ill.append(mk('path', { d: 'M10 48 L2 52 L10 56 Z M122 48 L130 52 L122 56 Z', fill: '#FFB870' }),
    mk('rect', { x: 14, y: 30, width: 104, height: 44, rx: 8, fill: '#3A2E22' }));
  const ph = mk('g', { class: 'ph' });
  ph.append(mk('rect', { x: 50, y: 14, width: 32, height: 76, rx: 7, fill: '#1E1F23', stroke: '#E3E2E6', 'stroke-width': 3 }),
    mk('rect', { x: 54, y: 22, width: 24, height: 58, rx: 3, fill: '#6A3C00' }), mk('circle', { cx: 66, cy: 51, r: 5, fill: '#FFB870' }));
  ill.append(ph);
  const tip = (ic, t, s) => h('div', { class: 'tip' }, icon(ic), h('div', null, h('b', { text: t }), s));
  const onb = h('div', { id: 'onb' }, h('div', { class: 'card', role: 'dialog' }, ill, h('h2', { text: 'Watch by tilting' }),
    tip('tilt', 'Tilt the phone', 'Left and right, the frame follows your gaze.'),
    tip('swipe', 'Swipe to pan', 'Manual pan. Gyro control returns after 1.5 s.'),
    tip('pinch', 'Pinch to zoom', 'A two-finger pinch shows the full 16:9 frame.'),
    tip('center', 'Center', 'The current angle of the phone becomes neutral.'),
    h('div', { class: 'act' }, h('button', { id: 'onbok', class: 'fbtn', type: 'button' }, 'Got it'))));
  const toastEl = h('div', { id: 'toast', role: 'status' });
  const frame = h('div', { id: 'frame' }, player, scrim, sheet, onb, toastEl);
  const bd = h('div', { id: 'bd' }), touch = h('div', { id: 'touch' });
  sr.append(bd, touch, frame);

  // ---- app bar (GyroTube browse mode)
  let abar = null, amenu = null;
  if (cfg.appbar) {
    host.classList.add('appbar');
    const q = h('input', { id: 'aq', type: 'search', enterkeyhint: 'search', placeholder: 'Search YouTube', autocomplete: 'off', 'aria-label': 'Search' });
    abar = h('div', { id: 'abar' }, ib('aback', 'back', 'Back'), cfg.appbar.home ? ib('ahome', 'home', 'Home') : null, h('label', { class: 'sbar' }, icon('search', 20), q),
      ib('agyro', 'gyro', 'Gyro player', 'acc'), ib('amore', 'menu', 'Menu'));
    amenu = h('div', { id: 'amenu', role: 'menu' });
    for (const it of cfg.appbar.menu || []) { const b = h('button', { class: 'mi', type: 'button', role: 'menuitem' }, icon(it.icon), h('span', { text: it.label })); tap(b, () => { amenu.classList.remove('show'); it.go(); }); amenu.append(b); }
    sr.append(abar, amenu);
    tap($('aback'), () => cfg.appbar.back(), true);
    tap($('agyro'), () => cfg.appbar.gyro(), true);
    if (cfg.appbar.home) tap($('ahome'), () => cfg.appbar.home(), true);
    tap($('amore'), () => amenu.classList.toggle('show'), true);
    q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const v = q.value.trim(); if (v) { q.blur(); cfg.appbar.search(v); } } });
  }

  // ---- system UI: immersive only while the player is up; safe-area insets come from the native shell
  const NATIVE = C.native;
  function immersive(b) { if (NATIVE && typeof NATIVE.setImmersive === 'function') try { NATIVE.setImmersive(b); } catch (_) {} }
  if (NATIVE && typeof NATIVE.insets === 'function') try { const v = String(NATIVE.insets()).split(',').map(Number); if (v.length === 4) setInsets(v[0], v[1], v[2], v[3]); } catch (_) {}
  // if anything puts an element into DOM fullscreen, move the overlay inside it so taps still reach our controls
  const homeParent = () => cfg.parent ? cfg.parent() : document.documentElement;
  const onFsEl = () => { const fe = document.fullscreenElement || document.webkitFullscreenElement;
    const target = fe && fe !== document.documentElement && fe !== document.body && fe.tagName !== 'VIDEO' ? fe : homeParent();
    if (host.parentNode !== target && host.isConnected) target.appendChild(host); };
  document.addEventListener('fullscreenchange', onFsEl); document.addEventListener('webkitfullscreenchange', onFsEl);

  // ---- controls visibility
  let shown = false, hideT = 0, playing = false;
  const U = { host, touch, frame, sr };
  const autoHide = () => { clearTimeout(hideT); if (playing && !sheet.classList.contains('open')) hideT = setTimeout(U.hide, 3000); };
  U.show = () => { if (!shown) { shown = true; player.classList.remove('hide'); } autoHide(); };
  U.hide = () => { clearTimeout(hideT); if (shown) { shown = false; player.classList.remove('hide'); player.classList.add('hide'); } };
  U.isShown = () => shown;
  U.active = (b) => { host.classList.toggle('active', !!b); immersive(!!b); if (b) U.show(); else { closeSheet(); if (amenu) amenu.classList.remove('show'); } };
  U.setTitle = (t) => { $('ptitle').textContent = t || ''; };
  let lastTc = '', lastTd = '', lastP = -1;
  const fmt = (s) => { if (!isFinite(s)) return 'LIVE'; s = Math.max(0, Math.floor(s)); const hh = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = String(s % 60).padStart(2, '0'); return hh ? `${hh}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
  let seeking = false;
  /** call at ~4 Hz */
  U.setTime = (cur, dur) => {
    const a = fmt(cur), b = fmt(dur);
    if (a !== lastTc) { lastTc = a; $('tc').textContent = a; }
    if (b !== lastTd) { lastTd = b; $('td').textContent = b; }
    if (!seeking && isFinite(dur) && dur > 0) { const p = Math.round(cur / dur * 1000); if (p !== lastP) { lastP = p; seek.value = p; seek.style.setProperty('--p', p / 10 + '%'); } }
  };
  U.setPlaying = (b) => { b = !!b; if (b === playing) return; playing = b; setIcon($('pplay').firstChild, b ? 'pause' : 'play'); if (b) autoHide(); else { clearTimeout(hideT); U.show(); } };
  seek.addEventListener('input', () => { seeking = true; seek.style.setProperty('--p', seek.value / 10 + '%'); cfg.seek && cfg.seek(seek.value / 1000); U.show(); });
  seek.addEventListener('change', () => { seeking = false; });
  seek.addEventListener('pointerup', () => { seeking = false; });
  let toastT = 0;
  U.toast = (m, ms) => { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), ms || 1800); };
  U.ad = (b) => adb.classList.toggle('show', !!b);
  // minimap: visible window inside the full frame; shows while panning, fades ~1 s after last movement
  let mFrac = -1, mX = -1, mShown = false, mLast = 0; const win = $('miniwin');
  U.mini = (pan, frac, X, now) => {
    if (!pan) { if (mShown) { mShown = false; mini.classList.remove('show'); } return; }
    if (Math.abs(frac - mFrac) > 1e-3) { mFrac = frac; win.style.width = Math.max(8, frac * MINI_W).toFixed(1) + 'px'; mX = -1; mLast = now; }
    if (Math.abs(X - mX) > 0.0015) { mX = X; const w = Math.max(8, frac * MINI_W); win.style.transform = `translate3d(${(X * (MINI_W - w)).toFixed(1)}px,0,0)`; mLast = now; }
    const want = now - mLast < 1000 || C.touching;
    if (want !== mShown) { mShown = want; mini.classList.toggle('show', want); }
  };
  let rot = 0;
  U.setRot = (r) => {
    if (r === rot) return; rot = r;
    frame.classList.toggle('rotp', r > 0); frame.classList.toggle('rotn', r < 0);
    if (r) { frame.classList.add('rot'); frame.style.width = innerHeight + 'px'; frame.style.height = innerWidth + 'px'; frame.style.transform = `translate(-50%,-50%) rotate(${r > 0 ? -90 : 90}deg)`; }
    else { frame.classList.remove('rot'); frame.style.width = frame.style.height = frame.style.transform = ''; }
  };
  U.rot = () => rot;
  addEventListener('resize', () => { if (rot) { frame.style.width = innerHeight + 'px'; frame.style.height = innerWidth + 'px'; } }, { passive: true });

  // ---- chips & buttons (instant on pointerdown where not inside a scroller)
  tap($('pback'), () => cfg.act('back'), true);
  tap($('pset'), () => openSheet(), true);
  if (F.fs) tap($('pfs'), () => cfg.act('fs'), true);
  tap($('pplay'), () => { cfg.act('play'); U.show(); }, true);
  tap($('prew'), () => { cfg.act('rew'); U.show(); }, true);
  tap($('pfwd'), () => { cfg.act('fwd'); U.show(); }, true);
  tap($('bzoom'), () => { cfg.act('zoom'); U.show(); }, true);
  tap($('btilt'), () => { C.tiltToggle(); U.show(); }, true);
  tap($('bcenter'), () => { C.calibrate(false); cfg.act('center'); U.show(); }, true);
  player.addEventListener('pointerdown', () => { if (shown) autoHide(); }, { passive: true });

  // ---- settings content
  const controls = [];
  const sec = (title, ...rows) => h('div', { class: 'sec' }, h('h3', { text: title }), ...rows);
  const swRow = (k, t, s, ic) => { const sw = h('div', { class: 'sw', role: 'switch' }); const r = h('div', { class: 'row tapr' }, ic ? icon(ic) : null, h('div', { class: 'tx' }, h('div', { class: 't', text: t }), s ? h('div', { class: 's', text: s }) : null), sw);
    tap(r, () => { C.set(k, !S[k]); if (cfg.onSetting) cfg.onSetting(k); });
    controls.push(() => { sw.classList.toggle('on', !!S[k]); sw.setAttribute('aria-checked', String(!!S[k])); }); return r; };
  const slRow = (k, t, min, max, step, fmtv, s) => { const val = h('span', { class: 'val' }); const inp = h('input', { type: 'range', min, max, step, 'aria-label': t });
    const paint = () => { const p = (inp.value - min) / (max - min) * 100; inp.style.setProperty('--p', p + '%'); val.textContent = fmtv(+inp.value); };
    inp.addEventListener('input', () => { paint(); C.set(k, +inp.value); if (cfg.onSetting) cfg.onSetting(k); });
    controls.push(() => { if (document.activeElement !== inp) { inp.value = S[k]; paint(); } });
    return h('div', { class: 'row col' }, h('div', { class: 'hd' }, h('div', { class: 't', text: t }), val), s ? h('div', { class: 's', text: s }) : null, inp); };
  const segRow = (k, t, opts, s) => { const seg = h('div', { class: 'seg', role: 'radiogroup' });
    const bs = opts.map(([v, label]) => { const b = h('button', { type: 'button', role: 'radio' }, icon('check'), h('span', { text: label })); tap(b, () => { if (k === 'zoom') C.setZoom(v, true); else C.set(k, v); if (cfg.onSetting) cfg.onSetting(k); }); seg.append(b); return [v, b]; });
    controls.push(() => { for (const [v, b] of bs) { const on = S[k] === v; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); } });
    return h('div', { class: 'row col' }, h('div', { class: 't', text: t }), s ? h('div', { class: 's', text: s }) : null, seg); };
  const x = (v) => '×' + v.toFixed(1);
  ((...a) => sbody.append(...a.filter((c) => c != null)))(
    sec('Gyroscope', swRow('tilt', 'Tilt control', 'Turn off to pan by swiping only', 'tilt'),
      slRow('sens', 'Sensitivity', 0.5, 3, 0.1, x, 'How far you tilt the phone'),
      slRow('speed', 'Response', 0.5, 2, 0.1, x, 'Slower is smoother. Faster catches up sooner.'),
      swRow('invert', 'Invert direction', 'Tilting right pans the picture left', 'swipe'),
      slRow('dz', 'Dead zone', 0, 2, 0.1, (v) => v.toFixed(1) + '°', 'Ignore hand shake smaller than this angle')),
    sec('Profile', segRow('profile', 'Motion', [['esports', 'Esports'], ['cinema', 'Cinema']], 'Esports is quick and tight. Cinema is soft.')),
    sec('Picture', segRow('zoom', 'Zoom', [[null, 'Height'], [2, '2×'], [1.5, '1.5×'], [1, '16:9']]),
      F.hud ? swRow('hud', 'Pinned radar', 'Esports: keep the top-left of the frame on screen', 'pip') : null,
      F.autoGyro ? swRow('autoGyro', 'Open the gyro player automatically', 'When a video starts', 'gyro') : null),
    F.adblock ? sec('Ads', swRow('adblock', 'Block ads', 'Network ads, video ads, and promos', 'ad')) : null,
    sec('About', h('div', { class: 'about' }, h('div', { class: 't', text: (cfg.appName || 'GyroView') + ' ' + (cfg.version || '') }),
      h('div', { class: 's', text: cfg.aboutText || 'Vertical player with gyro panning.' })),
      (() => { const b = h('button', { class: 'tbtn', type: 'button', style: 'margin:0 12px 8px' }, 'Show tips'); tap(b, () => { closeSheet(); U.onboarding(true); }); return b; })()));
  U.refresh = () => {
    const zb = $('bzoomb'), zl = S.zoom == null ? '' : S.zoom <= 1.001 ? '16:9' : C.zoomLabel();
    zb.textContent = zl; zb.classList.toggle('show', !!zl); $('bzoom').classList.toggle('on', S.zoom !== null);
    const ti = $('btilt'); ti.classList.toggle('on', !!S.tilt); ti.setAttribute('aria-pressed', String(!!S.tilt)); ti.title = S.tilt ? 'Tilt on' : 'Tilt off';
    for (const f of controls) f();
  };
  C.on(() => U.refresh());

  // ---- sheet open/close + drag-to-dismiss
  function openSheet() { U.refresh(); clearTimeout(hideT); sheet.classList.add('open'); scrim.classList.add('show'); if (amenu) amenu.classList.remove('show'); }
  function closeSheet() { sheet.classList.remove('open'); scrim.classList.remove('show'); sheet.style.transform = ''; autoHide(); }
  U.openSettings = openSheet; U.closeSettings = closeSheet; U.settingsOpen = () => sheet.classList.contains('open');
  tap(scrim, closeSheet, true); tap($('sclose'), closeSheet, true);
  (() => { const hd = $('shead'); let y0 = 0, id = -1, dy = 0;
    const axis = (e) => rot === 0 ? e.clientY : rot > 0 ? e.clientX : -e.clientX;   // "down" in the rotated frame
    hd.addEventListener('pointerdown', (e) => { id = e.pointerId; y0 = axis(e); dy = 0; try { hd.setPointerCapture(id); } catch (_) {} sheet.classList.add('drag'); });
    hd.addEventListener('pointermove', (e) => { if (e.pointerId !== id) return; dy = Math.max(0, axis(e) - y0); sheet.style.transform = `translate3d(0,${dy}px,0)`; }, { passive: true });
    const end = (e) => { if (e.pointerId !== id) return; id = -1; sheet.classList.remove('drag'); sheet.style.transform = ''; if (dy > 80) closeSheet(); };
    hd.addEventListener('pointerup', end); hd.addEventListener('pointercancel', end); })();
  // ---- onboarding (one time)
  U.onboarding = (force) => {
    if (!force && S.onboarded) return;
    onb.style.display = 'flex'; requestAnimationFrame(() => requestAnimationFrame(() => onb.classList.add('show')));
  };
  const closeOnb = () => { onb.classList.remove('show'); setTimeout(() => { onb.style.display = 'none'; }, 260); if (!S.onboarded) C.set('onboarded', true); };
  tap($('onbok'), closeOnb, true);
  onb.addEventListener('pointerdown', (e) => { if (e.target === onb) closeOnb(); });
  U.back = () => {   // returns true if UI consumed the back press
    if (onb.classList.contains('show')) { closeOnb(); return true; }
    if (sheet.classList.contains('open')) { closeSheet(); return true; }
    if (amenu && amenu.classList.contains('show')) { amenu.classList.remove('show'); return true; }
    return false;
  };
  U.closeMenu = () => { if (amenu) amenu.classList.remove('show'); };
  U.setGyroAvailable = (b) => { if (abar) $('agyro').style.display = b ? '' : 'none'; };
  U.setQuery = (q) => { if (abar && document.activeElement !== host) $('aq').value = q; };
  U.refresh();
  return U;
}

window.GVKit = { core, ui, icon, h, tap, TOKENS, PROFILES, setInsets };
})();
