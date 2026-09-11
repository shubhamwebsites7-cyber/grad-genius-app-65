# Android Studio - ExamTrakr Native App Development Prompt

## Project Overview

Create a native Android app using **Java** with **WebView** that loads the ExamTrakr web app (https://examtrakr.com/) and integrates **Google Play Billing** for in-app subscriptions. This is similar to Facebook Lite's approach - a lightweight native wrapper around a web application.

---

## App Configuration

```
Package Name: com.examtrakr.android
App Name: ExamTrakr
Min SDK: 24 (Android 7.0)
Target SDK: 34 (Android 14)
Compile SDK: 34
Website URL: https://examtrakr.com/
```

---

## Project Structure

```
app/
├── src/main/
│   ├── java/com/examtrakr/android/
│   │   ├── MainActivity.java          # Main activity with WebView
│   │   ├── WebAppInterface.java        # JavaScript interface bridge
│   │   ├── BillingManager.java         # Google Play Billing handler
│   │   └── NetworkUtils.java           # Network connectivity utils
│   ├── res/
│   │   ├── layout/
│   │   │   ├── activity_main.xml       # Main layout with WebView
│   │   │   └── activity_offline.xml    # Offline fallback layout
│   │   ├── values/
│   │   │   ├── strings.xml
│   │   │   ├── colors.xml
│   │   │   └── themes.xml
│   │   ├── drawable/
│   │   │   └── ic_launcher_foreground.xml
│   │   └── mipmap-*/                   # App icons
│   └── AndroidManifest.xml
├── build.gradle (app)
└── build.gradle (project)
```

---

## Step 1: build.gradle (Project Level)

```gradle
plugins {
    id 'com.android.application' version '8.2.0' apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

---

## Step 2: build.gradle (App Level)

```gradle
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.examtrakr.android'
    compileSdk 34

    defaultConfig {
        applicationId "com.examtrakr.android"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            minifyEnabled false
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'
    
    // Google Play Billing
    implementation 'com.android.billingclient:billing:6.1.0'
    
    // For JSON parsing
    implementation 'com.google.code.gson:gson:2.10.1'
    
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
}
```

---

## Step 3: AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="com.android.vending.BILLING" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.ExamTrakr"
        android:usesCleartextTraffic="false"
        android:networkSecurityConfig="@xml/network_security_config"
        tools:targetApi="31">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboard|keyboardHidden"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <!-- Deep linking -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="examtrakr.com" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

---

## Step 4: MainActivity.java

```java
package com.examtrakr.android;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class MainActivity extends AppCompatActivity {

    private static final String BASE_URL = "https://examtrakr.com/";
    private static final String ALLOWED_HOST = "examtrakr.com";
    
    private WebView webView;
    private ProgressBar progressBar;
    private SwipeRefreshLayout swipeRefreshLayout;
    private BillingManager billingManager;
    private View offlineView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        initViews();
        initBilling();
        setupWebView();
        loadWebsite();
    }

    private void initViews() {
        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        offlineView = findViewById(R.id.offlineView);

        swipeRefreshLayout.setOnRefreshListener(() -> {
            if (NetworkUtils.isNetworkAvailable(this)) {
                webView.reload();
            } else {
                showOfflineView();
                swipeRefreshLayout.setRefreshing(false);
            }
        });

        // Retry button for offline view
        View retryButton = findViewById(R.id.retryButton);
        if (retryButton != null) {
            retryButton.setOnClickListener(v -> {
                if (NetworkUtils.isNetworkAvailable(this)) {
                    hideOfflineView();
                    webView.reload();
                } else {
                    Toast.makeText(this, "No internet connection", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    private void initBilling() {
        billingManager = new BillingManager(this);
        billingManager.initialize();
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();
        
        // Enable JavaScript
        webSettings.setJavaScriptEnabled(true);
        
        // Enable DOM Storage
        webSettings.setDomStorageEnabled(true);
        
        // Enable local storage
        webSettings.setDatabaseEnabled(true);
        
        // Enable cache
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // Enable zoom
        webSettings.setSupportZoom(true);
        webSettings.setBuiltInZoomControls(true);
        webSettings.setDisplayZoomControls(false);
        
        // Viewport settings
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        
        // Mixed content mode
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        
        // User agent with app identifier
        String userAgent = webSettings.getUserAgentString();
        webSettings.setUserAgentString(userAgent + " ExamTrakr-Android/1.0 com.examtrakr.android");
        
        // Enable cookies
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);
        
        // Add JavaScript interface for native communication
        webView.addJavascriptInterface(new WebAppInterface(this, billingManager), "AndroidBridge");
        
        // WebView client
        webView.setWebViewClient(new ExamTrakrWebViewClient());
        
        // WebChrome client for progress
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                    swipeRefreshLayout.setRefreshing(false);
                }
            }
        });
    }

    private void loadWebsite() {
        if (NetworkUtils.isNetworkAvailable(this)) {
            hideOfflineView();
            
            // Check for deep link
            Intent intent = getIntent();
            Uri data = intent.getData();
            if (data != null && ALLOWED_HOST.equals(data.getHost())) {
                webView.loadUrl(data.toString());
            } else {
                webView.loadUrl(BASE_URL);
            }
        } else {
            showOfflineView();
        }
    }

    private void showOfflineView() {
        offlineView.setVisibility(View.VISIBLE);
        webView.setVisibility(View.GONE);
    }

    private void hideOfflineView() {
        offlineView.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
    }

    private class ExamTrakrWebViewClient extends WebViewClient {
        
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            String host = uri.getHost();
            
            // Allow navigation within examtrakr.com
            if (host != null && host.contains(ALLOWED_HOST)) {
                return false;
            }
            
            // Open external links in browser
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            startActivity(intent);
            return true;
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            progressBar.setVisibility(View.VISIBLE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            progressBar.setVisibility(View.GONE);
            swipeRefreshLayout.setRefreshing(false);
            
            // Inject platform detection script
            injectPlatformScript(view);
        }

        @Override
        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            super.onReceivedError(view, errorCode, description, failingUrl);
            if (!NetworkUtils.isNetworkAvailable(MainActivity.this)) {
                showOfflineView();
            }
        }
    }

    private void injectPlatformScript(WebView view) {
        String script = "javascript:(function() {" +
            "localStorage.setItem('app_source', 'native-android');" +
            "localStorage.setItem('native-app-installed', 'true');" +
            "console.log('ExamTrakr Native Android App detected');" +
            "})();";
        view.loadUrl(script);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (billingManager != null) {
            billingManager.destroy();
        }
        webView.destroy();
    }

    // Called from BillingManager when purchase completes
    public void onPurchaseComplete(String purchaseJson) {
        runOnUiThread(() -> {
            String script = "javascript:if(window.onPurchaseComplete){window.onPurchaseComplete('" + 
                escapeJsString(purchaseJson) + "');}";
            webView.loadUrl(script);
        });
    }

    public void onPurchaseError(String error) {
        runOnUiThread(() -> {
            String script = "javascript:if(window.onPurchaseError){window.onPurchaseError('" + 
                escapeJsString(error) + "');}";
            webView.loadUrl(script);
        });
    }

    public void onPurchaseCancelled() {
        runOnUiThread(() -> {
            String script = "javascript:if(window.onPurchaseCancelled){window.onPurchaseCancelled();}";
            webView.loadUrl(script);
        });
    }

    private String escapeJsString(String str) {
        return str.replace("\\", "\\\\")
                  .replace("'", "\\'")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r");
    }
}
```

---

## Step 5: WebAppInterface.java (JavaScript Bridge)

```java
package com.examtrakr.android;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import com.google.gson.Gson;

