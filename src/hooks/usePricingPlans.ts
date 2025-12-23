import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getPlatform, shouldUseCashfree, type Platform } from '@/utils/platformDetection';

// Types
export interface PlanPricing {
  id: string;
  plan_id: string;
  country_code: string;
  currency: string;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  is_active: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  duration_months: number;
  features: string[] | null;
  is_popular: boolean;
  is_active: boolean;
  google_product_id: string | null;
  pricing?: PlanPricing;
}

export interface PricingOffer {
  id: string;
  offer_end_time: string;
  is_active: boolean;
}

export interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
}

interface UsePricingPlansOptions {
  autoFetch?: boolean;
}

export const usePricingPlans = (options: UsePricingPlansOptions = { autoFetch: true }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>('IN');
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [offer, setOffer] = useState<PricingOffer | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ hours: 0, minutes: 0, seconds: 0 });
  const [platform, setPlatform] = useState<Platform>('web');

  // Derived state - Cashfree only for Indian users
  const canUseCashfree = shouldUseCashfree(userCountry);
  const isPaymentAvailable = canUseCashfree;
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || null;

  // Detect platform on mount
  useEffect(() => {
    const currentPlatform = getPlatform();
    setPlatform(currentPlatform);
    console.log('🔍 Platform detected:', currentPlatform);
  }, []);

  // Offer countdown timer
  useEffect(() => {
    if (!offer) return;

    const calculateTimeRemaining = () => {
      const now = Date.now();
      const endTime = new Date(offer.offer_end_time).getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeRemaining({
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [offer]);

  // Fetch user phone number
  const fetchUserPhoneNumber = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('phone_number')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data && (data as any).phone_number) {
        const cleanPhone = ((data as any).phone_number as string).replace(/\D/g, '');
        setPhoneNumber(cleanPhone.slice(-10));
      }
    } catch (err) {
      console.error('Error fetching phone number:', err);
    }
  }, [user]);

  // Fetch pricing plans
  const fetchPricingPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Detect user country
      let detectedCountry = 'IN';
      try {
        const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
        const data = await response.json();
        if (data.country_code) {
          detectedCountry = data.country_code.toUpperCase();
        }
      } catch {
        console.log('Using default country (India)');
      }

      const targetCountry = detectedCountry === 'IN' ? 'IN' : 'US';
      setUserCountry(targetCountry);

      // Fetch subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('id, name, description, duration_months, features, is_popular, is_active, google_product_id')
        .eq('is_active', true)
        .order('duration_months');

      if (plansError) throw plansError;

      if (!plansData?.length) {
        setError('No pricing plans available at the moment.');
        return;
      }

      // Fetch pricing for target country
      const planIds = (plansData as any[]).map((p: any) => p.id);
      const { data: pricingData, error: pricingError } = await supabase
        .from('plan_pricing')
        .select('*')
        .in('plan_id', planIds)
        .eq('country_code', targetCountry)
        .eq('is_active', true);

      if (pricingError) throw pricingError;

      // Combine plans with pricing
      const plansWithPricing: SubscriptionPlan[] = (plansData as any[]).map((plan: any) => ({
        ...plan,
        pricing: (pricingData as any[])?.find((p: any) => p.plan_id === plan.id),
      }));

      setPlans(plansWithPricing);

      // Auto-select popular plan
      const popularPlan = plansWithPricing.find(p => p.is_popular);
      if (popularPlan) {
        setSelectedPlanId(popularPlan.id);
      }
    } catch (err: any) {
      console.error('Error fetching pricing:', err);
      setError(err.message || 'Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch active offer
  const fetchActiveOffer = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_offers')
        .select('id, offer_end_time, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setOffer(data as PricingOffer);
      }
    } catch (err) {
      console.error('Error fetching offer:', err);
    }
  }, []);

  // Handle Cashfree purchase
  const handleCashfreePurchase = async (plan: SubscriptionPlan) => {
    // Validate phone
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return false;
    }
    setPhoneError('');

    if (!plan.pricing) {
      toast({ title: 'Error', description: 'Pricing information not available.', variant: 'destructive' });
      return false;
    }

    setProcessingPayment(plan.id);

    try {
      if (!(window as any).Cashfree) {
        throw new Error('Payment system not loaded. Please refresh the page.');
      }

      const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
        body: {
          plan_id: plan.id,
          pricing_id: plan.pricing.id,
          amount: plan.pricing.price,
          currency: plan.pricing.currency,
          phone_number: cleanPhone,
        },
      });

      if (error || data?.success === false) {
        throw new Error(data?.error || error?.message || 'Failed to create payment order');
      }

      if (!data?.payment_session_id || !data?.order_id) {
        throw new Error('Invalid payment session data received.');
      }

      const cashfreeMode = data.environment === 'sandbox' ? 'sandbox' : 'production';
      const cashfree = await (window as any).Cashfree({ mode: cashfreeMode });

      await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_self',
        returnUrl: `${window.location.origin}/profile?payment_status=success`,
      });

      return true;
    } catch (err: any) {
      console.error('Error in Cashfree payment:', err);
      toast({
        title: 'Payment Failed',
        description: err.message || 'Failed to initiate payment. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setProcessingPayment(null);
    }
  };

  // Main purchase handler
  const handlePurchase = async (plan?: SubscriptionPlan) => {
    const targetPlan = plan || selectedPlan;

    if (!targetPlan) {
      toast({ title: 'Error', description: 'Please select a plan.', variant: 'destructive' });
      return;
    }

    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to purchase a plan.', variant: 'destructive' });
      navigate('/login');
      return;
    }

    if (!isPaymentAvailable) {
      toast({
        title: 'Payment Not Available',
        description: 'Payments are currently only available for users in India.',
        variant: 'destructive',
      });
      return;
    }

    await handleCashfreePurchase(targetPlan);
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (options.autoFetch) {
      fetchPricingPlans();
      fetchActiveOffer();
    }
  }, [options.autoFetch, fetchPricingPlans, fetchActiveOffer]);

  // Fetch phone when user changes
  useEffect(() => {
    if (user) {
      fetchUserPhoneNumber();
    }
  }, [user, fetchUserPhoneNumber]);

  // Utilities
  const formatPrice = (price: number, currency: string): string => {
    const symbols: Record<string, string> = { INR: '₹', USD: '$' };
    return `${symbols[currency] || currency + ' '}${price.toFixed(2)}`;
  };

  const getDurationLabel = (months: number): string => {
    const labels: Record<number, string> = { 1: '1 Month', 3: '3 Months', 6: '6 Months', 12: '12 Months' };
    return labels[months] || `${months} Months`;
  };

  const setPhoneNumberWithValidation = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const digits = cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
    setPhoneNumber(digits);
    if (phoneError) setPhoneError('');
  };

  return {
    // State
    loading,
    plans,
    error,
    userCountry,
    processingPayment,
    phoneNumber,
    phoneError,
    selectedPlanId,
    selectedPlan,
    offer,
    timeRemaining,
    platform,
    // Derived
    isGooglePlay: false, // Always false - Google Play disabled
    showDownloadBanner: false, // Disabled
    isPaymentAvailable,
    // Actions
    setSelectedPlanId,
    setPhoneNumber: setPhoneNumberWithValidation,
    handlePurchase,
    refetch: fetchPricingPlans,
    // Utils
    formatPrice,
    getDurationLabel,
  };
};
