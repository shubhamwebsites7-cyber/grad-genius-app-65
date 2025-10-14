-- Function to complete pending payments and create subscriptions
CREATE OR REPLACE FUNCTION complete_pending_payment(payment_order_id TEXT)
RETURNS JSON AS $$
DECLARE
    payment_record RECORD;
    plan_record RECORD;
    subscription_record RECORD;
    expires_at_date TIMESTAMP WITH TIME ZONE;
    result JSON;
BEGIN
    -- Find the pending payment
    SELECT * INTO payment_record 
    FROM payments 
    WHERE external_payment_id = payment_order_id 
    AND payment_status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Payment not found or not pending',
            'order_id', payment_order_id
        );
    END IF;
    
    -- Get the subscription plan
    SELECT * INTO plan_record 
    FROM subscription_plans 
    WHERE id = payment_record.plan_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Subscription plan not found',
            'order_id', payment_order_id
        );
    END IF;
    
    -- Update payment status to completed
    UPDATE payments 
    SET payment_status = 'completed',
        updated_at = NOW()
    WHERE id = payment_record.id;
    
    -- Calculate expiration date
    expires_at_date := NOW() + INTERVAL '1 month' * plan_record.duration_months;
    
    -- Deactivate any existing active subscriptions for this user
    UPDATE user_subscriptions 
    SET status = 'expired',
        updated_at = NOW()
    WHERE user_id = payment_record.user_id 
    AND status = 'active';
    
    -- Create new subscription
    INSERT INTO user_subscriptions (
        user_id,
        plan_id,
        status,
        starts_at,
        expires_at,
        payment_method,
        external_subscription_id,
        auto_renew,
        last_payment_id,
        created_at,
        updated_at
    ) VALUES (
        payment_record.user_id,
        payment_record.plan_id,
        'active',
        NOW(),
        expires_at_date,
        'cashfree',
        payment_record.external_payment_id,
        false,
        payment_record.id,
        NOW(),
        NOW()
    ) RETURNING * INTO subscription_record;
    
    -- Update payment with subscription_id
    UPDATE payments 
    SET subscription_id = subscription_record.id,
        updated_at = NOW()
    WHERE id = payment_record.id;
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'message', 'Payment completed and subscription created',
        'order_id', payment_order_id,
        'payment_id', payment_record.id,
        'subscription_id', subscription_record.id,
        'plan_name', plan_record.name,
        'expires_at', expires_at_date
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Return error result
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'order_id', payment_order_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to complete all pending payments (use with caution)
CREATE OR REPLACE FUNCTION complete_all_pending_payments()
RETURNS JSON AS $$
DECLARE
    payment_record RECORD;
    result_array JSON[] := '{}';
    completion_result JSON;
BEGIN
    -- Loop through all pending payments
    FOR payment_record IN 
        SELECT external_payment_id 
        FROM payments 
        WHERE payment_status = 'pending'
        ORDER BY created_at ASC
    LOOP
        -- Complete each payment
        SELECT complete_pending_payment(payment_record.external_payment_id) INTO completion_result;
        result_array := array_append(result_array, completion_result);
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Processed all pending payments',
        'results', array_to_json(result_array)
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Execute the function for your specific pending payment
SELECT complete_pending_payment('examtrakr_1760460668133_c860d4e9');

-- Or to complete all pending payments at once (use carefully):
-- SELECT complete_all_pending_payments();
