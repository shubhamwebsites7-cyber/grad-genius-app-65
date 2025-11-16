# ExamTrakr - Play Store Deployment & Google Play Billing Guide

## ✅ Current Payment Setup Status

### Payment Systems Configured:
1. **Cashfree Payment** - For Indian users (INR) on web/PWA
2. **Google Play Billing** - For international users via Play Store app
3. **Platform Detection** - Automatic routing based on user location and platform

### Files Verified:
- ✅ `src/config/googlePlayProducts.ts` - Product IDs configured
- ✅ `src/services/googlePlayBilling.ts` - Digital Goods API integration
- ✅ `src/components/payment/GooglePlayPaymentProcessor.tsx` - Payment UI
- ✅ `supabase/functions/verify-google-play-purchase/index.ts` - Backend verification
- ✅ `public/manifest.json` - PWA configuration
- ✅ `public/sw.js` - Service Worker for offline support

---

## 📱 Step-by-Step: Upload PWA to Google Play Store

### Phase 1: Prepare Your PWA for Play Store

#### Step 1: Update App Configuration
1. Ensure `public/manifest.json` has correct details:
   ```json
   {
     "name": "ExamTrakr – Track Your Exam Progress & Study Smarter",
     "short_name": "ExamTrakr",
     "start_url": "/",
     "display": "standalone",
     "theme_color": "#0066ff",
     "background_color": "#ffffff"
   }
   ```

#### Step 2: Generate Signed APK Assets
You need:
- App icons (192x192 and 512x512) ✅ Already configured
- Screenshots for Play Store listing
- Feature graphic (1024x500)
- App description and metadata

---

### Phase 2: Build and Test PWA

#### Step 1: Deploy Your Web App
1. Click **Publish** button in Lovable
2. Ensure your app is live at: `https://yourdomain.com` or Lovable URL
3. Test PWA features:
   - Install from browser works
   - Service worker caching works
   - Offline mode works

#### Step 2: Verify PWA Requirements
Test checklist:
- [ ] HTTPS enabled (required)
- [ ] Valid manifest.json
- [ ] Service worker registered
- [ ] Icons properly sized
- [ ] Installable on mobile

---

### Phase 3: Use PWA Builder to Create APK

#### Step 1: Go to PWA Builder
1. Visit: **https://www.pwabuilder.com/**
2. Enter your PWA URL (e.g., `https://e5097fde-228b-4739-a063-17cb746d1133.lovableproject.com`)
3. Click "Start" to analyze your PWA

#### Step 2: Configure Android Package
1. After analysis, click **"Package for Stores"**
2. Select **"Android"** option
3. Configure settings:
   - **Package ID**: `com.examtrakr.app`
   - **App Name**: `ExamTrakr`
   - **Display Mode**: `standalone`
   - **Host**: Your deployed URL
   - **Version**: `1.0.0`
   - **Version Code**: `1`

#### Step 3: Configure Advanced Settings
In PWA Builder Android options:
```json
{
  "packageId": "com.examtrakr.app",
  "name": "ExamTrakr",
  "launcherName": "ExamTrakr",
  "display": "standalone",
  "themeColor": "#0066ff",
  "backgroundColor": "#ffffff",
  "enableNotifications": true,
  "enableBilling": true,
  "playBilling": {
    "enabled": true
  }
}
```

**CRITICAL**: Enable `enableBilling: true` for Google Play Billing support!

#### Step 4: Generate Signing Key
1. PWA Builder will generate a signing key
2. **Download and save securely**:
   - `keystore.jks` (signing key)
   - Passwords and key alias
3. You'll need this for all future updates

#### Step 5: Download APK/AAB
1. Download the **Android App Bundle (.aab)** file
2. This is what you'll upload to Play Store
3. Also download signing key info

---

### Phase 4: Google Play Console Setup

#### Step 1: Create Play Console Account
1. Go to: **https://play.google.com/console**
2. Pay one-time $25 registration fee
3. Complete account verification

#### Step 2: Create New App
1. Click **"Create app"**
2. Fill in details:
   - **App name**: ExamTrakr
   - **Default language**: English (US)
   - **App or game**: App
   - **Free or paid**: Free
3. Accept declarations and create app

#### Step 3: Complete Store Listing
Navigate to **"Store presence" → "Main store listing"**

Required information:
- **App name**: ExamTrakr
- **Short description** (80 chars max):
  ```
  Track exam progress, access study resources, and prepare smarter for your exams
  ```
