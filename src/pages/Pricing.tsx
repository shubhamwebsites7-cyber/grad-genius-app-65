import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

// Helper function to get country flag emoji
const getCountryFlag = (countryCode: string): string => {
  const flagMap: { [key: string]: string } = {
    'US': '🇺🇸',
    'GB': '🇬🇧',
    'UK': '🇬🇧',
    'DE': '🇩🇪',
    'FR': '🇫🇷',
    'IT': '🇮🇹',
    'ES': '🇪🇸',
    'CA': '🇨🇦',
    'AU': '🇦🇺',
    'JP': '🇯🇵',
    'KR': '🇰🇷',
    'CN': '🇨🇳',
    'BR': '🇧🇷',
    'MX': '🇲🇽',
    'SG': '🇸🇬',
    'AE': '🇦🇪',
    'SA': '🇸🇦',
    'ZA': '🇿🇦',
    'NG': '🇳🇬',
    'EG': '🇪🇬',
    'IN': '🇮🇳'
  };
  return flagMap[countryCode] || '🌍';
};

// Helper function to get country name
const getCountryName = (countryCode: string): string => {
  const countryMap: { [key: string]: string } = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'UK': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'CA': 'Canada',
    'AU': 'Australia',
    'JP': 'Japan',
    'KR': 'South Korea',
    'CN': 'China',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'SG': 'Singapore',
    'AE': 'UAE',
    'SA': 'Saudi Arabia',
    'ZA': 'South Africa',
    'NG': 'Nigeria',
    'EG': 'Egypt',
    'IN': 'India'
  };
  return countryMap[countryCode] || 'International';
};

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
  const [userCountry, setUserCountry] = useState<string>('IN');
  const [loading, setLoading] = useState<boolean>(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Detect user location and fetch pricing
  useEffect(() => {
    const initializePricing = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get location from IP
        let detectedCountry = 'IN'; // Default to India
        try {
          const response = await fetch('https://ipapi.co/json/');
          const data = await response.json();
          if (data.country_code) {
            detectedCountry = data.country_code.toUpperCase();
          }
        } catch (error) {
          console.log('Using default country (India)');
        }
        
        setUserCountry(detectedCountry);

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

        // Fetch pricing for user's country
        const planIds = plansData.map((p: any) => p.id);
        const { data: pricingData, error: pricingError } = await supabase
          .from('plan_pricing')
          .select('*')
          .in('plan_id', planIds)
          .eq('country_code', detectedCountry)
          .eq('is_active', true);

        if (pricingError) throw pricingError;

        // If no pricing for user's country, try fallback to US
        let finalPricing = pricingData;
        if (!pricingData || pricingData.length === 0) {
          const { data: fallbackPricing, error: fallbackError } = await supabase
            .from('plan_pricing')
            .select('*')
            .in('plan_id', planIds)
            .eq('country_code', 'US')
            .eq('is_active', true);

          if (!fallbackError && fallbackPricing && fallbackPricing.length > 0) {
            finalPricing = fallbackPricing;
            setUserCountry('US');
          }
        }

        // Combine plans with their pricing
        const plansWithPricing: SubscriptionPlan[] = plansData.map((plan: any) => {
          const pricing = finalPricing?.find((p: any) => p.plan_id === plan.id);
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

    initializePricing();
  }, []);

  // Format price with currency symbol
  const formatPrice = (price: number, currency: string): string => {
    const currencySymbols: { [key: string]: string } = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'AUD': 'A$',
      'CAD': 'C$',
    };

    const symbol = currencySymbols[currency] || currency + ' ';
    return `${symbol}${price.toFixed(2)}`;
  };

  // Get duration label
  const getDurationLabel = (months: number): string => {
    if (months === 1) return '1 Month';
    if (months === 3) return '3 Months';
    if (months === 6) return '6 Months';
    if (months === 12) return '12 Months';
    return `${months} Months`;
  };

  const features = [
    {
      title: 'Unlimited Exam Access',
      description: 'Unlock all exams (IBPS, NEET, JEE, + Custom Exams) without restrictions.',
      isCore: false
    },
    {
      title: 'Full Subject & Topic Coverage',
      description: 'Access detailed breakdowns of every subject and topic with structured study material.',
      isCore: false
    },
    {
      title: 'Resources Library (Exclusive)',
      description: 'Get full access to curated notes, practice questions, and learning resources for each exam section.',
      isCore: true
    },
    {
      title: 'Progress Tracking & Analytics',
      description: 'Smart dashboard with exam-wise and subject-wise progress, visualized via graphs & reports.',
      isCore: true
    },
    {
      title: 'Custom Exam Creation',
      description: 'Add your own exams, subjects, and topics with optional marks for personalized tracking.',
      isCore: true
    },
    {
      title: 'Ad-Free Experience',
      description: 'Study without distractions in a clean, fast, and focused interface.',
      isCore: false
    },
    {
      title: 'Priority Support',
      description: 'Early access to new features + priority help via chat or email.',
      isCore: false
    },
    {
      title: 'Multi-Device Sync',
      description: 'Continue learning seamlessly across mobile, tablet, and laptop with synced progress.',
      isCore: false
    }
  ];

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Pricing - Examtrakr</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading pricing plans...</p>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Exam Preparation Pricing Plans – Affordable for Students | Examtrakr</title>
        <meta 
          name="description" 
          content="Choose from free and premium exam preparation plans on Examtrakr. Get unlimited exam tracking, advanced analytics, and AI-powered insights for IBPS, NEET, JEE & more." 
        />
        <link rel="canonical" href="/pricing" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Pricing - Examtrakr" />
        <meta property="og:description" content="Affordable exam tracking plans for students" />
        <meta property="og:type" content="website" />
        <meta 
          name="description" 
          content="Choose from flexible monthly, quarterly, half-yearly, or yearly plans for IBPS, NEET, JEE, and more. Affordable pricing for India and US/UK students." 
        />
        <meta 
          name="keywords" 
          content="exam preparation pricing, affordable study plans, IBPS pricing, NEET study cost, JEE preparation plans, student pricing" 
        />
        <link rel="canonical" href="/pricing" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        <main className="flex-1 pt-4 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                Affordable Pricing for{' '}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Every Student
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                One plan, all features included. Choose the duration that works best for you.
              </p>

              {/* Location-based Currency Display */}
              <div className="w-fit mx-auto">
                <div className="bg-muted/50 px-6 py-3 rounded-lg border">
                  <div className="flex items-center space-x-2 text-foreground font-medium">
                    <span className="text-lg">{getCountryFlag(userCountry)} {getCountryName(userCountry)}</span>
                    <span className="text-muted-foreground">({plans[0]?.pricing?.currency || 'USD'})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Pricing Cards */}
            {plans.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`relative ${
                      plan.is_popular 
                        ? 'border-primary shadow-lg ring-2 ring-primary/20 scale-105' 
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
                      <CardTitle className="text-xl mb-2">{getDurationLabel(plan.duration_months)}</CardTitle>
                      
                      {plan.pricing ? (
                        <div className="space-y-2">
                          <div className="text-3xl font-bold text-foreground">
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
                        className="w-full mb-4"
                        asChild
                        disabled={!plan.pricing}
                      >
                        <Link to="/signup">
                          Choose Plan
                        </Link>
                      </Button>
                      
                      {plan.description && (
                        <div className="text-center text-xs text-muted-foreground">
                          {plan.description}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Features Section */}
            <Card className="mb-16">
              <CardHeader>
                <CardTitle className="text-center text-2xl">🌟 Premium Features for Paid Users</CardTitle>
                <CardDescription className="text-center">
                  Every plan includes all these powerful features to help you succeed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {features.map((feature, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start space-x-3 p-4 rounded-lg ${
                        feature.isCore 
                          ? 'bg-primary/5 border border-primary/20' 
                          : 'bg-muted/30'
                      }`}
                    >
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-1" />
                      <div className="space-y-1">
                        <div className={`font-semibold ${feature.isCore ? 'text-primary' : 'text-foreground'}`}>
                          {feature.title}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>


            {/* CTA Section */}
            <Card className="bg-gradient-to-r from-primary via-primary-hover to-secondary">
              <CardContent className="p-8 text-center">
                <h2 className="text-3xl font-bold text-primary-foreground mb-4">
                  Start your preparation journey today!
                </h2>
                <p className="text-xl text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
                  Join thousands of successful students who have achieved their goals with our comprehensive exam preparation platform.
                </p>
                <Button variant="secondary" size="xl" asChild>
                  <Link to="/signup">
                    Get Started → Sign Up
                  </Link>
                </Button>
                <p className="text-sm text-primary-foreground/70 mt-4">
                  No hidden fees • Cancel anytime • 7-day money-back guarantee
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Pricing;