public class WebAppInterface {
    
    private final Context context;
    private final BillingManager billingManager;
    private final Gson gson;

    public WebAppInterface(Context context, BillingManager billingManager) {
        this.context = context;
        this.billingManager = billingManager;
        this.gson = new Gson();
    }

    @JavascriptInterface
    public boolean isNativeApp() {
        return true;
    }

    @JavascriptInterface
    public boolean isBillingAvailable() {
        return billingManager != null && billingManager.isBillingReady();
    }

    @JavascriptInterface
    public void purchaseSubscription(String productId) {
        if (billingManager != null) {
            billingManager.purchaseSubscription(productId);
        }
    }

    @JavascriptInterface
    public String getPurchases() {
        if (billingManager != null) {
            return billingManager.getPurchasesJson();
        }
        return "[]";
    }

    @JavascriptInterface
    public String getProductDetails(String productIdsJson) {
        if (billingManager != null) {
            return billingManager.getProductDetailsJson(productIdsJson);
        }
        return "[]";
    }

    @JavascriptInterface
    public void acknowledgePurchase(String purchaseToken) {
        if (billingManager != null) {
            billingManager.acknowledgePurchase(purchaseToken);
        }
    }

    @JavascriptInterface
    public String getAppVersion() {
        try {
            return context.getPackageManager()
                .getPackageInfo(context.getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "1.0.0";
        }
    }

    @JavascriptInterface
    public void showToast(String message) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
    }
}
```

---

## Step 6: BillingManager.java

```java
package com.examtrakr.android;

