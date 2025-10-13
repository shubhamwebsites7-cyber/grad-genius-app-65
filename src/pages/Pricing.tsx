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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    fetchPricingPlans();
    if (user) {
      fetchUserPhoneNumber();
    }
  }, [user]);

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
        mode: 'production'
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
          {/* Hero Section */}
          <div className="text-center mb-12 md:mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Premium Plans</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Choose Your Perfect Plan
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock unlimited exam access and premium features to accelerate your learning journey
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
              {/* Phone Number Input */}
              {user && (
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

              {/* Pricing Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {plans.map((plan, index) => (
                  <Card 
                    key={plan.id} 
                    className={`relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fade-in ${
                      plan.is_popular 
                        ? 'border-primary shadow-lg ring-2 ring-primary/20 scale-105 lg:scale-110' 
                        : 'border-border'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {plan.is_popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-primary text-primary-foreground px-4 py-1.5 shadow-lg">
                          ⭐ Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-6 pt-8">
                      <CardTitle className="text-xl mb-3">{getDurationLabel(plan.duration_months)}</CardTitle>
                      
                      {plan.pricing ? (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="text-3xl md:text-4xl font-bold text-foreground">
                              {formatPrice(plan.pricing.price, plan.pricing.currency)}
                            </div>
                            {plan.pricing.original_price && (
                              <div className="text-sm text-muted-foreground">
                                <span className="line-through">
                                  {formatPrice(plan.pricing.original_price, plan.pricing.currency)}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {plan.pricing.discount_percentage && plan.pricing.discount_percentage > 0 && (
                            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                              Save {plan.pricing.discount_percentage}%
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Pricing not available
                        </div>
                      )}
                      
                      {plan.description && (
                        <CardDescription className="text-xs mt-3">
                          {plan.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent className="pt-0 pb-6">
                      <Button 
                        variant={plan.is_popular ? "default" : "outline"} 
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
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Features Highlight */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Premium Features Included
                  </CardTitle>
                  <CardDescription>
                    Everything you need to ace your exams
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-background/50">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Unlimited Exam Access</p>
                        <p className="text-sm text-muted-foreground">Enroll in as many exams as you want</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-background/50">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Full Topic Coverage</p>
                        <p className="text-sm text-muted-foreground">Access all topics without restrictions</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-background/50">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Resources Library</p>
                        <p className="text-sm text-muted-foreground">Download PDFs, videos, and notes</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-background/50">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Progress Tracking</p>
                        <p className="text-sm text-muted-foreground">Monitor your learning journey</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-background/50">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Priority Support</p>
                        <p className="text-sm text-muted-foreground">Get help when you need it</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-background/50">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Mobile Friendly</p>
                        <p className="text-sm text-muted-foreground">Study anywhere, anytime</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Section */}
              <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Can I change my plan later?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Yes, you can upgrade to a longer duration plan at any time. Contact support for assistance.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Is my payment secure?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Absolutely! We use Cashfree, a trusted payment gateway with bank-level security and encryption.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">We accept all major payment methods including credit/debit cards, UPI, net banking, and wallets.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Pricing;
