import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Users, BookOpen, Clock } from 'lucide-react';
import { useCountryDetection } from '@/hooks/useCountryDetection';

export const PopularExamsSection: React.FC = () => {
  const { isIndia } = useCountryDetection();

  const indiaExams = [
    {
      name: 'NEET',
      fullName: 'National Eligibility cum Entrance Test',
      students: '18L+',
      topics: '500+',
      duration: '12 months',
      gradient: 'from-rose-500 to-pink-600',
      bgGradient: 'from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20'
    },
    {
      name: 'JEE',
      fullName: 'Joint Entrance Examination',
      students: '15L+',
      topics: '450+',
      duration: '12 months',
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20'
    },
    {
      name: 'IBPS PO',
      fullName: 'Institute of Banking Personnel Selection',
      students: '12L+',
      topics: '350+',
      duration: '6 months',
      gradient: 'from-violet-500 to-purple-600',
      bgGradient: 'from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20'
    },
    {
      name: 'SSC CGL',
      fullName: 'Staff Selection Commission',
      students: '25L+',
      topics: '400+',
      duration: '8 months',
      gradient: 'from-orange-500 to-amber-600',
      bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20'
    },
    {
      name: 'UPSC',
      fullName: 'Union Public Service Commission',
      students: '10L+',
      topics: '800+',
      duration: '18 months',
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20'
    },
    {
      name: 'CAT',
      fullName: 'Common Admission Test',
      students: '3L+',
      topics: '300+',
      duration: '10 months',
      gradient: 'from-indigo-500 to-blue-600',
      bgGradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20'
    }
  ];

  const globalExams = [
    {
      name: 'SAT',
      fullName: 'Scholastic Assessment Test',
      students: '2M+',
      topics: '200+',
      duration: '6 months',
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20'
    },
    {
      name: 'ACT',
      fullName: 'American College Testing',
      students: '1.8M+',
      topics: '180+',
      duration: '6 months',
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20'
    },
    {
      name: 'IELTS',
      fullName: 'International English Language Testing',
      students: '3M+',
      topics: '150+',
      duration: '3 months',
      gradient: 'from-rose-500 to-pink-600',
      bgGradient: 'from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20'
    },
    {
      name: 'TOEFL',
      fullName: 'Test of English as a Foreign Language',
      students: '2M+',
      topics: '140+',
      duration: '3 months',
      gradient: 'from-orange-500 to-amber-600',
      bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20'
    },
    {
      name: 'GRE',
      fullName: 'Graduate Record Examination',
      students: '500K+',
      topics: '250+',
      duration: '4 months',
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20'
    },
    {
      name: 'GMAT',
      fullName: 'Graduate Management Admission Test',
      students: '250K+',
      topics: '220+',
      duration: '4 months',
      gradient: 'from-indigo-500 to-blue-600',
      bgGradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20'
    }
  ];

  const exams = isIndia ? indiaExams : globalExams;

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-4">
            <Badge variant="outline" className="px-4 py-2 text-sm font-semibold border-primary text-primary">
              Most Popular
            </Badge>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Top Competitive{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Exams
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {isIndia 
              ? "Start tracking your preparation for India's most sought-after competitive exams"
              : "Start tracking your preparation for the world's most popular standardized tests and certifications"
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {exams.map((exam, index) => (
            <Card 
              key={index} 
              className={`group hover:shadow-2xl transition-all duration-500 border-border hover:border-primary/50 overflow-hidden animate-fade-in bg-gradient-to-br ${exam.bgGradient}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-3xl font-bold bg-gradient-to-r ${exam.gradient} bg-clip-text text-transparent mb-1`}>
                      {exam.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {exam.fullName}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${exam.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-semibold text-foreground">{exam.students}</span>
                    <span className="ml-1">Students</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-semibold text-foreground">{exam.topics}</span>
                    <span className="ml-1">Topics</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-semibold text-foreground">{exam.duration}</span>
                    <span className="ml-1">Prep Time</span>
                  </div>
                </div>

                {/* CTA */}
                <Button 
                  variant="outline" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                  asChild
                >
                  <Link to="/signup">
                    Start Tracking
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button variant="outline" size="lg" asChild>
            <Link to="/exams">
              {isIndia ? "View All 150+ Exams" : "View All 100+ Exams"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};