import android.app.Activity;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.android.billingclient.api.*;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BillingManager implements PurchasesUpdatedListener, BillingClientStateListener {

    private static final String TAG = "BillingManager";
    
    // Product IDs - must match Google Play Console
    private static final String[] SUBSCRIPTION_PRODUCTS = {
        "examtrakr_1month",
        "examtrakr_3month",
        "examtrakr_6month",
        "examtrakr_12month"
    };

    private final Activity activity;
    private final Gson gson;
    private BillingClient billingClient;
    private boolean isBillingReady = false;
    private Map<String, ProductDetails> productDetailsMap = new HashMap<>();
    private List<Purchase> currentPurchases = new ArrayList<>();

    public BillingManager(Activity activity) {
        this.activity = activity;
        this.gson = new Gson();
    }

    public void initialize() {
        billingClient = BillingClient.newBuilder(activity)
            .setListener(this)
            .enablePendingPurchases()
            .build();
        
        billingClient.startConnection(this);
    }

    @Override
    public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
            Log.d(TAG, "Billing setup finished successfully");
            isBillingReady = true;
            queryProductDetails();
            queryPurchases();
        } else {
            Log.e(TAG, "Billing setup failed: " + billingResult.getDebugMessage());
            isBillingReady = false;
        }
    }

    @Override
    public void onBillingServiceDisconnected() {
        Log.d(TAG, "Billing service disconnected");
        isBillingReady = false;
        // Try to reconnect
        billingClient.startConnection(this);
    }

    private void queryProductDetails() {
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        
        for (String productId : SUBSCRIPTION_PRODUCTS) {
            products.add(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.SUBS)
                .build());
        }

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(products)
            .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsList) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                for (ProductDetails details : productDetailsList) {
                    productDetailsMap.put(details.getProductId(), details);
                    Log.d(TAG, "Product loaded: " + details.getProductId());
                }
            } else {
                Log.e(TAG, "Failed to query products: " + billingResult.getDebugMessage());
            }
        });
    }

    private void queryPurchases() {
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build(),
            (billingResult, purchases) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    currentPurchases = purchases;
                    Log.d(TAG, "Found " + purchases.size() + " active purchases");
                }
            }
        );
    }

    public void purchaseSubscription(String productId) {
        if (!isBillingReady) {
            notifyError("Billing not ready. Please try again.");
            return;
        }

        ProductDetails productDetails = productDetailsMap.get(productId);
        if (productDetails == null) {
            notifyError("Product not found: " + productId);
            return;
        }

        // Get the subscription offer
        List<ProductDetails.SubscriptionOfferDetails> offers = 
            productDetails.getSubscriptionOfferDetails();
        
        if (offers == null || offers.isEmpty()) {
            notifyError("No subscription offers available");
            return;
        }

        // Use the first offer (base plan)
        ProductDetails.SubscriptionOfferDetails offer = offers.get(0);

        BillingFlowParams flowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(List.of(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(productDetails)
                    .setOfferToken(offer.getOfferToken())
                    .build()
            ))
            .build();

        BillingResult result = billingClient.launchBillingFlow(activity, flowParams);
        
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            notifyError("Failed to launch billing: " + result.getDebugMessage());
        }
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, 
                                   @Nullable List<Purchase> purchases) {
        
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK 
            && purchases != null) {
            
            for (Purchase purchase : purchases) {
                handlePurchase(purchase);
            }
            
        } else if (billingResult.getResponseCode() == 
                   BillingClient.BillingResponseCode.USER_CANCELED) {
            
            Log.d(TAG, "User cancelled purchase");
            notifyCancelled();
            
        } else {
            Log.e(TAG, "Purchase failed: " + billingResult.getDebugMessage());
            notifyError("Purchase failed: " + billingResult.getDebugMessage());
        }
    }

    private void handlePurchase(Purchase purchase) {
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
            // Verify purchase on backend (the web app will do this via edge function)
            JsonObject result = new JsonObject();
            result.addProperty("success", true);
            result.addProperty("purchaseToken", purchase.getPurchaseToken());
            result.addProperty("orderId", purchase.getOrderId());
            result.addProperty("purchaseTime", purchase.getPurchaseTime());
            
            // Get product ID
            if (!purchase.getProducts().isEmpty()) {
                result.addProperty("productId", purchase.getProducts().get(0));
            }
            
            notifySuccess(result.toString());
            
            // Acknowledge purchase if not already
            if (!purchase.isAcknowledged()) {
                acknowledgePurchase(purchase.getPurchaseToken());
            }
            
            // Update current purchases
            queryPurchases();
            
        } else if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
            Log.d(TAG, "Purchase pending");
            notifyError("Purchase is pending. Please complete payment.");
        }
    }

    public void acknowledgePurchase(String purchaseToken) {
        AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchaseToken)
            .build();

        billingClient.acknowledgePurchase(params, billingResult -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                Log.d(TAG, "Purchase acknowledged");
            } else {
                Log.e(TAG, "Failed to acknowledge: " + billingResult.getDebugMessage());
            }
        });
    }

    public boolean isBillingReady() {
        return isBillingReady;
    }

    public String getPurchasesJson() {
        JsonArray array = new JsonArray();
        for (Purchase purchase : currentPurchases) {
            JsonObject obj = new JsonObject();
            obj.addProperty("purchaseToken", purchase.getPurchaseToken());
            obj.addProperty("orderId", purchase.getOrderId());
            obj.addProperty("purchaseTime", purchase.getPurchaseTime());
            if (!purchase.getProducts().isEmpty()) {
                obj.addProperty("productId", purchase.getProducts().get(0));
            }
            obj.addProperty("success", true);
            array.add(obj);
        }
        return array.toString();
    }

    public String getProductDetailsJson(String productIdsJson) {
        JsonArray array = new JsonArray();
        try {
            String[] productIds = gson.fromJson(productIdsJson, String[].class);
            for (String productId : productIds) {
                ProductDetails details = productDetailsMap.get(productId);
                if (details != null && details.getSubscriptionOfferDetails() != null) {
                    ProductDetails.SubscriptionOfferDetails offer = 
                        details.getSubscriptionOfferDetails().get(0);
                    ProductDetails.PricingPhase phase = 
                        offer.getPricingPhases().getPricingPhaseList().get(0);
                    
                    JsonObject obj = new JsonObject();
                    obj.addProperty("productId", details.getProductId());
                    obj.addProperty("title", details.getTitle());
                    obj.addProperty("description", details.getDescription());
                    obj.addProperty("price", phase.getFormattedPrice());
                    obj.addProperty("priceCurrencyCode", phase.getPriceCurrencyCode());
                    obj.addProperty("priceAmountMicros", phase.getPriceAmountMicros());
                    array.add(obj);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing product IDs: " + e.getMessage());
        }
        return array.toString();
    }

    private void notifySuccess(String purchaseJson) {
        if (activity instanceof MainActivity) {
            ((MainActivity) activity).onPurchaseComplete(purchaseJson);
        }
    }

    private void notifyError(String error) {
        if (activity instanceof MainActivity) {
            ((MainActivity) activity).onPurchaseError(error);
        }
    }

    private void notifyCancelled() {
        if (activity instanceof MainActivity) {
            ((MainActivity) activity).onPurchaseCancelled();
        }
    }

    public void destroy() {
        if (billingClient != null) {
            billingClient.endConnection();
        }
    }
}
```

---

## Step 7: NetworkUtils.java

```java
package com.examtrakr.android;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;

public class NetworkUtils {

    public static boolean isNetworkAvailable(Context context) {
        ConnectivityManager cm = (ConnectivityManager) 
            context.getSystemService(Context.CONNECTIVITY_SERVICE);
        
        if (cm == null) return false;
        
        Network network = cm.getActiveNetwork();
        if (network == null) return false;
        
        NetworkCapabilities capabilities = cm.getNetworkCapabilities(network);
        return capabilities != null && (
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
        );
    }
}
```

---

## Step 8: activity_main.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/background">

    <ProgressBar
        android:id="@+id/progressBar"
        style="@style/Widget.AppCompat.ProgressBar.Horizontal"
        android:layout_width="match_parent"
        android:layout_height="4dp"
        android:visibility="gone"
        android:indeterminate="false"
        android:progress="0"
        android:progressTint="@color/primary"
        app:layout_constraintTop_toTopOf="parent" />

    <androidx.swiperefreshlayout.widget.SwipeRefreshLayout
        android:id="@+id/swipeRefreshLayout"
        android:layout_width="0dp"
        android:layout_height="0dp"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@id/progressBar">

        <WebView
            android:id="@+id/webView"
            android:layout_width="match_parent"
            android:layout_height="match_parent" />

    </androidx.swiperefreshlayout.widget.SwipeRefreshLayout>

    <!-- Offline View -->
    <LinearLayout
        android:id="@+id/offlineView"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:orientation="vertical"
        android:gravity="center"
        android:padding="32dp"
        android:visibility="gone"
        android:background="@color/background">

        <ImageView
            android:layout_width="120dp"
            android:layout_height="120dp"
            android:src="@drawable/ic_offline"
            android:contentDescription="@string/offline" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="24dp"
            android:text="@string/no_internet"
            android:textSize="20sp"
            android:textColor="@color/text_primary"
            android:textStyle="bold" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            android:text="@string/check_connection"
            android:textSize="14sp"
            android:textColor="@color/text_secondary"
            android:gravity="center" />

        <com.google.android.material.button.MaterialButton
            android:id="@+id/retryButton"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="24dp"
            android:text="@string/retry"
            android:paddingHorizontal="32dp" />

    </LinearLayout>

</androidx.constraintlayout.widget.ConstraintLayout>
```

---

## Step 9: res/values/strings.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">ExamTrakr</string>
    <string name="offline">Offline</string>
    <string name="no_internet">No Internet Connection</string>
    <string name="check_connection">Please check your internet connection and try again.</string>
    <string name="retry">Retry</string>
</resources>
```

---

## Step 10: res/values/colors.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">#6366F1</color>
    <color name="primary_dark">#4F46E5</color>
    <color name="accent">#8B5CF6</color>
    <color name="background">#FFFFFF</color>
    <color name="text_primary">#1F2937</color>
    <color name="text_secondary">#6B7280</color>
</resources>
```

---

## Step 11: res/values/themes.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.ExamTrakr" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/primary</item>
        <item name="colorPrimaryDark">@color/primary_dark</item>
        <item name="colorAccent">@color/accent</item>
        <item name="android:windowBackground">@color/background</item>
        <item name="android:statusBarColor">@color/primary</item>
        <item name="android:navigationBarColor">@color/background</item>
    </style>
</resources>
```

---

## Step 12: res/xml/network_security_config.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">examtrakr.com</domain>
    </domain-config>
</network-security-config>
```

---

## Google Play Console Setup

### 1. Create Subscription Products
Create these subscriptions in Google Play Console → Monetize → Products → Subscriptions:

| Product ID | Name | Duration |
|------------|------|----------|
| `examtrakr_1month` | ExamTrakr Premium - 1 Month | 1 month |
| `examtrakr_3month` | ExamTrakr Premium - 3 Months | 3 months |
| `examtrakr_6month` | ExamTrakr Premium - 6 Months | 6 months |
| `examtrakr_12month` | ExamTrakr Premium - 12 Months | 12 months |

### 2. License Testing
Add test accounts in:
Google Play Console → Setup → License testing → Add email addresses

### 3. Internal Testing Track
Upload the app to Internal testing track first for testing.

---

## Testing Checklist

- [ ] App loads https://examtrakr.com/ correctly
- [ ] JavaScript bridge is accessible via `window.AndroidBridge`
- [ ] `AndroidBridge.isNativeApp()` returns `true`
- [ ] `AndroidBridge.isBillingAvailable()` returns `true` when billing is ready
- [ ] Pull-to-refresh works
- [ ] Back button navigates within WebView
- [ ] External links open in browser
- [ ] Offline view shows when no internet
- [ ] Purchase flow completes successfully
- [ ] Purchase callback is received in WebView

---

## Signing Configuration

For release builds, add signing config in `build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('keystore/examtrakr.jks')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'examtrakr'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## ProGuard Rules (proguard-rules.pro)

```proguard
# Keep JavaScript interface
-keepclassmembers class com.examtrakr.android.WebAppInterface {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Billing classes
-keep class com.android.vending.billing.**

# Gson
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
```

---

## Next Steps After Setup

1. Generate signed APK/AAB for testing
2. Upload to Internal Testing track
3. Add license testers
4. Test purchase flow end-to-end
5. Submit for review when ready

---

## Support

For web app integration issues, check:
- Browser console for JavaScript errors
- Android Logcat with tag "BillingManager" or "ExamTrakr"
- Network tab for API calls to verify-google-play-purchase
