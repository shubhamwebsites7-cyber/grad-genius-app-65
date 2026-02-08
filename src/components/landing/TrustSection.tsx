import React from 'react';
import { Globe, Smartphone, Cloud, Lock } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const features = [
    {
      icon: Globe,
      title: 'Trusted by 50,000+ students worldwide',
      description: 'Join thousands of successful students'
    },
    {
      icon: Smartphone,
      title: 'Learn anywhere — works offline & mobile-ready',
      description: 'Study on-the-go without internet'
    },
    {
      icon: Cloud,
      title: 'Auto-save & cloud backup — never lose progress',
      description: 'Your data is always safe'
    },
    {
      icon: Lock,
      title: 'Fully secure & private — your data is safe',
      description: 'Complete privacy protection'
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Why Students Trust{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ExamTracker
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Reliable, secure, and built for your success
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-foreground text-base mb-2 leading-snug">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};