import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, BookOpen, TrendingUp, Award } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      icon: UserPlus,
      step: '01',
      title: 'Create Free Account',
      description: 'Sign up quickly and start tracking your preparation.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: BookOpen,
      step: '02',
      title: 'Choose Your Exam',
      description: 'Select from 150+ exams worldwide.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: TrendingUp,
      step: '03',
      title: 'Track Progress',
      description: 'Monitor your improvement and identify weak areas.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Award,
      step: '04',
      title: 'Achieve Success',
      description: 'Stay consistent and reach your goals.',
      color: 'from-green-500 to-teal-500'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-accent/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-4">
            <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
              Simple Process
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            How Examtrakr{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get started in seconds and achieve your exam goals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card 
              key={index} 
              className="border-border hover:shadow-2xl hover:border-primary/50 transition-all duration-500 group relative overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Step number background */}
              <div className="absolute top-0 right-0 text-9xl font-bold text-muted/5 select-none">
                {step.step}
              </div>
              
              <CardContent className="p-6 relative z-10">
                {/* Icon with gradient */}
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                
                {/* Step number */}
                <div className="text-sm font-bold text-primary mb-2">STEP {step.step}</div>
                
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </CardContent>

              {/* Connecting line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent z-20"></div>
              )}
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-lg text-muted-foreground mb-6">
            Join 50,000+ students who are already tracking their success
          </p>
        </div>
      </div>
    </section>
  );
};