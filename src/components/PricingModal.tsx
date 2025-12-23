import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Phone, Globe } from 'lucide-react';
import { usePricingPlans } from '@/hooks/usePricingPlans';
import { useAuth } from '@/hooks/useAuth';
import { isTWAApp } from '@/utils/platformDetection';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: 'enrollment' | 'topic_access';
  examName?: string;
}

export const PricingModal = ({ open, onOpenChange, trigger = 'enrollment' }: PricingModalProps) => {
  const { user } = useAuth();
  const isTWA = isTWAApp();
  const {
    loading,
    plans,
    error,
    userCountry,
    processingPayment,
    phoneNumber,
    phoneError,
    isPaymentAvailable,
    setPhoneNumber,
    handlePurchase,
    formatPrice,
    getDurationLabel,
    refetch,
  } = usePricingPlans({ autoFetch: false });

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const getModalTitle = () => {
    return trigger === 'enrollment' ? 'Upgrade to Premium' : 'Premium Feature';
  };

  const getModalDescription = () => {
    return trigger === 'enrollment'
      ? 'Free users can only enroll in 1 exam. Upgrade to premium to unlock unlimited exam access.'
      : 'This topic is available only for premium users. Upgrade now to access all topics.';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] xl:max-w-5xl max-h-[90vh] overflow-y-auto">
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
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* TWA Message */}
            {isTWA && (
              <Alert className="border-primary/30 bg-primary/5">
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  Please visit examtrakr.com in your browser to subscribe.
                </AlertDescription>
              </Alert>
            )}

            {/* Phone Input for Indian users */}
            {user && userCountry === 'IN' && isPaymentAvailable && !isTWA && (
              <div className="space-y-2 max-w-md mx-auto">
                <Label htmlFor="modal-phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="modal-phone"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={10}
                  className={`text-center text-lg ${phoneError ? 'border-destructive' : ''}`}
                />
                {phoneError && <p className="text-xs text-destructive text-center">{phoneError}</p>}
              </div>
            )}

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => {
                const isProcessing = processingPayment === plan.id;
                const isDisabled = isTWA || !isPaymentAvailable || processingPayment !== null || !plan.pricing;

                return (
                  <Card
                    key={plan.id}
                    className={`relative transition-all hover:shadow-md ${
                      plan.is_popular ? 'border-primary shadow-sm' : 'border-border'
                    } ${isDisabled ? 'opacity-60' : ''}`}
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
                        <h3 className="text-lg font-semibold">{getDurationLabel(plan.duration_months)}</h3>
                      </div>

                      {plan.pricing ? (
                        <div className="text-center space-y-1">
                          {plan.pricing.original_price && (
                            <div className="text-xs text-muted-foreground line-through">
                              {formatPrice(plan.pricing.original_price, plan.pricing.currency)}
                            </div>
                          )}
                          <div className="text-2xl font-bold">
                            {formatPrice(plan.pricing.price, plan.pricing.currency)}
                          </div>
                          {plan.pricing.discount_percentage && plan.pricing.discount_percentage > 0 && (
                            <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                              Save {plan.pricing.discount_percentage}%
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-xs text-muted-foreground">Pricing not available</div>
                      )}

                      <Button
                        variant={plan.is_popular ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => handlePurchase(plan)}
                        disabled={isDisabled}
                      >
                        {isProcessing ? (
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
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
