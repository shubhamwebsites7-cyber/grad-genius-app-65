import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, BookOpen, FileText, TrendingUp, Headphones, Smartphone } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Unlimited Exam Access',
    description: 'Enroll in as many exams as you want'
  },
  {
    icon: CheckCircle2,
    title: 'Full Topic Coverage',
    description: 'Access all topics without restrictions'
  },
  {
    icon: FileText,
    title: 'Resources Library',
    description: 'Download PDFs, videos, and notes'
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description: 'Monitor your learning journey'
  },
  {
    icon: Headphones,
    title: 'Priority Support',
    description: 'Get help when you need it'
  },
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description: 'Study anywhere, anytime'
  }
];

export const PremiumFeatures = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Premium Features Included
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Everything you need to ace your exams
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
