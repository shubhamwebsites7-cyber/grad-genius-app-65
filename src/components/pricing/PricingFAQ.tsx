import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';

export const PricingFAQ = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground text-lg">
          Everything you need to know about our plans
        </p>
      </div>
      
      <div className="space-y-4">
        <Collapsible className="group border-2 rounded-xl bg-card overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-md">
          <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <h3 className="text-lg font-bold text-left group-hover:text-primary transition-colors">
              What do I get with the 3-day free trial?
            </h3>
            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-300 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-6 pb-6 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <p className="text-muted-foreground leading-relaxed">
              During your 3-day free trial, you get complete access to all premium features - unlimited exam access, all topics unlocked, full resources library, and progress tracking. No credit card required to start!
            </p>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="group border-2 rounded-xl bg-card overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-md">
          <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <h3 className="text-lg font-bold text-left group-hover:text-primary transition-colors">
              What benefits do I get with a paid plan?
            </h3>
            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-300 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-6 pb-6 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <p className="text-muted-foreground leading-relaxed">
              Paid plans unlock unlimited exam access, all topics, complete resources library (PDFs, videos, notes), detailed progress tracking, priority support, and mobile-friendly access. Study without any restrictions!
            </p>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="group border-2 rounded-xl bg-card overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-md">
          <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <h3 className="text-lg font-bold text-left group-hover:text-primary transition-colors">
              How does billing work after the trial?
            </h3>
            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-300 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-6 pb-6 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <p className="text-muted-foreground leading-relaxed">
              After your 3-day free trial, you'll be charged for your selected plan duration (1, 3, 6, or 12 months). The billing is automatic and you can cancel anytime before renewal. You'll receive reminders before any charges.
            </p>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="group border-2 rounded-xl bg-card overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-md">
          <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <h3 className="text-lg font-bold text-left group-hover:text-primary transition-colors">
              Can I switch or upgrade my plan later?
            </h3>
            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-300 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-6 pb-6 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <p className="text-muted-foreground leading-relaxed">
              Absolutely! You can upgrade to a longer duration plan anytime. Your new plan's duration will be added to your existing subscription, giving you more continuous access at a better value.
            </p>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="group border-2 rounded-xl bg-card overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-md">
          <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <h3 className="text-lg font-bold text-left group-hover:text-primary transition-colors">
              Which payment methods are supported?
            </h3>
            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-300 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-6 pb-6 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <p className="text-muted-foreground leading-relaxed">
              For Indian users, we support Cashfree (UPI, cards, net banking, wallets). International users can pay via Google Play Store. All transactions are secure and encrypted.
            </p>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="group border-2 rounded-xl bg-card overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-md">
          <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <h3 className="text-lg font-bold text-left group-hover:text-primary transition-colors">
              Is there a refund policy?
            </h3>
            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-300 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-6 pb-6 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <p className="text-muted-foreground leading-relaxed">
              Yes! We offer a 7-day money-back guarantee. If you're not satisfied with your purchase within the first 7 days, contact our support team for a full refund - no questions asked.
            </p>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="group border-2 rounded-xl bg-card overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-md">
          <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <h3 className="text-lg font-bold text-left group-hover:text-primary transition-colors">
              Will my progress be saved after my plan expires?
            </h3>
            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-300 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-6 pb-6 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <p className="text-muted-foreground leading-relaxed">
              Yes, your progress remains saved. You can renew your plan anytime to continue learning without losing any data or achievements.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* CTA After FAQ */}
      <div className="text-center pt-8">
        <p className="text-muted-foreground mb-4">
          Still have questions? We're here to help!
        </p>
        <Button 
          variant="outline" 
          size="lg" 
          className="gap-2" 
          onClick={() => window.open('https://www.examtrakr.com/contact', '_blank')}
        >
          Contact Support
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
