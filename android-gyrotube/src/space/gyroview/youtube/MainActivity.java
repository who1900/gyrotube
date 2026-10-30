package space.gyroview.youtube;

import android.app.Activity;
import android.content.Intent;
import android.database.ContentObserver;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.DisplayCutout;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** GyroTube: m.youtube.com in a WebView + injected GyroView script, ad/tracker blocking, immersive UI. */
public class MainActivity extends Activity {
    private static final String HOME = "https://m.youtube.com/";

    private FrameLayout root;
    private WebView web;
    private View customView;
    private WebChromeClient.CustomViewCallback customCb;
    private String script = "";
    private boolean docStart = false;
    private ContentObserver rotObserver;
    private GravitySensor gravity;
    private volatile String insetsCss = "0,0,0,0";
    private boolean immersiveWanted = false;
    private android.content.SharedPreferences prefs;

    // ---------- ad / tracker blocking (precompiled; runs on the WebView IO thread for every request) ----------
    private static final Set<String> BLOCK_HOSTS = new HashSet<>(java.util.Arrays.asList(
        "doubleclick.net", "googlesyndication.com", "googleadservices.com", "google-analytics.com",
        "googletagservices.com", "googletagmanager.com", "adservice.google.com", "imasdk.googleapis.com",
        "2mdn.net", "ads.youtube.com", "adsense.com", "admob.com", "app-measurement.com", "scorecardresearch.com"));
    private static final Pattern BLOCK_PATH = Pattern.compile(
        "/api/stats/ads|/pagead/|/ptracking|/get_midroll_|/pcs/activeview|/youtubei/v1/log_event|/csi_204|/ad_data_204");
    static volatile boolean adblock = true;
    static boolean isBlocked(Uri u) {
        if (!adblock) return false;
        String h = u.getHost(); if (h == null) return false;
        // fast path: video segments and thumbnails are the bulk of requests
        if (h.endsWith(".googlevideo.com") || h.endsWith(".ytimg.com") || h.endsWith(".ggpht.com")) return false;
        h = h.toLowerCase(Locale.ROOT);
        for (int i = 0; i >= 0; i = h.indexOf('.', i) + 1) {   // walk suffixes: a.b.c → b.c → c
            if (BLOCK_HOSTS.contains(h.substring(i))) return true;
            if (h.indexOf('.', i) < 0) break;
        }
        if (h.endsWith("youtube.com") || h.endsWith("google.com")) {
            String p = u.getPath();
            return p != null && BLOCK_PATH.matcher(p).find();
        }
        return false;
    }
    static WebResourceResponse empty() {
        HashMap<String, String> hdr = new HashMap<>(); hdr.put("Access-Control-Allow-Origin", "*");
        return new WebResourceResponse("text/plain", "utf-8", 204, "No Content", hdr, new ByteArrayInputStream(new byte[0]));
    }
    static boolean inApp(Uri u) {
        String h = u.getHost(); if (h == null) return false; h = h.toLowerCase(Locale.ROOT);
        return h.equals("youtube.com") || h.endsWith(".youtube.com") || h.equals("youtu.be")
            || h.endsWith(".google.com") || h.equals("google.com") || h.endsWith(".gstatic.com")
            || h.endsWith(".googleusercontent.com") || h.startsWith("accounts.google.") || h.endsWith(".youtube-nocookie.com");
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
        script = readAsset("inject.js");   // gvkit.js + gyrotube.js, concatenated at build time
        prefs = getSharedPreferences("gyrotube", MODE_PRIVATE);
        adblock = prefs.getBoolean("adblock", true);
        gravity = new GravitySensor(this);

        root = new FrameLayout(this);
        root.setBackgroundColor(0xFF121316);
        web = new WebView(this);
        web.setBackgroundColor(0xFF121316);
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override public WindowInsets onApplyWindowInsets(View v, WindowInsets ins) { onInsets(ins); return ins; }
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setSupportMultipleWindows(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setUserAgentString(chromeUa(s.getUserAgentString()));
        try {   // don't announce "X-Requested-With: <package>" (helps Google sign-in / normal site)
            if (WebViewFeature.isFeatureSupported(WebViewFeature.REQUESTED_WITH_HEADER_ALLOW_LIST))
                WebSettingsCompat.setRequestedWithHeaderOriginAllowList(s, Collections.<String>emptySet());
        } catch (Throwable ignored) {}

        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        cm.setAcceptThirdPartyCookies(web, true);
        String ck = cm.getCookie("https://m.youtube.com");
        if (ck == null || !ck.contains("PREF=")) cm.setCookie("https://m.youtube.com", "PREF=f6=400; Domain=.youtube.com; Path=/; Max-Age=63072000; Secure");

        web.addJavascriptInterface(new Bridge(), "GyroTubeNative");
        try {
            if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
                Set<String> origins = new HashSet<>();
                origins.add("https://m.youtube.com"); origins.add("https://www.youtube.com"); origins.add("https://youtube.com");
                WebViewCompat.addDocumentStartJavaScript(web, script, origins);
                docStart = true;
            }
        } catch (Throwable ignored) { docStart = false; }

        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return isBlocked(r.getUrl()) ? empty() : null;
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl(); String sc = u.getScheme();
                if ("https".equals(sc) || "http".equals(sc)) {
                    if (inApp(u)) return false;
                    openExternal(u); return true;
                }
                if ("intent".equals(sc)) {   // e.g. "open in app" — load the web fallback instead
                    try { Intent it = Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME);
                        String fb = it.getStringExtra("browser_fallback_url");
                        if (fb != null && inApp(Uri.parse(fb))) v.loadUrl(fb); } catch (Exception ignored) {}
                    return true;
                }
                if ("vnd.youtube".equals(sc)) return true;
                openExternal(u); return true;
            }
            @Override public void onPageStarted(WebView v, String url, android.graphics.Bitmap f) { if (!docStart) inject(url); pushInsets(); }
            @Override public void onPageFinished(WebView v, String url) { inject(url); pushInsets(); CookieManager.getInstance().flush(); }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onShowCustomView(final View view, final CustomViewCallback cb) {
                if (customView != null) { cb.onCustomViewHidden(); return; }
                // Prefer our own full-viewport gyro player (the JS overlay can't draw over a native custom view)
                web.evaluateJavascript("(window.gtFullscreen&&gtFullscreen())||false", new ValueCallback<String>() {
                    @Override public void onReceiveValue(String v) {
                        if ("true".equals(v)) { cb.onCustomViewHidden(); applySystemUi(); }
                        else showCustom(view, cb);
                    }
                });
            }
            private void showCustom(View view, CustomViewCallback cb) {
                if (customView != null) { cb.onCustomViewHidden(); return; }
                customView = view; customCb = cb;
                view.setBackgroundColor(Color.BLACK);
                root.addView(view, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                web.setVisibility(View.INVISIBLE);
                immersive();
            }
            @Override public void onHideCustomView() { hideCustom(); }
            @Override public View getVideoLoadingProgressView() { View p = new View(MainActivity.this); p.setBackgroundColor(Color.BLACK); return p; }
        });
        if (Build.VERSION.SDK_INT >= 24) {
            ServiceWorkerController.getInstance().setServiceWorkerClient(new ServiceWorkerClient() {
                @Override public WebResourceResponse shouldInterceptRequest(WebResourceRequest r) { return isBlocked(r.getUrl()) ? empty() : null; }
            });
        }

        rotObserver = new ContentObserver(new Handler(Looper.getMainLooper())) {
            @Override public void onChange(boolean self) { pushAutoRotate(); }
        };
        getContentResolver().registerContentObserver(Settings.System.getUriFor(Settings.System.ACCELEROMETER_ROTATION), false, rotObserver);

        String start = HOME;
        Uri data = getIntent() != null ? getIntent().getData() : null;
        if (data != null && inApp(data)) start = data.toString();
        if (b != null) web.restoreState(b); else web.loadUrl(start);
        immersive();
    }

    @Override protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        Uri d = i.getData(); if (d != null && inApp(d)) web.loadUrl(d.toString());
    }

    private void inject(String url) {
        if (url == null || !inApp(Uri.parse(url))) return;
        Uri u = Uri.parse(url); String h = u.getHost();
        if (h == null || !(h.equals("youtube.com") || h.endsWith(".youtube.com"))) return;
        web.evaluateJavascript(script, null);   // script guards against double injection
        pushAutoRotate();
    }
    private void pushAutoRotate() { web.evaluateJavascript("window.gtSetAutoRotate&&gtSetAutoRotate(" + isAutoRotate() + ")", null); }

    /** Present as regular mobile Chrome: drop "; wv", "Version/4.0" and device build details. */
    static String chromeUa(String ua) {
        String ver = "130.0.0.0";
        Matcher m = Pattern.compile("Chrome/(\\d+)[\\d.]*").matcher(ua);
        if (m.find()) ver = m.group(1) + ".0.0.0";
        return "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/" + ver + " Mobile Safari/537.36";
    }

    boolean isAutoRotate() {
        try { return Settings.System.getInt(getContentResolver(), Settings.System.ACCELEROMETER_ROTATION, 0) == 1; }
        catch (Exception e) { return false; }
    }

    class Bridge {
        @JavascriptInterface public boolean isAutoRotate() { return MainActivity.this.isAutoRotate(); }
        @JavascriptInterface public void keepScreenOn(final boolean on) {
            runOnUiThread(new Runnable() { @Override public void run() {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }});
        }
        @JavascriptInterface public String insets() { return insetsCss; }
        @JavascriptInterface public void setImmersive(final boolean on) {
            runOnUiThread(new Runnable() { @Override public void run() { immersiveWanted = on; applySystemUi(); } });
        }
        @JavascriptInterface public void setAdblock(boolean on) { adblock = on; prefs.edit().putBoolean("adblock", on).apply(); }
        @JavascriptInterface public boolean sensorStart() { return gravity.start(); }
        @JavascriptInterface public void sensorStop() { gravity.stop(); }
        @JavascriptInterface public String rv() { return gravity.read(); }
    }

    private String readAsset(String name) {
        try (InputStream in = getAssets().open(name)) {
            ByteArrayOutputStream o = new ByteArrayOutputStream(); byte[] buf = new byte[16384]; int n;
            while ((n = in.read(buf)) > 0) o.write(buf, 0, n);
            return o.toString("UTF-8");
        } catch (Exception e) { return ""; }
    }

    private void openExternal(Uri u) {
        try { Intent i = new Intent(Intent.ACTION_VIEW, u); i.addCategory(Intent.CATEGORY_BROWSABLE); startActivity(i); } catch (Exception ignored) {}
    }

    private void hideCustom() {
        if (customView == null) return;
        root.removeView(customView); customView = null;
        web.setVisibility(View.VISIBLE);
        if (customCb != null) { customCb.onCustomViewHidden(); customCb = null; }
        immersive();
    }

    /** Edge-to-edge always (content under bars/cutout, the page pads itself with the insets we push).
     *  System bars visible (dark) while browsing; hidden only in the gyro player or a fullscreen video. */
    @SuppressWarnings("deprecation")
    private void applySystemUi() {
        boolean hide = immersiveWanted || customView != null;
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                c.setSystemBarsAppearance(0, WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
                if (hide) c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                else c.show(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
            }
        } else {
            int f = View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
            if (hide) f |= View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION;
            getWindow().getDecorView().setSystemUiVisibility(f);
        }
        root.requestApplyInsets();
    }
    private void immersive() { applySystemUi(); }

    /** systemBars ∪ displayCutout, in CSS px */
    @SuppressWarnings("deprecation")
    private void onInsets(WindowInsets ins) {
        int t, r, b, l;
        if (Build.VERSION.SDK_INT >= 30) {
            android.graphics.Insets i = ins.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
            t = i.top; r = i.right; b = i.bottom; l = i.left;
        } else {
            t = ins.getSystemWindowInsetTop(); r = ins.getSystemWindowInsetRight(); b = ins.getSystemWindowInsetBottom(); l = ins.getSystemWindowInsetLeft();
            if (Build.VERSION.SDK_INT >= 28) { DisplayCutout dc = ins.getDisplayCutout();
                if (dc != null) { t = Math.max(t, dc.getSafeInsetTop()); r = Math.max(r, dc.getSafeInsetRight()); b = Math.max(b, dc.getSafeInsetBottom()); l = Math.max(l, dc.getSafeInsetLeft()); } }
        }
        float d = getResources().getDisplayMetrics().density;
        String css = Math.round(t / d) + "," + Math.round(r / d) + "," + Math.round(b / d) + "," + Math.round(l / d);
        if (!css.equals(insetsCss)) { insetsCss = css; pushInsets(); }
    }
    private void pushInsets() {
        if (web == null) return;
        String[] v = insetsCss.split(",");
        web.evaluateJavascript("(function(t,r,b,l){if(window.__gvInsets)return __gvInsets(t,r,b,l);var e=document.documentElement;if(!e)return;var s=e.style;"
            + "s.setProperty('--sat',t+'px');s.setProperty('--sar',r+'px');s.setProperty('--sab',b+'px');s.setProperty('--sal',l+'px');})("
            + v[0] + "," + v[1] + "," + v[2] + "," + v[3] + ")", null);
    }
    @Override public void onWindowFocusChanged(boolean f) { super.onWindowFocusChanged(f); if (f) immersive(); }

    @SuppressWarnings("deprecation")
    @Override public void onBackPressed() {
        if (customView != null) { hideCustom(); return; }
        web.evaluateJavascript("(window.gtBack&&gtBack())||false", new ValueCallback<String>() {
            @Override public void onReceiveValue(String v) {
                if ("true".equals(v)) return;
                if (web.canGoBack()) web.goBack(); else finish();
            }
        });
    }

    @Override protected void onPause() {
        gravity.pause();
        web.evaluateJavascript("window.gtPause&&gtPause()", null);
        CookieManager.getInstance().flush();
        web.onPause(); super.onPause();
    }
    @Override protected void onResume() { super.onResume(); web.onResume(); gravity.resume(); immersive(); pushAutoRotate(); }
    @Override protected void onSaveInstanceState(Bundle o) { super.onSaveInstanceState(o); web.saveState(o); }
    @Override protected void onDestroy() {
        if (rotObserver != null) getContentResolver().unregisterContentObserver(rotObserver);
        gravity.stop(); root.removeAllViews(); web.destroy(); super.onDestroy();
    }
}
