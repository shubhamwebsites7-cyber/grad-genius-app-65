import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, TrendingUp, Target, Zap } from 'lucide-react';
import { useImageOptimization } from '@/hooks/useImageOptimization';
import { useCountryDetection } from '@/hooks/useCountryDetection';
import heroImage from '@/assets/hero-image.jpg';

export const HeroSection: React.FC = () => {
  const { isIndia } = useCountryDetection();
  useImageOptimization([heroImage]);

  const heroSubtitle = isIndia 
    ? "Track your progress subject-wise and overall performance for all competitive, job, and entrance exams."
    : "Track your progress subject-wise and overall performance for global exams, certifications, and entrance tests.";

  const examNames = isIndia
    ? ['NEET', 'JEE', 'IBPS PO', 'SSC CGL', 'UPSC', 'CAT', 'GATE', 'CLAT', 'SBI PO', 'TET', 'NDA']
    : ['SAT', 'ACT', 'IELTS', 'TOEFL', 'GRE', 'GMAT', 'CFA', 'PMP', 'AWS', 'CPA', 'LSAT'];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-accent/30 to-primary/5">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 lg:pt-12 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Track Your Success</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Master Your{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Exam Journey
                  </span>
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
                {heroSubtitle}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="cta" size="xl" className="group" asChild>
                <Link to="/signup">
                  Start Tracking Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="hover-scale" asChild>
                <Link to="/exams">
                  <Play className="mr-2 h-5 w-5" />
                  Explore Exams
                </Link>
              </Button>
            </div>

            {/* Social Proof with Icons */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold border-2 border-background"
                    >
                      {i === 1 ? '👨‍🎓' : i === 2 ? '👩‍🎓' : i === 3 ? '🧑‍💼' : '👨‍💻'}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-foreground">50,000+ Students</p>
                  <p className="text-xs text-muted-foreground">Tracking Progress</p>
                </div>
              </div>
              <div className="w-px h-12 bg-border hidden sm:block"></div>
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-warning text-xl">⭐</span>
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-foreground">4.9/5 Rating</p>
                  <p className="text-xs text-muted-foreground">5000+ Reviews</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { icon: TrendingUp, label: 'Success Rate', value: '94%' },
                { icon: Target, label: 'Exams Covered', value: '100+' },
                { icon: Zap, label: 'Daily Users', value: '10K+' }
              ].map((stat, i) => (
                <div key={i} className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4 hover:shadow-lg transition-all hover-scale">
                  <stat.icon className="h-5 w-5 text-primary mb-2" />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <img
                src={heroImage}
                alt="Students tracking exam preparation progress with Examtrakr dashboard"
                className="w-full h-auto object-cover"
                loading="lazy"
                width="600"
                height="400"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent"></div>
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-6 -right-6 bg-card p-5 rounded-2xl shadow-xl border border-border backdrop-blur-sm">
              <div className="text-sm font-semibold text-muted-foreground mb-1">Your Progress</div>
              <div className="flex items-center space-x-2">
                <div className="text-3xl font-bold text-foreground">89%</div>
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
            
            <div className="absolute -bottom-6 -left-6 bg-card p-5 rounded-2xl shadow-xl border border-border backdrop-blur-sm">
              <div className="text-sm font-semibold text-muted-foreground mb-1">Your Goal</div>
              <div className="text-lg font-bold text-foreground">Track & Succeed</div>
              <div className="text-xs text-success flex items-center mt-1">
                <Target className="h-3 w-3 mr-1" />
                Stay Focused
              </div>
            </div>
          </div>
        </div>
        
        {/* Continuous Scrolling Exam Names */}
        <div className="mt-20 overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10"></div>
          <div className="flex whitespace-nowrap animate-scroll">
            <div className="flex items-center space-x-8 text-xl sm:text-2xl font-bold">
              {[...examNames, ...examNames].map((exam, i) => (
                <span 
                  key={i} 
                  className="text-muted-foreground/50 hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-primary/5"
                >
                  {exam}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};