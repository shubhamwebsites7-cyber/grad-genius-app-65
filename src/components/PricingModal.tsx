import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, AlertCircle, Loader2, Sparkles, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePlatform } from '@/hooks/usePlatform';
import { getGooglePlayProductId } from '@/config/googlePlayProducts';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    Cashfree: any;
  }
}

interface PlanPricing {
  id: string;
  plan_id: string;
  country_code: string;
  currency: string;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  is_active: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  duration_months: number;
  features: any;
  is_popular: boolean;
  is_active: boolean;
  pricing?: PlanPricing;
}

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: 'enrollment' | 'topic_access';
  examName?: string;
}

export const PricingModal = ({ open, onOpenChange, trigger = 'enrollment', examName }: PricingModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>('IN');
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  // Platform detection
  const { isNativeAndroid, isBillingAvailable, purchaseSubscription } = usePlatform(userCountry);

  useEffect(() => {
    if (open) {
      fetchPricingPlans();
      if (user) {
        fetchUserPhoneNumber();
      }
    }
  }, [open, user]);

  const fetchUserPhoneNumber = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('phone_number')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!error && data) {
        const userData = data as Record<string, any>;
        if (userData.phone_number) {
          // Extract only digits and take last 10 digits (trim from front)
          const cleanPhone = (userData.phone_number as string).replace(/\D/g, '');
          const last10Digits = cleanPhone.slice(-10);
          setPhoneNumber(last10Digits);
        }
      }
    } catch (error) {
      console.error('Error fetching phone number:', error);
    }
  };

  const fetchPricingPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      // Detect user location
      let detectedCountry = 'IN';
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code) {
          detectedCountry = data.country_code.toUpperCase();
        }
      } catch (error) {
        // Use default country (India) if geolocation fails
      }
      
      const targetCountry = detectedCountry === 'IN' ? 'IN' : 'US';
      setUserCountry(targetCountry);

      // Fetch subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('duration_months');

      if (plansError) throw plansError;

      if (!plansData || plansData.length === 0) {
        setError('No pricing plans available at the moment.');
        setLoading(false);
        return;
      }

      // Fetch pricing for target country
      const planIds = plansData.map((p: any) => p.id);
      const { data: pricingData, error: pricingError } = await supabase
        .from('plan_pricing')
        .select('*')
        .in('plan_id', planIds)
        .eq('country_code', targetCountry)
        .eq('is_active', true);

      if (pricingError) throw pricingError;

      // Combine plans with their pricing
      const plansWithPricing: SubscriptionPlan[] = plansData.map((plan: any) => {
        const pricing = pricingData?.find((p: any) => p.plan_id === plan.id);
        return {
          ...plan,
          pricing
        } as SubscriptionPlan;
      });

      setPlans(plansWithPricing);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load pricing information');
      setLoading(false);
    }
  };

  const handlePlanPurchase = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to purchase a plan.',
        variant: 'destructive'
      });
      return;
    }

    // ============ NATIVE ANDROID GOOGLE PLAY BILLING ============
    if (isNativeAndroid && isBillingAvailable) {
      console.log('📱 Using Native Android Google Play Billing in Modal');
      
      try {
        setProcessingPayment(plan.id);
        
        const googleProductId = getGooglePlayProductId(plan.duration_months);
        console.log('Google Play Product ID:', googleProductId);
        
        const success = await purchaseSubscription(plan.id, googleProductId);
        
        if (success) {
          onOpenChange(false);
          setTimeout(() => {
            navigate('/profile?payment_status=success');
          }, 1500);
        }
      } catch (error) {
        console.error('Native purchase error:', error);
        toast({
          title: 'Purchase Failed',
          description: error instanceof Error ? error.message : 'Failed to complete purchase',
          variant: 'destructive'
        });
      } finally {
        setProcessingPayment(null);
      }
      return;
    }

    // ============ WEB CASHFREE PAYMENT ============
    if (!phoneNumber || phoneNumber.length !== 10) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter a valid 10-digit phone number.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setProcessingPayment(plan.id);

      // Format phone to E.164 based on detected country
      const digits = phoneNumber.replace(/\D/g, '');
      const countryCode = userCountry === 'US' ? '+1' : '+91';
      const e164Phone = `${countryCode}${digits}`;

      // Create order via edge function
      const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
        body: {
          plan_id: plan.id,
          pricing_id: plan.pricing?.id,
          phone_number: e164Phone,
        }
      });

      if (error) {
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Validate payment session ID
      if (!data?.payment_session_id) {
        throw new Error('Payment session ID not received from server');
      }

      // Initialize Cashfree SDK
      if (!window.Cashfree) {
        throw new Error('Cashfree SDK not loaded. Please refresh the page and try again.');
      }

      const cashfree = await window.Cashfree({
        mode: 'production'
      });

      // Open payment modal
      await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        returnUrl: `${window.location.origin}/profile?payment=success`,
      });

      toast({
        title: 'Payment Initiated',
        description: 'Complete your payment in the Cashfree window.',
      });

    } catch (err: any) {
      let errorMessage = 'Failed to initiate payment. Please try again.';
      
      if (err.message?.includes('payment_session_id')) {
        errorMessage = 'Payment session expired. Please try again.';
      } else if (err.message?.includes('Cashfree SDK')) {
        errorMessage = 'Payment system not loaded. Please refresh the page and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast({
        title: 'Payment Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  const formatPrice = (price: number, currency: string): string => {
    const currencySymbols: { [key: string]: string } = {
      'INR': '₹',
      'USD': '$'
    };
    const symbol = currencySymbols[currency] || currency + ' ';
    return `${symbol}${price.toFixed(2)}`;
  };

  const getDurationLabel = (months: number): string => {
    if (months === 1) return '1 Month';
    if (months === 3) return '3 Months';
    if (months === 6) return '6 Months';
    if (months === 12) return '12 Months';
    return `${months} Months`;
  };

  const getModalTitle = () => {
    if (trigger === 'enrollment') {
      return 'Upgrade to Premium';
    }
    return 'Premium Feature';
  };

  const getModalDescription = () => {
    if (trigger === 'enrollment') {
      return 'Free users can only enroll in 1 exam. Upgrade to premium to unlock unlimited exam access and all features.';
    }
    return 'This topic is available only for premium users. Upgrade now to access all topics and features.';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] xl:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription className="text-sm md:text-base text-muted-foreground">
            {getModalDescription()}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading pricing plans...</p>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Native Android Indicator */}
            {isNativeAndroid && (
              <div className="mb-4">
                <Alert className="bg-primary/10 border-primary/20">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-primary font-medium">
                    Pay securely with Google Play
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Phone Number Input - Only show for Cashfree payments (NOT in native Android) */}
            {user && !isNativeAndroid && (
              <div className="space-y-2 mb-6 max-w-md mx-auto">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    const digits = cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
                    setPhoneNumber(digits);
                  }}
                  maxLength={10}
                  className="text-center text-lg tracking-wide"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Please enter a valid 10-digit phone number
                </p>
              </div>
            )}

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all duration-200 hover:shadow-md ${
                    plan.is_popular 
                      ? 'border-primary shadow-sm' 
                      : 'border-border'
                  }`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground px-2 py-0.5 text-xs">
                        Best Value
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-4 pt-6 space-y-4">
                    {/* Duration */}
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground">
                        {getDurationLabel(plan.duration_months)}
                      </h3>
                    </div>
                    
                    {/* Pricing */}
                    {plan.pricing ? (
                      <div className="text-center space-y-1">
                        {plan.pricing.original_price && (
                          <div className="text-xs text-muted-foreground line-through">
                            {formatPrice(plan.pricing.original_price, plan.pricing.currency)}
                          </div>
                        )}
                        <div className="text-2xl font-bold text-foreground">
                          {formatPrice(plan.pricing.price, plan.pricing.currency)}
                        </div>
                        {plan.pricing.discount_percentage && plan.pricing.discount_percentage > 0 && (
                          <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                            Save {plan.pricing.discount_percentage}%
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-xs text-muted-foreground">
                        Pricing not available
                      </div>
                    )}
                    
                    {/* Button */}
                    <Button 
                      variant={plan.is_popular ? "default" : "outline"} 
                      size="sm"
                      className="w-full"
                      onClick={() => handlePlanPurchase(plan)}
                      disabled={!plan.pricing || processingPayment === plan.id}
                    >
                      {processingPayment === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Choose Plan'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
