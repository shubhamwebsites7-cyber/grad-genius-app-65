import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, BarChart3, Crown } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Target,
      title: 'Syllabus-Based Tracking',
      description: 'Track every topic and subject easily with comprehensive coverage.',
    },
    {
      icon: BarChart3,
      title: 'Progress Analytics',
      description: 'Monitor improvement and identify weak areas with detailed insights.',
    },
    {
      icon: Crown,
      title: 'Free Resources & Leaderboards',
      description: 'Access study materials and compete with peers to stay motivated.',
    },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Simple, powerful tools to help you prepare effectively and stay on track.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-border hover:shadow-2xl hover:border-primary/50 transition-all duration-300 group hover-scale animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};