# 🚀 Examtrakr Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ **Frontend Configuration**
- [x] Cashfree SDK set to `production` mode in `PricingModal.tsx`
- [x] Debug console logs removed from production code
- [x] Build script configured for production mode
- [x] Environment files created (`.env.example`, `.env.production`)

### ✅ **Backend Configuration**
- [x] Edge function `create-cashfree-order` defaults to `production` environment
- [x] Production-ready error handling with proper status codes
- [x] Input validation and security measures implemented
- [x] Debug logging conditional on `ENVIRONMENT=development`

## 🔧 Environment Variables Setup

### **1. Vercel/Frontend Environment Variables**
Set these in your Vercel dashboard or deployment platform:

```bash
# Required for frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=production
VITE_NODE_ENV=production
```

### **2. Supabase Edge Functions Environment Variables**
Set these in Supabase Dashboard → Edge Functions → Environment Variables:

```bash
# Cashfree Production Credentials
CASHFREE_APP_ID=your_production_cashfree_app_id
CASHFREE_SECRET_KEY=your_production_cashfree_secret_key
CASHFREE_ENVIRONMENT=production

# Site Configuration
SITE_URL=https://www.examtrakr.com
WEBHOOK_URL=https://your-project.supabase.co/functions/v1/cashfree-webhook

# Environment Flag (set to 'production' to disable debug logs)
ENVIRONMENT=production
```

## 🏗️ Deployment Steps

### **Step 1: Deploy Frontend to Vercel**
```bash
# Build for production
npm run build

# Deploy to Vercel (if using Vercel CLI)
vercel --prod
```

### **Step 2: Deploy Edge Functions to Supabase**
```bash
# Deploy edge functions
supabase functions deploy create-cashfree-order
supabase functions deploy cashfree-webhook

# Verify deployment
supabase functions list
```

### **Step 3: Configure Environment Variables**

#### **Vercel Environment Variables:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the frontend environment variables listed above
3. Redeploy if necessary

#### **Supabase Environment Variables:**
1. Go to Supabase Dashboard → Edge Functions → Settings
2. Add the backend environment variables listed above
3. Restart edge functions if necessary

## 🔍 Production Verification

### **1. Payment Flow Test**
- [ ] Test payment initiation with real Cashfree credentials
- [ ] Verify payment session creation
- [ ] Test payment completion flow
- [ ] Check webhook handling

### **2. Error Handling Test**
- [ ] Test invalid payment scenarios
- [ ] Verify proper error messages are shown to users
- [ ] Check that sensitive information is not exposed

### **3. Performance Test**
- [ ] Test payment flow under load
- [ ] Verify response times are acceptable
- [ ] Check edge function timeout handling

## 🛡️ Security Checklist

### **Frontend Security**
- [x] No sensitive credentials in frontend code
- [x] API keys properly configured as environment variables
- [x] CORS properly configured
- [x] Input validation on all user inputs

### **Backend Security**
- [x] JWT verification enabled for edge functions
- [x] Input validation and sanitization
- [x] Proper error handling without information leakage
- [x] Rate limiting considerations
- [x] Secure random ID generation

## 📊 Monitoring & Logging

### **Production Monitoring**
1. **Supabase Logs**: Monitor edge function logs in Supabase Dashboard
2. **Vercel Analytics**: Monitor frontend performance and errors
3. **Cashfree Dashboard**: Monitor payment transactions and failures

### **Key Metrics to Monitor**
- Payment success rate
- Edge function response times
- Error rates and types
- User conversion rates

## 🔄 Rollback Plan

### **If Issues Occur**
1. **Frontend Issues**: Revert to previous Vercel deployment
2. **Backend Issues**: Revert edge functions using Supabase CLI
3. **Payment Issues**: Switch back to sandbox mode temporarily

### **Emergency Contacts**
- Cashfree Support: [support contact]
- Supabase Support: [support contact]
- Development Team: [team contact]

## 📝 Post-Deployment Tasks

### **Immediate (within 24 hours)**
- [ ] Monitor payment flow for any issues
- [ ] Check error logs for unexpected errors
- [ ] Verify all environment variables are working
- [ ] Test payment flow from different devices/browsers

### **Within 1 Week**
- [ ] Analyze payment conversion rates
- [ ] Review performance metrics
- [ ] Gather user feedback on payment experience
- [ ] Document any issues and resolutions

## 🚨 Troubleshooting

### **Common Issues**

#### **Payment Fails with 400 Error**
- Check Cashfree credentials are correct
- Verify `CASHFREE_ENVIRONMENT=production`
- Check edge function logs for detailed error

#### **Payment Session Not Created**
- Verify Supabase environment variables
- Check network connectivity to Cashfree API
- Validate input data format

#### **Frontend Shows "SDK Not Loaded"**
- Verify Cashfree SDK script is loaded in index.html
- Check for browser console errors
- Ensure proper CORS configuration

## 📞 Support

For deployment issues, contact:
- **Technical Lead**: [contact info]
- **DevOps Team**: [contact info]
- **Emergency Hotline**: [contact info]

---

**Last Updated**: $(date)
**Version**: 1.0
**Environment**: Production
