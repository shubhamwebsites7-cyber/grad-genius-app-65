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
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>('IN');
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchPricingPlans();
    }
  }, [open]);

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
        console.log('Using default country (India)');
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
      console.error('Error fetching pricing:', err);
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

    if (!plan.pricing) {
      toast({
        title: 'Error',
        description: 'Pricing information not available for this plan.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setProcessingPayment(plan.id);

      // Check if Cashfree SDK is loaded
      if (!(window as any).Cashfree) {
        throw new Error('Payment system not loaded. Please refresh the page.');
      }

      console.log('Creating payment order for plan:', plan.id);

      // Create payment session via edge function
      const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
        body: {
          plan_id: plan.id,
          pricing_id: plan.pricing.id,
          amount: plan.pricing.price,
          currency: plan.pricing.currency
        }
      });

      console.log('Payment order response:', { data, error });

      if (error) {
        throw new Error(error.message || 'Failed to create payment order');
      }

      if (!data) {
        throw new Error('No response from payment service');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.payment_session_id || !data.order_id) {
        throw new Error('Invalid payment session data received');
      }

      console.log('Initializing Cashfree checkout with session:', data.payment_session_id);

      // Initialize Cashfree
      const cashfree = await (window as any).Cashfree({
        mode: 'production' // Use 'sandbox' for testing
      });

      // Open checkout
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_self',
        returnUrl: `${window.location.origin}/profile?payment_status=success`
      };

      console.log('Opening Cashfree checkout with options:', checkoutOptions);

      await cashfree.checkout(checkoutOptions);

    } catch (err: any) {
      console.error('Error in payment flow:', err);
      
      let errorMessage = 'Failed to initiate payment. Please try again.';
      
      if (err.message.includes('not loaded')) {
        errorMessage = 'Payment system loading. Please refresh and try again.';
      } else if (err.message.includes('not configured')) {
        errorMessage = 'Payment system is being set up. Please contact support.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast({
        title: 'Payment Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{getModalTitle()}</DialogTitle>
          <DialogDescription className="text-base">
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
            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`relative ${
                    plan.is_popular 
                      ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                      : 'border-border'
                  }`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-lg mb-2">{getDurationLabel(plan.duration_months)}</CardTitle>
                    
                    {plan.pricing ? (
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-foreground">
                          {formatPrice(plan.pricing.price, plan.pricing.currency)}
                        </div>
                        
                        {plan.pricing.original_price && (
                          <div className="text-sm text-muted-foreground">
                            <span className="line-through">
                              {formatPrice(plan.pricing.original_price, plan.pricing.currency)}
                            </span>
                          </div>
                        )}
                        
                        {plan.pricing.discount_percentage && plan.pricing.discount_percentage > 0 && (
                          <Badge variant="secondary" className="bg-success/10 text-success">
                            {plan.pricing.discount_percentage}% OFF
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Pricing not available
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    <Button 
                      variant={plan.is_popular ? "hero" : "outline"} 
                      size="lg" 
                      className="w-full"
                      onClick={() => handlePlanPurchase(plan)}
                      disabled={!plan.pricing || processingPayment === plan.id}
                    >
                      {processingPayment === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Choose Plan'
                      )}
                    </Button>
                    
                    {plan.description && (
                      <div className="text-center text-xs text-muted-foreground mt-2">
                        {plan.description}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Features Highlight */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">✨ Premium Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0 mt-1" />
                    <span className="text-sm">Unlimited Exam Access</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0 mt-1" />
                    <span className="text-sm">Full Topic Coverage</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0 mt-1" />
                    <span className="text-sm">Resources Library</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0 mt-1" />
                    <span className="text-sm">Priority Support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