- **Full description** (4000 chars max):
  ```
  ExamTrakr is your complete exam preparation companion. Track your study progress across multiple subjects, access high-quality study resources, and stay on top of your exam prep with our smart tracking system.

  KEY FEATURES:
  ✓ Subject-wise progress tracking
  ✓ Comprehensive study resources
  ✓ Progress visualization and analytics
  ✓ Exam deadline management
  ✓ Offline access to resources
  ✓ Premium content and features

  PERFECT FOR:
  - Students preparing for competitive exams
  - Anyone tracking multi-subject exam preparation
  - Users who want organized study materials
  - Learners who need progress monitoring

  SUBSCRIPTION PLANS:
  Choose from flexible plans (1, 3, 6, or 12 months) with premium features including unlimited exam tracking, exclusive resources, and advanced analytics.
  ```

- **App icon**: Upload 512x512 icon (already have: `public/icon-512.png`)
- **Feature graphic**: 1024x500 px (create this)
- **Screenshots**: At least 2 phone screenshots (750x1334 or similar)
- **Category**: Education
- **Contact details**: Your support email
- **Privacy policy URL**: Your privacy policy URL

#### Step 4: Upload Your App Bundle
1. Go to **"Release" → "Production"**
2. Click **"Create new release"**
3. Upload your `.aab` file from PWA Builder
4. Fill in:
   - **Release name**: `1.0.0`
   - **Release notes**: 
     ```
     Initial release of ExamTrakr
     - Track exam preparation progress
     - Access study resources
     - Multiple subscription plans
     ```

#### Step 5: Content Rating
1. Go to **"Policy" → "App content"**
2. Complete questionnaire for ESRB/PEGI ratings
3. For education app, answer honestly about content
4. Save and apply ratings

#### Step 6: Target Audience
1. Set **Target age group**: All ages (or specific)
2. Declare if app is designed for children
3. Complete ads declaration

#### Step 7: Data Safety
1. Go to **"Policy" → "Data safety"**
2. Declare what data you collect:
   - User account info (email)
   - Usage data
   - Payment info (handled by Google)
3. Explain data usage and security

---

## 💰 Google Play Billing - Subscription Setup

### Phase 5: Configure In-App Products

#### Step 1: Enable Billing in Play Console
1. Go to **"Monetize" → "Subscriptions"**
2. Click **"Create subscription"**

#### Step 2: Create Subscription Plans

Create 4 subscription products matching your app:

**Product 1: Monthly Pro**
- **Product ID**: `examtrakr_1month`
- **Name**: Monthly Pro
- **Description**: Premium access for 1 month with 3-day free trial
- **Billing period**: 1 month
- **Free trial**: 3 days
- **Base plans**:
  - **India (INR)**: ₹149/month
  - **United States (USD)**: $2.99/month
  - **Other countries (USD)**: $2.99/month

**Product 2: Quarterly Pro**
- **Product ID**: `examtrakr_3month`
- **Name**: Quarterly Pro
- **Description**: Premium access for 3 months with 3-day free trial
- **Billing period**: 3 months
- **Free trial**: 3 days
- **Base plans**:
  - **India (INR)**: ₹399/3 months (₹133/month)
  - **United States (USD)**: $7.99/3 months ($2.66/month)
  - **Other countries (USD)**: $7.99/3 months

**Product 3: Half-Yearly Pro**
- **Product ID**: `examtrakr_6month`
- **Name**: Half-Yearly Pro
- **Description**: Premium access for 6 months with 3-day free trial
- **Billing period**: 6 months
- **Free trial**: 3 days
- **Base plans**:
  - **India (INR)**: ₹699/6 months (₹116/month)
  - **United States (USD)**: $13.99/6 months ($2.33/month)
  - **Other countries (USD)**: $13.99/6 months

**Product 4: Yearly Pro**
- **Product ID**: `examtrakr_12month`
- **Name**: Yearly Pro
- **Description**: Premium access for 12 months with 3-day free trial - Best Value!
- **Billing period**: 12 months
- **Free trial**: 3 days
- **Base plans**:
  - **India (INR)**: ₹1,199/year (₹100/month)
  - **United States (USD)**: $24.99/year ($2.08/month)
  - **Other countries (USD)**: $24.99/year

#### Step 3: Configure Country-Specific Pricing
For each subscription, add pricing for major markets:

**High-price countries (USD equivalent)**:
- USA, UK, Canada, Australia: $2.99-$24.99 range
- Germany, France, Japan: €2.99-€24.99 / ¥450-¥3,900
- UAE, Saudi Arabia: AED 10-100

