import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const CTASection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-primary via-primary-hover to-secondary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
          Ready to Start Your Success Journey?
        </h2>
        <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
          Join thousands of students who are already tracking their progress and achieving their academic goals.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="secondary" size="xl" asChild>
            <Link to="/signup">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="xl" 
            className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20"
            asChild
          >
            <Link to="/pricing">
              View Pricing
            </Link>
          </Button>
        </div>
        <p className="text-sm text-primary-foreground/70 mt-4">
          No credit card required • Free plan available • Cancel anytime
        </p>
      </div>
    </section>
  );
};