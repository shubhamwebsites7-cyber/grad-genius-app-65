# 🚀 EXAMTRAKR PRODUCTION SETUP GUIDE

## ✅ Edge Functions - Production Ready

### 1. `create-cashfree-order` Function
**Status**: ✅ Updated for Production

**Key Configuration**:
- ✅ `CASHFREE_ENVIRONMENT`: Defaults to `"production"`
- ✅ API URL: `https://api.cashfree.com/pg/orders` (Production)
- ✅ Return URL: `https://www.examtrakr.com/profile?payment_status=success`
- ✅ Notify URL: `https://bjndsotwbzmuqwdikdaq.supabase.co/functions/v1/cashfree-webhook`

**Environment Variables Required**:
```bash
CASHFREE_APP_ID=your_production_app_id
CASHFREE_SECRET_KEY=your_production_secret_key
CASHFREE_ENVIRONMENT=production
SUPABASE_URL=https://bjndsotwbzmuqwdikdaq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. `cashfree-webhook` Function
**Status**: ✅ Updated for Production

**Key Features**:
- ✅ HMAC SHA-256 signature verification
- ✅ Production webhook processing
- ✅ Enhanced logging for production monitoring
- ✅ Proper database updates for payments and subscriptions

---

## 🗄️ Database Schema Updates

### User Sessions Table
**File**: `database/user_sessions_schema.sql`

**Features**:
- ✅ Session token management
- ✅ IP address and user agent tracking
- ✅ Automatic cleanup of expired sessions
- ✅ Row Level Security (RLS) policies
- ✅ Performance-optimized indexes

**To Deploy**:
1. Open Supabase SQL Editor
2. Run the SQL from `database/user_sessions_schema.sql`
3. Verify table creation and indexes

---

## 🔧 Deployment Checklist

### Step 1: Environment Variables
Set in Supabase Dashboard → Settings → Edge Functions:
```bash
CASHFREE_APP_ID=your_production_app_id
CASHFREE_SECRET_KEY=your_production_secret_key
CASHFREE_ENVIRONMENT=production
```

### Step 2: Deploy Edge Functions
```bash
# Deploy create-cashfree-order function
supabase functions deploy create-cashfree-order

# Deploy cashfree-webhook function
supabase functions deploy cashfree-webhook
```

### Step 3: Database Schema
```sql
-- Run the user_sessions_schema.sql in Supabase SQL Editor
-- This will create the user_sessions table with all necessary indexes and policies
```

### Step 4: Cashfree Configuration
**Webhook URL**: `https://bjndsotwbzmuqwdikdaq.supabase.co/functions/v1/cashfree-webhook`
**Events**: success payment, failed payment, user dropped payment, refund, auto refund

---

## 🎯 Production URLs

### Frontend URLs
- **Main Site**: `https://www.examtrakr.com`
- **Success Return**: `https://www.examtrakr.com/profile?payment_status=success`

### Backend URLs
- **Supabase Project**: `https://bjndsotwbzmuqwdikdaq.supabase.co`
- **Create Order**: `https://bjndsotwbzmuqwdikdaq.supabase.co/functions/v1/create-cashfree-order`
- **Webhook**: `https://bjndsotwbzmuqwdikdaq.supabase.co/functions/v1/cashfree-webhook`

### Cashfree URLs
- **Production API**: `https://api.cashfree.com/pg/orders`
- **Dashboard**: `https://merchant.cashfree.com`

---

## 🔍 Testing Production Setup

### 1. Test Order Creation
```javascript
const response = await supabase.functions.invoke('create-cashfree-order', {
  body: {
    plan_id: 'your-plan-uuid',
    phone_number: '9999999999'
  }
});
console.log('Order Response:', response.data);
```

### 2. Monitor Webhook Logs
- Check Supabase Function Logs for webhook processing
- Verify payment status updates in database
- Confirm subscription creation for successful payments

### 3. Database Verification
```sql
-- Check recent payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- Check active subscriptions
SELECT * FROM user_subscriptions WHERE status = 'active';

-- Check user sessions
SELECT * FROM user_sessions WHERE expires_at > now();
```

---

## 🚨 Production Monitoring

### Key Metrics to Monitor
1. **Payment Success Rate**: Monitor completed vs failed payments
2. **Webhook Processing**: Ensure all webhooks are processed successfully
3. **Session Management**: Monitor active user sessions
4. **Error Rates**: Track function errors and database issues

### Log Monitoring
- **Supabase Function Logs**: Monitor for errors and performance
- **Cashfree Dashboard**: Track payment analytics
- **Database Performance**: Monitor query performance and indexes

---

## 🔒 Security Considerations

### Edge Functions
- ✅ HMAC signature verification for webhooks
- ✅ User authentication for order creation
- ✅ Environment variable protection

### Database
- ✅ Row Level Security (RLS) on user_sessions
- ✅ Foreign key constraints for data integrity
- ✅ Automatic cleanup of expired sessions

### Frontend
- ✅ Secure token handling
- ✅ HTTPS-only communication
- ✅ Proper error handling and user feedback

---

## 📞 Support & Troubleshooting

### Common Issues
1. **400 Error on Order Creation**: Check environment variables and API credentials
2. **Webhook Not Processing**: Verify webhook URL in Cashfree dashboard
3. **Profile Not Showing Subscription**: Check database relationships and queries

### Debug Commands
```sql
-- Check payment records
SELECT p.*, s.status as subscription_status 
FROM payments p 
LEFT JOIN user_subscriptions s ON p.subscription_id = s.id 
WHERE p.user_id = 'user-uuid-here';

-- Check subscription details
SELECT s.*, p.name as plan_name 
FROM user_subscriptions s 
JOIN subscription_plans p ON s.plan_id = p.id 
WHERE s.user_id = 'user-uuid-here';
```

---

**🎉 Your Examtrakr payment system is now production-ready!**
