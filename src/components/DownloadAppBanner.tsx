import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Download, Shield, Zap, CreditCard, Globe } from 'lucide-react';

interface DownloadAppBannerProps {
  countryName?: string;
}

export const DownloadAppBanner = ({ countryName = 'your country' }: DownloadAppBannerProps) => {
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.examtrakr.app';
  
  const handleDownloadClick = () => {
    window.open(playStoreUrl, '_blank');
  };

  return (
    <Card className="border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-xl">
      <CardContent className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/70 p-4 rounded-2xl shadow-lg">
                <Smartphone className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
          </div>
          
          <Badge className="mb-2 bg-gradient-to-r from-primary to-primary/80">
            <Globe className="h-3 w-3 mr-1" />
            International Payments
          </Badge>
          
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Download Our App to Subscribe
          </h2>
          
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            For users from {countryName}, subscriptions are available exclusively through our Google Play Store app with secure international payment options.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-background/80 border border-border/50">
            <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Secure Payments</p>
              <p className="text-xs text-muted-foreground">Google Play protected transactions</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 rounded-lg bg-background/80 border border-border/50">
            <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Multiple Payment Options</p>
              <p className="text-xs text-muted-foreground">Cards, PayPal, and more</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 rounded-lg bg-background/80 border border-border/50">
            <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Instant Activation</p>
              <p className="text-xs text-muted-foreground">Access premium features immediately</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col items-center gap-3">
          <Button 
            size="lg" 
            onClick={handleDownloadClick}
            className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all duration-300 gap-2 text-base px-8 py-6"
          >
            <Download className="h-5 w-5" />
            Download from Play Store
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Free to download • Available worldwide • Secure payments via Google Play
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50">
          <p className="text-sm text-muted-foreground text-center">
            <strong className="text-foreground">Note:</strong> For Indian users, you can continue using Cashfree payments directly on this website. International payments require the Play Store app for security and compliance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};