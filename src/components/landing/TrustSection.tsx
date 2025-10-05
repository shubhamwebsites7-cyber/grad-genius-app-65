import React from 'react';
import { Shield, Lock, Award, Zap, Smartphone, Cloud } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Bank-level encryption'
    },
    {
      icon: Lock,
      title: 'Data Protection',
      description: 'GDPR Compliant'
    },
    {
      icon: Award,
      title: 'Trusted Platform',
      description: '50,000+ Students'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: '99.9% Uptime'
    },
    {
      icon: Smartphone,
      title: 'Mobile First',
      description: 'Works Offline'
    },
    {
      icon: Cloud,
      title: 'Auto Sync',
      description: 'Cloud Backup'
    }
  ];

  return (
    <section className="py-16 bg-muted/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Why Students Trust Examtrakr
          </h3>
          <p className="text-muted-foreground">
            Built with security, reliability, and student success in mind
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center p-4 rounded-lg bg-background/50 border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground text-sm mb-1">
                {feature.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-60">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">SSL Secured</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-border"></div>
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">ISO Certified</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-border"></div>
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">GDPR Compliant</span>
          </div>
        </div>
      </div>
    </section>
  );
};