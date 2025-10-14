# Cashfree Webhook Setup Instructions

## Current Issue
Your payment is stuck in "pending" status because the Cashfree webhook is not properly configured or not being triggered.

## Immediate Fix

### Option 1: Run SQL Function (Recommended)
1. Go to your Supabase SQL Editor
2. Copy and paste the SQL from `complete_pending_payments.sql`
3. Execute the function:
   ```sql
   SELECT complete_pending_payment('examtrakr_1760460668133_c860d4e9');
   ```

### Option 2: Use Manual Completion Edge Function
1. Deploy the `complete-payment` edge function to Supabase
2. Call it with:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/complete-payment \
     -H "Content-Type: application/json" \
     -d '{"order_id": "examtrakr_1760460668133_c860d4e9", "admin_key": "admin123"}'
   ```

## Long-term Fix: Proper Webhook Configuration

### 1. Verify Webhook URL in Cashfree Dashboard
Your webhook URL should be:
```
https://bjndsotwbzmuqwdikdaq.supabase.co/functions/v1/cashfree-webhook
```

### 2. Configure Webhook in Cashfree Dashboard
1. Login to Cashfree Dashboard
2. Go to **Developers** > **Webhooks**
3. Add webhook URL: `https://bjndsotwbzmuqwdikdaq.supabase.co/functions/v1/cashfree-webhook`
4. Select events: `ORDER_PAID`, `PAYMENT_SUCCESS`
5. Save configuration

### 3. Environment Variables Check
Ensure these are set in Supabase Edge Functions:
```
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_ENVIRONMENT=sandbox  # or production
WEBHOOK_URL=https://bjndsotwbzmuqwdikdaq.supabase.co/functions/v1/cashfree-webhook
SUPABASE_URL=https://bjndsotwbzmuqwdikdaq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Test Webhook
1. Make a test payment
2. Check Supabase Edge Function logs
3. Verify webhook receives `ORDER_PAID` event
4. Confirm payment status updates to "completed"
5. Verify subscription is created

## Webhook Flow Verification

### Expected Flow:
1. User completes payment on Cashfree
2. Cashfree sends webhook to your endpoint
3. Webhook updates payment status to "completed"
4. Webhook creates user subscription
5. User sees premium features immediately

### Debug Steps:
1. Check Cashfree webhook logs in dashboard
2. Check Supabase Edge Function logs
3. Verify webhook signature validation
4. Test with Cashfree webhook simulator

## Database Schema Verification

Ensure your tables have proper relationships:
```sql
-- Check if payment exists
SELECT * FROM payments WHERE external_payment_id = 'examtrakr_1760460668133_c860d4e9';

-- Check if subscription was created
SELECT * FROM user_subscriptions WHERE external_subscription_id = 'examtrakr_1760460668133_c860d4e9';

-- Check user's active subscriptions
SELECT us.*, sp.name as plan_name 
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = 'd19702a3-f1a9-4953-89f4-d384a4cf296e' 
AND us.status = 'active';
```

## Troubleshooting

### Common Issues:
1. **Webhook URL not configured**: Payment stays pending
2. **Wrong environment**: Sandbox vs Production mismatch
3. **Signature verification fails**: Check secret key
4. **Missing environment variables**: Function fails silently

### Solutions:
1. Use the SQL function for immediate fix
2. Configure webhook properly for future payments
3. Test with small amounts first
4. Monitor logs for webhook calls

## Testing Checklist

- [ ] Webhook URL configured in Cashfree dashboard
- [ ] Environment variables set correctly
- [ ] Test payment completes successfully
- [ ] Payment status updates to "completed"
- [ ] User subscription is created
- [ ] User sees premium features
- [ ] Payment history shows "Completed" status
