import { useState, useEffect, useCallback, useContext } from 'react';
import { 
  isAndroidWebView, 
  isAndroidBillingAvailable, 
  purchaseSubscription,
  getProductIdByDuration,
  PurchaseResult 
} from '@/services/androidBridge';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseAndroidBillingReturn {
  isAndroid: boolean;
  billingAvailable: boolean;
  purchasing: boolean;
  verifying: boolean;
  purchase: (durationMonths: number) => Promise<boolean>;
}

export const useAndroidBilling = (): UseAndroidBillingReturn => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;
  const [isAndroid, setIsAndroid] = useState(false);
  const [billingAvailable, setBillingAvailable] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const android = isAndroidWebView();
    setIsAndroid(android);
    
    if (android) {
      setBillingAvailable(isAndroidBillingAvailable());
    }
  }, []);

  const verifyPurchase = useCallback(async (
    purchaseToken: string,
    productId: string
  ): Promise<boolean> => {
    if (!user) return false;

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'verify-google-play-purchase',
        {
          body: {
            purchaseToken,
            productId,
            packageName: 'com.examtrakr.android',
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast.success('Subscription activated successfully!');
        return true;
      } else {
        throw new Error(data?.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Purchase verification error:', error);
      toast.error('Failed to verify purchase. Please contact support.');
      return false;
    } finally {
      setVerifying(false);
    }
  }, [user]);

  const purchase = useCallback(async (durationMonths: number): Promise<boolean> => {
    if (!user) {
      toast.error('Please login to purchase');
      return false;
    }

    if (!billingAvailable) {
      toast.error('Google Play Billing is not available');
      return false;
    }

    setPurchasing(true);
    try {
      const productId = getProductIdByDuration(durationMonths);
      const result: PurchaseResult = await purchaseSubscription(productId, user.id);

      if (result.cancelled) {
        toast.info('Purchase cancelled');
        return false;
      }

      if (!result.success) {
        toast.error(result.errorMessage || 'Purchase failed');
        return false;
      }

      // Verify the purchase with our backend
      if (result.purchaseToken && result.productId) {
        return await verifyPurchase(result.purchaseToken, result.productId);
      }

      return false;
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('An error occurred during purchase');
      return false;
    } finally {
      setPurchasing(false);
    }
  }, [user, billingAvailable, verifyPurchase]);

  return {
    isAndroid,
    billingAvailable,
    purchasing,
    verifying,
    purchase,
  };
};
