import React from 'react';
import { Users, BookOpen, Target, GraduationCap } from 'lucide-react';

export const StatsSection: React.FC = () => {
  const stats = [
    {
      icon: Users,
      value: '50,000+',
      label: 'Total Students',
    },
    {
      icon: BookOpen,
      value: '150+',
      label: 'Total Exams',
    },
    {
      icon: Target,
      value: '5,000+',
      label: 'Total Topics',
    },
    {
      icon: GraduationCap,
      value: '25+',
      label: 'Total Subjects',
    },
  ];

  return (
    <section className="py-20 bg-accent/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Trusted by Students Worldwide
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of successful students who have achieved their goals with Examtrakr
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              {/* Mobile Layout: Text -> Number -> Icon */}
              <div className="block lg:hidden">
                <div className="text-muted-foreground font-medium text-sm mb-2">
                  {stat.label}
                </div>
                <div className="text-2xl font-bold text-foreground mb-3">
                  {stat.value}
                </div>
                <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              
              {/* Desktop Layout: Icon -> Number -> Text */}
              <div className="hidden lg:block">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};