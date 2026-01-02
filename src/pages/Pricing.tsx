import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, AlertCircle, Loader2, Phone, Globe, ExternalLink } from 'lucide-react';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { PremiumFeatures } from '@/components/pricing/PremiumFeatures';
import { usePricingPlans } from '@/hooks/usePricingPlans';
import { useAuth } from '@/hooks/useAuth';
import { isTWAApp } from '@/utils/platformDetection';

const Pricing = () => {
  const { user } = useAuth();
  const {
    loading,
    plans,
    error,
    userCountry,
    processingPayment,
    phoneNumber,
    phoneError,
    selectedPlanId,
    isPaymentAvailable,
    setSelectedPlanId,
    setPhoneNumber,
    handlePurchase,
    formatPrice,
    getDurationLabel,
  } = usePricingPlans();

  // Check if running in TWA (Play Store app)
  const isTWA = isTWAApp();

  return (
    <>
      <Helmet>
        <title>Pricing Plans - ExamTrakr</title>
        <meta name="description" content="Choose the perfect plan for your exam preparation journey. Affordable pricing with premium features." />
        <meta name="keywords" content="exam preparation pricing, study plans, premium features" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        <Navigation />
        
        <main className="flex-1 container mx-auto px-4 py-12 md:py-20 pb-24 md:pb-12">
          {/* Hero Section */}
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
              {/* TWA App Message - Direct to website for payment */}
              {isTWA && (
                <div className="max-w-2xl mx-auto">
                  <Alert className="border-primary/30 bg-primary/5">
                    <Globe className="h-5 w-5 text-primary" />
                    <AlertDescription className="text-base">
                      <strong>Subscribe on our website</strong>
                      <p className="mt-2 text-muted-foreground">
                        To subscribe, please visit examtrakr.com in your browser. 
                        Your subscription will automatically sync with this app.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => window.open('https://examtrakr.com/pricing', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Website
                      </Button>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Non-Indian Users Message */}
              {!isTWA && !isPaymentAvailable && userCountry !== 'IN' && (
                <div className="max-w-2xl mx-auto">
                  <Alert className="border-amber-500/30 bg-amber-500/5">
                    <Globe className="h-5 w-5 text-amber-500" />
                    <AlertDescription className="text-base">
                      <strong>International Payments Coming Soon</strong>
                      <p className="mt-2 text-muted-foreground">
                        We're currently accepting payments only from India. 
                        International payment support will be available soon.
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Phone Number Input - Only for Indian users on web (not TWA) */}
              {user && userCountry === 'IN' && isPaymentAvailable && !isTWA && (
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
                    onChange={(e) => setPhoneNumber(e.target.value)}
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
                      This number will be used for payment verification
                    </p>
                  )}
                </div>
              )}

              {/* Pricing Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const isProcessing = processingPayment === plan.id;
                  const isDisabled = isTWA || !isPaymentAvailable || processingPayment !== null || !plan.pricing;

                  return (
                    <Card
                      key={plan.id}
                      onClick={() => !isDisabled && setSelectedPlanId(plan.id)}
                      className={`relative transition-all duration-200 ${
                        isSelected && !isDisabled
                          ? 'border-primary border-2 shadow-md'
                          : 'border-border hover:shadow-md'
                      } ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${
                        plan.is_popular ? 'shadow-sm' : ''
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
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-foreground">
                            {getDurationLabel(plan.duration_months)}
                          </h3>
                        </div>

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

                        <Button
                          variant={plan.is_popular ? 'default' : 'outline'}
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isDisabled) {
                              setSelectedPlanId(plan.id);
                              handlePurchase(plan);
                            }
                          }}
                          disabled={isDisabled}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Processing...
                            </>
                          ) : isTWA ? (
                            'Subscribe on Website'
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
