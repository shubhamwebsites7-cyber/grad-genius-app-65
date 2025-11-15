import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, AlertCircle, Loader2, Phone, Sparkles } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { DownloadAppBanner } from '@/components/DownloadAppBanner';
import { GooglePlayPaymentProcessor } from '@/components/payment/GooglePlayPaymentProcessor';
import { shouldShowAppDownload, shouldUseGooglePlay, getPlatform } from '@/utils/platformDetection';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';

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

interface PricingOffer {
  id: string;
  offer_end_time: string;
  is_active: boolean;
}

const Pricing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>('IN');
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [offer, setOffer] = useState<PricingOffer | null>(null);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [showGooglePlayPayment, setShowGooglePlayPayment] = useState(false);
  const [selectedPlanForGooglePlay, setSelectedPlanForGooglePlay] = useState<SubscriptionPlan | null>(null);
  const [platform, setPlatform] = useState<string>('web');
  const [showDownloadBanner, setShowDownloadBanner] = useState(false);

  useEffect(() => {
    fetchPricingPlans();
    fetchActiveOffer();
    if (user) {
      fetchUserPhoneNumber();
    }
    
    // Detect platform
    const currentPlatform = getPlatform();
    setPlatform(currentPlatform);
    console.log('🔍 Platform detected:', currentPlatform);
  }, [user]);
  
  useEffect(() => {
    // Check if we should show download banner for non-Indian users
    if (userCountry !== 'IN' && platform === 'web') {
      setShowDownloadBanner(true);
    } else {
      setShowDownloadBanner(false);
    }
  }, [userCountry, platform]);

  useEffect(() => {
    if (!offer) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const endTime = new Date(offer.offer_end_time).getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [offer]);

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
          setPhoneNumber(userData.phone_number as string);
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
      
      // Auto-select popular plan
      const popularPlan = plansWithPricing.find(p => p.is_popular);
      if (popularPlan) {
        setSelectedPlan(popularPlan.id);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching pricing:', err);
      setError(err.message || 'Failed to load pricing information');
      setLoading(false);
    }
  };

  const fetchActiveOffer = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_offers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setOffer(data as unknown as PricingOffer);
      }
    } catch (error) {
      console.error('Error fetching offer:', error);
    }
  };

  const handlePlanPurchase = async () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) {
      toast({
        title: 'Error',
        description: 'Please select a plan.',
        variant: 'destructive'
      });
      return;
    }
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to purchase a plan.',
        variant: 'destructive'
      });
      navigate('/login');
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

    // Check if we should use Google Play Billing
    if (shouldUseGooglePlay(userCountry)) {
      console.log('🎮 Using Google Play Billing');
      setSelectedPlanForGooglePlay(plan);
      setShowGooglePlayPayment(true);
      return;
    }

    // Check if user should download app (non-Indian on web)
    if (shouldShowAppDownload(userCountry)) {
      toast({
        title: 'Download Required',
        description: 'Please download our app from Play Store to subscribe.',
        variant: 'default'
      });
      return;
    }

    // Validate phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }
    setPhoneError('');

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
          currency: plan.pricing.currency,
          phone_number: cleanPhone
        }
      });

      console.log('Payment order response:', { data, error });
      console.log('Full response data:', JSON.stringify(data, null, 2));

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to create payment order');
      }

      if (!data) {
        throw new Error('No response from payment service');
      }

      // Check for both success flag and error message
      if (data.success === false || data.error) {
        console.error('Payment order creation failed:', data);
        throw new Error(data.error || 'Failed to create payment order');
      }

      if (!data.payment_session_id || !data.order_id) {
        console.error('Missing payment session data:', data);
        throw new Error('Invalid payment session data received. Please try again.');
      }

      console.log('Initializing Cashfree checkout with session:', data.payment_session_id);

      // Initialize Cashfree based on backend environment to prevent session mismatch
      const cashfreeMode = data.environment === 'sandbox' ? 'sandbox' : 'production';
      console.log('Initializing Cashfree in mode:', cashfreeMode);
      
      const cashfree = await (window as any).Cashfree({
        mode: cashfreeMode
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

  return (
    <>
      <Helmet>
        <title>Pricing Plans - ExamTrakr</title>
        <meta name="description" content="Choose the perfect plan for your exam preparation journey. Affordable pricing with premium features." />
        <meta name="keywords" content="exam preparation pricing, study plans, premium features" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        <Navigation />
        
        <main className="flex-1 container mx-auto px-4 py-12 md:py-20">
          {/* Hero Section with Timer */}
          <div className="text-center mb-12 md:mb-16 space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold">
              Choose Your Perfect Plan
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Select the plan that works best for you
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Loading pricing plans...</p>
              </div>
            </div>
          ) : error ? (
            <div className="max-w-2xl mx-auto">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-12">
              {/* Google Play Payment Modal */}
              {showGooglePlayPayment && selectedPlanForGooglePlay && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="max-w-md w-full">
                    <GooglePlayPaymentProcessor
                      planId={selectedPlanForGooglePlay.id}
                      planName={selectedPlanForGooglePlay.name}
                      durationMonths={selectedPlanForGooglePlay.duration_months}
                      onSuccess={() => {
                        setShowGooglePlayPayment(false);
                        navigate('/profile?payment_status=success');
                      }}
                      onFailure={() => {
                        setShowGooglePlayPayment(false);
                      }}
                      onCancel={() => {
                        setShowGooglePlayPayment(false);
                        setSelectedPlanForGooglePlay(null);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Download App Banner for Non-Indian Users on Web */}
              {showDownloadBanner && (
                <div className="animate-fade-in">
                  <DownloadAppBanner countryName={userCountry === 'US' ? 'United States' : 'your country'} />
                </div>
              )}

              {/* Phone Number Input - Only show for Cashfree payments */}
              {user && userCountry === 'IN' && !showDownloadBanner && (
                <div className="max-w-md mx-auto space-y-2 animate-fade-in">
                  <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number (Required for payment)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhoneNumber(value);
                      if (phoneError) setPhoneError('');
                    }}
                    className={phoneError ? 'border-destructive' : ''}
                    maxLength={10}
                  />
                  {phoneError && (
                    <p className="text-sm text-destructive">{phoneError}</p>
                  )}
                  {phoneNumber ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Check className="h-3 w-3 text-success" />
                      Using saved number from your profile
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      This number will be used for payment verification and order updates
                    </p>
                  )}
                </div>
              )}

              {/* Pricing Cards - Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto mb-12">
                {plans.map((plan, index) => {
                  const isGooglePlay = shouldUseGooglePlay(userCountry);
                  const showPricing = !showDownloadBanner;
                  const isSelected = selectedPlan === plan.id;
                  
                  return (
                  <div key={plan.id}>
                    <Card
                      onClick={() => showPricing && setSelectedPlan(plan.id)}
                      className={`relative cursor-pointer h-full
                        ${isSelected && showPricing
                          ? 'border-primary border-2'
                          : 'border-border'
                        }
                        ${!showPricing ? 'opacity-60' : ''}
                        ${plan.is_popular ? 'ring-2 ring-primary/20' : ''}
                      `}
                    >
                      {/* Best Value Badge */}
                      {plan.is_popular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                          <Badge className="bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold pointer-events-none">
                            ⭐ Best Value
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="text-center space-y-4 pb-6 pt-8">
                        {/* Plan Name with Selection Indicator */}
                        <CardTitle className="text-2xl font-extrabold text-foreground flex items-center justify-center gap-3">
                          <span>{getDurationLabel(plan.duration_months)}</span>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected 
                              ? 'border-primary bg-primary' 
                              : 'border-muted-foreground'
                          }`}>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-primary-foreground" />
                            )}
                          </div>
                        </CardTitle>

                        {/* Discount Badge */}
                        {plan.pricing?.discount_percentage && (
                          <div className="flex justify-center">
                            <Badge variant="secondary" className="bg-success/10 text-success pointer-events-none">
                              Save {plan.pricing.discount_percentage}%
                            </Badge>
                          </div>
                        )}

                        {/* Pricing Display */}
                        {plan.pricing ? (
                          <div className="space-y-2 pt-2">
                            {plan.pricing.original_price && (
                              <div className="text-base text-muted-foreground line-through">
                                {formatPrice(plan.pricing.original_price, plan.pricing.currency)}
                              </div>
                            )}
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-4xl md:text-5xl font-black text-foreground">
                                {formatPrice(plan.pricing.price, plan.pricing.currency)}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">
                              {plan.duration_months === 1 
                                ? 'per month - Quick access for short-term exam prep' 
                                : plan.duration_months === 3
                                  ? 'for 3 months - Ideal for focused exam preparation'
                                  : plan.duration_months === 6
                                    ? 'for 6 months - Extended study period for thorough preparation'
                                    : plan.duration_months === 12
                                      ? 'per year - Best value for long-term learning'
                                      : `for ${plan.duration_months} months`
                              }
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Contact Us</div>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-6 pt-4">
                        {/* Activate Plan Button */}
                        {showPricing && plan.pricing && (
                          <Button 
                            size="lg" 
                            className="w-full font-semibold"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlan(plan.id);
                              handlePlanPurchase();
                            }}
                            disabled={processingPayment !== null}
                          >
                            {processingPayment === plan.id ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              'Activate Plan'
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  );
                })}
              </div>

              {/* FAQ Section */}
              <PricingFAQ />
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Pricing;
