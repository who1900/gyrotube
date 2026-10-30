package space.gyroview.player;

import android.app.Activity;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.database.ContentObserver;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.View;
import android.view.WindowInsets;
import android.view.DisplayCutout;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** Minimal WebView shell for GyroView. Assets are served from https://appassets.androidplatform.net/
 *  (secure context → deviceorientation, wake lock, etc.) via shouldInterceptRequest, with Range support for video. */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String ORIGIN = "https://" + HOST + "/";
    private static final int REQ_FILE = 42;

    private WebView web;
    private ValueCallback<Uri[]> fileCb;
    private ContentObserver rotObserver;
    private GravitySensor gravity;
    private FrameLayout root;
    private volatile String insetsCss = "0,0,0,0";
    private boolean immersiveWanted = false;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
        gravity = new GravitySensor(this);
        web = new WebView(this);
        web.setBackgroundColor(0xFF121316);
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        root = new FrameLayout(this);
        root.setBackgroundColor(0xFF121316);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override public WindowInsets onApplyWindowInsets(View v, WindowInsets ins) { onInsets(ins); return ins; }
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        WebView.setWebContentsDebuggingEnabled(true);

        web.addJavascriptInterface(new Bridge(), "GyroViewNative");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!"https".equals(u.getScheme()) || !HOST.equals(u.getHost())) return null;
                return serveAsset(u.getPath(), req.getRequestHeaders());
            }
            @Override public void onPageFinished(WebView v, String url) { pushInsets(); }
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) {}
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("video/*");
                try {
                    startActivityForResult(Intent.createChooser(i, "Video"), REQ_FILE);
                } catch (Exception e) {
                    fileCb = null; cb.onReceiveValue(null); return false;
                }
                return true;
            }
        });

        rotObserver = new ContentObserver(new Handler(Looper.getMainLooper())) {
            @Override public void onChange(boolean self) {
                web.evaluateJavascript("window.gvSetAutoRotate&&gvSetAutoRotate(" + isAutoRotate() + ")", null);
            }
        };
        getContentResolver().registerContentObserver(
                Settings.System.getUriFor(Settings.System.ACCELEROMETER_ROTATION), false, rotObserver);

        if (b != null) web.restoreState(b);
        else web.loadUrl(ORIGIN + "index.html");
        immersive();
    }

    boolean isAutoRotate() {
        try { return Settings.System.getInt(getContentResolver(), Settings.System.ACCELEROMETER_ROTATION, 0) == 1; }
        catch (Exception e) { return false; }
    }

    class Bridge {
        @JavascriptInterface public boolean isAutoRotate() { return MainActivity.this.isAutoRotate(); }
        @JavascriptInterface public String insets() { return insetsCss; }
        @JavascriptInterface public void setImmersive(final boolean on) {
            runOnUiThread(new Runnable() { @Override public void run() { immersiveWanted = on; applySystemUi(); } });
        }
        @JavascriptInterface public boolean sensorStart() { return gravity.start(); }
        @JavascriptInterface public void sensorStop() { gravity.stop(); }
        @JavascriptInterface public String rv() { return gravity.read(); }
    }

    // ---------- asset server with HTTP Range (seeking in bundled sample.mp4) ----------
    private WebResourceResponse serveAsset(String path, Map<String, String> reqHeaders) {
        if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
        String rel = "www" + path;
        if (rel.contains("..")) return notFound();
        String mime = mime(path);
        Map<String, String> h = new HashMap<>();
        h.put("Access-Control-Allow-Origin", "*");
        h.put("Cache-Control", "no-cache");
        try {
            long len = -1;
            try (AssetFileDescriptor fd = getAssets().openFd(rel)) { len = fd.getLength(); } catch (IOException ignored) { /* compressed asset */ }
            String range = null;
            for (Map.Entry<String, String> e : reqHeaders.entrySet())
                if ("range".equalsIgnoreCase(e.getKey())) range = e.getValue();
            InputStream in = getAssets().open(rel);
            if (len >= 0) {
                h.put("Accept-Ranges", "bytes");
                if (range != null && range.startsWith("bytes=")) {
                    String[] r = range.substring(6).split("-", 2);
                    long start = r[0].isEmpty() ? 0 : Long.parseLong(r[0].trim());
                    long end = (r.length < 2 || r[1].trim().isEmpty()) ? len - 1 : Math.min(len - 1, Long.parseLong(r[1].trim()));
                    if (start >= len) { in.close(); return new WebResourceResponse(mime, null, 416, "Range Not Satisfiable", h, null); }
                    long skipped = 0; while (skipped < start) { long k = in.skip(start - skipped); if (k <= 0) break; skipped += k; }
                    h.put("Content-Range", "bytes " + start + "-" + end + "/" + len);
                    h.put("Content-Length", String.valueOf(end - start + 1));
                    return new WebResourceResponse(mime, null, 206, "Partial Content", h, new Limited(in, end - start + 1));
                }
                h.put("Content-Length", String.valueOf(len));
            }
            return new WebResourceResponse(mime, mime.startsWith("text/") || mime.contains("javascript") ? "utf-8" : null, 200, "OK", h, in);
        } catch (IOException e) {
            return notFound();
        }
    }
    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", new HashMap<String, String>(), null);
    }
    private static String mime(String p) {
        String l = p.toLowerCase(Locale.ROOT);
        if (l.endsWith(".html")) return "text/html";
        if (l.endsWith(".js")) return "application/javascript";
        if (l.endsWith(".css")) return "text/css";
        if (l.endsWith(".mp4") || l.endsWith(".m4v")) return "video/mp4";
        if (l.endsWith(".webm")) return "video/webm";
        if (l.endsWith(".png")) return "image/png";
        if (l.endsWith(".svg")) return "image/svg+xml";
        if (l.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }
    static final class Limited extends InputStream {
        private final InputStream in; private long left;
        Limited(InputStream in, long n) { this.in = in; this.left = n; }
        @Override public int read() throws IOException { if (left <= 0) return -1; int c = in.read(); if (c >= 0) left--; return c; }
        @Override public int read(byte[] b, int o, int n) throws IOException {
            if (left <= 0) return -1; int k = in.read(b, o, (int) Math.min(n, left)); if (k > 0) left -= k; return k; }
        @Override public void close() throws IOException { in.close(); }
    }

    // ---------- system bars: edge-to-edge always; bars visible on the start screen, hidden in the player ----------
    @SuppressWarnings("deprecation")
    private void applySystemUi() {
        boolean hide = immersiveWanted;
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
        if (root != null) root.requestApplyInsets();
    }
    private void immersive() { applySystemUi(); }
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

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_FILE) {
            if (fileCb != null) fileCb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
            fileCb = null;
            return;
        }
        super.onActivityResult(req, res, data);
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.gvBack&&gvBack())||false", new ValueCallback<String>() {
            @Override public void onReceiveValue(String v) { if (!"true".equals(v)) finish(); }
        });
    }

    @Override protected void onPause() { gravity.pause(); web.evaluateJavascript("window.gvPause&&gvPause()", null); web.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); web.onResume(); gravity.resume(); immersive();
        web.evaluateJavascript("window.gvSetAutoRotate&&gvSetAutoRotate(" + isAutoRotate() + ")", null); }
    @Override protected void onSaveInstanceState(Bundle o) { super.onSaveInstanceState(o); web.saveState(o); }
    @Override protected void onDestroy() {
        if (rotObserver != null) getContentResolver().unregisterContentObserver(rotObserver);
        gravity.stop(); web.destroy(); super.onDestroy();
    }
}