**Lower-price countries**:
- India: ₹149-₹1,199 (30-50% cheaper than USD)
- Brazil: R$9.99-R$79.99
- Mexico: MXN$49-MXN$399
- Indonesia: Rp44,000-Rp349,000

**Google Play Console Pricing Tool**:
Use the auto-conversion tool but adjust for purchasing power:
1. Set base price in USD
2. Click "Auto-fill prices"
3. Manually adjust India and other emerging markets lower
4. Review and save

#### Step 4: Activate Subscriptions
1. Review all 4 products
2. Click **"Activate"** for each
3. Wait for Google approval (usually instant)

---

### Phase 6: Configure App for Google Play Billing

#### Required Secret Configuration

You need to add Google Play Service Account credentials:

**Step 1: Create Service Account**
1. Go to Google Cloud Console: https://console.cloud.google.com
2. Create new project or select existing
3. Enable **Google Play Android Developer API**
4. Go to **IAM & Admin → Service Accounts**
5. Create service account:
   - Name: `examtrakr-play-billing`
   - Role: **Service Account User**
6. Create key (JSON format)
7. Download the JSON file

**Step 2: Link Service Account to Play Console**
1. In Play Console, go to **Settings → API access**
2. Link the Google Cloud project
3. Grant access to the service account
4. Set permissions: **View financial data**, **Manage orders**

**Step 3: Add Secret to Lovable Cloud**

The service account JSON needs to be added as a secret in your Lovable Cloud backend.

⚠️ **IMPORTANT**: I need to add this secret for you. Let me do that now.

---

## 🔐 Backend Configuration

### Google Play Service Account Secret

Your backend already has the edge function `verify-google-play-purchase` which handles:
- Purchase token verification
- Subscription activation
- Duplicate purchase prevention

**What you need**:
1. Download the Google Play Service Account JSON file (from steps above)
2. I'll help you add it as a secret

Let me add the secret configuration tool now...

---

## 📊 Integration Verification Checklist

### Frontend Integration ✅
- [x] Google Play product IDs configured
- [x] Digital Goods API service integration
- [x] Payment processor component
- [x] Platform detection logic
- [x] Country-based routing

### Backend Integration ✅
- [x] Edge function for purchase verification
- [x] Database tables for payments
- [x] Subscription activation logic
- [ ] Google Play Service Account secret (you need to add this)

### PWA Configuration ✅
- [x] Manifest.json with proper metadata
- [x] Service worker for offline support
- [x] App icons (192x192, 512x512)
- [x] Splash screens configured

---

## 🚀 Final Launch Checklist

### Before Submitting to Play Store:
- [ ] Deploy final version to production URL
- [ ] Test PWA installation
- [ ] Verify all 4 subscription products created in Play Console
- [ ] Add Google Play Service Account secret to backend
- [ ] Test purchase flow in Play Store (internal test track)
- [ ] Prepare marketing materials (screenshots, graphics)
- [ ] Write store listing copy
- [ ] Set up privacy policy URL

### Play Store Submission:
- [ ] Upload signed AAB file
- [ ] Complete store listing
- [ ] Set content rating
- [ ] Configure data safety
- [ ] Submit for review (takes 1-7 days)

### After Approval:
- [ ] Test live in Play Store
- [ ] Monitor crash reports in Play Console
- [ ] Set up Android vitals monitoring
- [ ] Track subscription analytics

---

## 📞 Need Help?

**PWA Builder Issues**: https://github.com/pwa-builder/PWABuilder/issues
**Play Console Help**: https://support.google.com/googleplay/android-developer
**Google Play Billing Docs**: https://developer.android.com/google/play/billing

---

## 💡 Pro Tips

1. **Test on Internal Track First**: Create an internal test track in Play Console to test purchases before going live
2. **Subscription Testing**: Use Google Play's test accounts to test subscription flows without real charges
3. **Price Optimization**: Monitor conversion rates and adjust prices per country after launch
4. **Update Frequency**: Keep your PWA updated; Play Store users automatically get updates
5. **Marketing**: Promote both web version (for India) and Play Store version (international)

---

## 🎯 Next Steps

1. I'll add the Google Play Service Account secret configuration
2. You'll create the service account in Google Cloud
3. Configure the 4 subscription products in Play Console
4. Use PWA Builder to generate your APK
5. Submit to Play Store

Ready to proceed with the secret configuration?
