import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, BarChart3, Crown } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Target,
      title: 'Syllabus-Based Tracking',
      description: 'Complete exam syllabus with marks, subject, and topic-wise breakdown. Track every aspect of your preparation with precision.',
    },
    {
      icon: BarChart3,
      title: 'Progress Analytics',
      description: 'Comprehensive marks-wise and difficulty-wise progress tracking. Monitor your performance across easy, medium, and hard topics.',
    },
    {
      icon: TrendingUp,
      title: 'Smart Filters & Voting',
      description: 'Filter topics by difficulty level and vote on topic difficulty to help the community. Access rating-based filters for better preparation.',
    },
    {
      icon: Crown,
      title: 'Free Resources & Leaderboard',
      description: 'Access free resources for each subject with topic-based ratings. Compete on exam-specific leaderboards with enrolled students.',
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
            Our AI-powered platform provides comprehensive tools to help you prepare effectively for competitive exams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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