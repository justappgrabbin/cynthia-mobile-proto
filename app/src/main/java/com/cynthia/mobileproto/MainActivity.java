package com.cynthia.mobileproto;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import androidx.webkit.WebViewAssetLoader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public final class MainActivity extends Activity {
    private static final int PICK_FILE = 711;
    private static final int SAVE_FILE = 712;
    private WebView web;
    private ValueCallback<Uri[]> upload;
    private String pendingExport;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setBackgroundColor(0xff0a0d1a);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(true);
        web.getSettings().setAllowContentAccess(true);
        web.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        web.getSettings().setSupportMultipleWindows(false);
        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !request.getUrl().toString().startsWith("https://appassets.androidplatform.net/assets/");
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (upload != null) upload.onReceiveValue(null);
                upload = callback;
                try { startActivityForResult(params.createIntent(), PICK_FILE); return true; }
                catch (Exception e) { upload.onReceiveValue(null); upload=null; return false; }
            }
        });
        // Minimal bridge: can only open the Android Save Document picker, never execute shell commands.
        web.addJavascriptInterface(new Object() {
            @JavascriptInterface public void saveDocument(String filename, String content) {
                if (content == null || content.length() > 4_000_000) return;
                runOnUiThread(() -> {
                    pendingExport = content;
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType(filename.endsWith(".json") ? "application/json" : "text/html");
                    intent.putExtra(Intent.EXTRA_TITLE, filename.replaceAll("[^a-zA-Z0-9._-]", "-"));
                    startActivityForResult(intent, SAVE_FILE);
                });
            }
        }, "CynthiaNative");
        setContentView(web);
        web.loadUrl("https://appassets.androidplatform.net/assets/index.html");
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == PICK_FILE && upload != null) {
            Uri[] value = result == RESULT_OK ? WebChromeClient.FileChooserParams.parseResult(result, data) : null;
            upload.onReceiveValue(value); upload = null;
        } else if (request == SAVE_FILE) {
            if (result == RESULT_OK && data != null && data.getData() != null && pendingExport != null) {
                try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                    if (out != null) out.write(pendingExport.getBytes(StandardCharsets.UTF_8));
                } catch (Exception ignored) { }
            }
            pendingExport = null;
        }
    }
    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        if (web != null) { web.removeJavascriptInterface("CynthiaNative"); web.destroy(); }
        super.onDestroy();
    }
}
