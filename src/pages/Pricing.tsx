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
// GooglePlayPaymentProcessor removed - now using direct purchase in handlePlanPurchase
import { shouldShowAppDownload, shouldUseGooglePlay, getPlatform } from '@/utils/platformDetection';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { PremiumFeatures } from '@/components/pricing/PremiumFeatures';

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
  // Removed: showGooglePlayPayment and selectedPlanForGooglePlay - now using direct purchase
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

  const handlePlanPurchase = async (planToUse?: SubscriptionPlan) => {
    const plan = planToUse || plans.find(p => p.id === selectedPlan);
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

    // Check if we should use Google Play Billing - DIRECT purchase, no popup
    if (shouldUseGooglePlay(userCountry)) {
      console.log('🎮 Using Google Play Billing for plan:', plan.name, plan.duration_months);
      setProcessingPayment(plan.id);
      
      try {
        const { getGooglePlayProductId } = await import('@/config/googlePlayProducts');
        const { purchasePlan, isGooglePlayBillingAvailable } = await import('@/services/googlePlayBilling');
        
        // Check billing availability
        const isAvailable = await isGooglePlayBillingAvailable();
        if (!isAvailable) {
          toast({
            title: 'Google Play Not Available',
            description: 'Please install the app from Google Play Store to make purchases.',
            variant: 'destructive'
          });
          setProcessingPayment(null);
          return;
        }
        
        const productId = getGooglePlayProductId(plan.duration_months);
        console.log('🛒 Starting purchase for product:', productId);
        
        toast({
          title: 'Opening Google Play',
          description: 'Please complete payment in Google Play...',
        });
        
        const purchaseDetails = await purchasePlan(productId);
        console.log('✅ Purchase completed:', purchaseDetails);
        
        toast({
          title: 'Verifying Purchase',
          description: 'Please wait while we verify your purchase...',
        });
        
        // Verify purchase with backend
        const { data, error: verifyError } = await supabase.functions.invoke(
          'verify-google-play-purchase',
          {
            body: {
              purchaseToken: purchaseDetails.purchaseToken,
              productId: productId,
              packageName: 'com.examtrakr.app',
              planId: plan.id
            }
          }
        );

        if (verifyError || !data?.success) {
          throw new Error(data?.error || 'Failed to verify purchase');
        }

        toast({
          title: 'Success!',
          description: 'Your subscription has been activated.',
        });
        
        navigate('/profile?payment_status=success');
        
      } catch (err: any) {
        console.error('❌ Google Play purchase error:', err);
        
        if (err.message?.includes('cancelled')) {
          toast({
            title: 'Purchase Cancelled',
            description: 'You cancelled the purchase. You can try again anytime.',
            variant: 'default'
          });
        } else if (err.message?.includes('not found') || err.message?.includes('not configured')) {
          toast({
            title: 'Product Not Available',
            description: 'This subscription is being set up. Please try again later or contact support.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Purchase Failed',
            description: err.message || 'Something went wrong. Please try again.',
            variant: 'destructive'
          });
        }
      } finally {
        setProcessingPayment(null);
      }
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
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Choose Your Perfect Plan
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
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
              {/* Google Play purchases now happen directly without modal */}

              {/* Download App Banner for Non-Indian Users on Web */}
              {showDownloadBanner && (
                <div>
                  <DownloadAppBanner countryName={userCountry === 'US' ? 'United States' : 'your country'} />
                </div>
              )}

              {/* Phone Number Input - Only show for Cashfree payments */}
              {user && userCountry === 'IN' && !showDownloadBanner && (
                <div className="max-w-md mx-auto space-y-2">
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
                      // Remove non-digits and take last 10 digits (trim from front)
                      const cleaned = e.target.value.replace(/\D/g, '');
                      const value = cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
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

              {/* Pricing Plans - Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-12">
                {plans.map((plan) => {
                  const isGooglePlay = shouldUseGooglePlay(userCountry);
                  const isSelected = selectedPlan === plan.id;
                  
                  return (
                    <Card
                      key={plan.id}
                      onClick={() => !showDownloadBanner && setSelectedPlan(plan.id)}
                      className={`relative cursor-pointer transition-all duration-200 ${
                        isSelected && !showDownloadBanner
                          ? 'border-primary border-2 shadow-md'
                          : 'border-border'
                        }
                        ${!showDownloadBanner ? 'hover:shadow-md' : 'opacity-60'}
                        ${plan.is_popular ? 'shadow-sm' : ''}
                      `}
                    >
                      {/* Best Value Badge */}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!showDownloadBanner) {
                              setSelectedPlan(plan.id);
                              handlePlanPurchase(plan); // Pass plan directly to avoid race condition
                            }
                          }}
                          disabled={showDownloadBanner || processingPayment !== null}
                        >
                          {processingPayment === plan.id ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Processing...
                            </>
                          ) : isGooglePlay ? (
                            'Subscribe'
                          ) : (
                            'Choose Plan'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>


              {/* Premium Features Section */}
              <PremiumFeatures />

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
