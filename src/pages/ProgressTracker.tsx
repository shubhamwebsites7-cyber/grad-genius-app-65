import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, ArrowRight, PieChart, Activity, Award } from 'lucide-react';
import { useCountryDetection } from '@/hooks/useCountryDetection';

const ProgressTracker = () => {
  const { isIndia } = useCountryDetection();

  const indiaFeatures = [
    {
      icon: BarChart3,
      title: 'Visual Progress Bars',
      description: 'See beautiful progress bars for each subject, section, and overall exam. Know your exact completion percentage at a glance.'
    },
    {
      icon: PieChart,
      title: 'Subject-Wise Analytics',
      description: 'Track progress for Quant, Reasoning, English, GK separately. Identify which subjects need more attention.'
    },
    {
      icon: Activity,
      title: 'Daily Progress Tracking',
      description: 'Monitor your daily study progress. See how many topics you complete each day to stay consistent.'
    },
    {
      icon: Award,
      title: 'Completion Milestones',
      description: 'Celebrate when you reach 25%, 50%, 75%, 100% syllabus completion. Stay motivated throughout your preparation.'
    },
  ];

  const globalFeatures = [
    {
      icon: BarChart3,
      title: 'Visual Progress Bars',
      description: 'See beautiful progress bars for each section, module, and overall exam. Know your exact completion percentage at a glance.'
    },
    {
      icon: PieChart,
      title: 'Section-Wise Analytics',
      description: 'Track progress for Verbal, Quant, Writing, Reading separately. Identify which sections need more attention.'
    },
    {
      icon: Activity,
      title: 'Daily Progress Tracking',
      description: 'Monitor your daily study progress. See how many topics you complete each day to stay consistent.'
    },
    {
      icon: Award,
      title: 'Completion Milestones',
      description: 'Celebrate when you reach 25%, 50%, 75%, 100% syllabus completion. Stay motivated throughout your preparation.'
    },
  ];

  const features = isIndia ? indiaFeatures : globalFeatures;

  const indiaBenefits = [
    'Know exactly how much syllabus is complete',
    'Identify weak subjects that need more focus',
    'Track daily study consistency',
    'Never forget what you studied',
    'Stay motivated with visual progress',
    'Complete syllabus before exam day',
  ];

  const globalBenefits = [
    'Know exactly how much material is complete',
    'Identify weak sections that need more focus',
    'Track daily study consistency',
    'Never forget what you studied',
    'Stay motivated with visual progress',
    'Complete preparation before test day',
  ];

  const benefits = isIndia ? indiaBenefits : globalBenefits;

  const seoContent = isIndia ? {
    title: "Progress Tracker – Monitor Exam Preparation Progress | ExamTrakr",
    description: "ExamTrakr Progress Tracker shows your exam preparation progress visually. Track subject-wise completion, see progress bars, monitor daily study. Best exam progress tracker app.",
    keywords: "progress tracker, exam progress tracker, study progress tracker, exam preparation progress app, preparation tracker for government exams, app to track exam preparation progress, exam preparation with visual progress, exam preparation with progress bar",
    h1: "Progress Tracker – See Your",
    h1Highlight: "Exam Preparation Grow",
    heroText: "Ever wondered \"how much syllabus is complete\"? ExamTrakr's progress tracker shows your exam preparation progress with beautiful visual bars. Track subject-wise, see daily progress, and stay motivated until you crack your exam!",
    problemTitle: "\"How Much Did I Study?\" – Stop Guessing!",
    problemText: "Most students have no idea how much syllabus they've actually covered. They study daily but can't measure progress.",
    currency: "INR"
  } : {
    title: "Progress Tracker – Monitor Exam Preparation Progress | ExamTrakr",
    description: "ExamTrakr Progress Tracker shows your exam preparation progress visually. Track section-wise completion, see progress bars, monitor daily study. Best exam progress tracker app.",
    keywords: "progress tracker, exam progress tracker, study progress tracker, SAT progress tracker, GRE preparation tracker, GMAT study progress, test preparation progress app, visual study tracker, exam preparation analytics",
    h1: "Progress Tracker – See Your",
    h1Highlight: "Test Preparation Grow",
    heroText: "Ever wondered \"how much material is complete\"? ExamTrakr's progress tracker shows your exam preparation progress with beautiful visual bars. Track section-wise, see daily progress, and stay motivated until you ace your test!",
    problemTitle: "\"How Much Did I Study?\" – Stop Guessing!",
    problemText: "Most test-takers have no idea how much material they've actually covered. They study daily but can't measure progress.",
    currency: "USD"
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://examtrakr.com" },
      { "@type": "ListItem", "position": 2, "name": "Progress Tracker", "item": "https://examtrakr.com/progress-tracker" }
    ]
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ExamTrakr Progress Tracker",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web, Android, iOS",
    "description": isIndia 
      ? "Visual exam preparation progress tracker. Monitor your syllabus completion with progress bars and analytics."
      : "Visual exam preparation progress tracker. Monitor your test preparation with progress bars and analytics.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": seoContent.currency
    }
  };

  return (
    <>
      <Helmet>
        <title>{seoContent.title}</title>
        <meta name="description" content={seoContent.description} />
        <meta name="keywords" content={seoContent.keywords} />
        <meta property="og:title" content={seoContent.title} />
        <meta property="og:description" content={seoContent.description} />
        <meta property="og:url" content="https://examtrakr.com/progress-tracker" />
        <link rel="canonical" href="https://examtrakr.com/progress-tracker" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(softwareSchema)}</script>
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="text-sm text-muted-foreground mb-6">
                <Link to="/" className="hover:text-primary">Home</Link>
                <span className="mx-2">/</span>
                <span className="text-foreground">Progress Tracker</span>
              </nav>
              
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                  {seoContent.h1}{' '}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {seoContent.h1Highlight}
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  {seoContent.heroText}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" asChild>
                    <Link to="/signup">
                      Start Tracking Progress <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/exams">Choose Your Exam</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Problem-Solution */}
          <section className="py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-6">
                    {seoContent.problemTitle}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {seoContent.problemText} This leads to:
                  </p>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-center gap-3">
                      <span className="text-destructive">✗</span>
                      <span>Anxiety about incomplete syllabus</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-destructive">✗</span>
                      <span>No motivation to continue studying</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-destructive">✗</span>
                      <span>Wasting time on already-learned topics</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-destructive">✗</span>
                      <span>Missing important topics before exam</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-primary/5 p-8 rounded-2xl">
                  <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    ExamTrakr Progress Tracker Helps You
                  </h3>
                  <ul className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-3 text-muted-foreground">
                        <span className="text-primary">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="py-16 bg-accent/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4">
                Progress Tracker Features
              </h2>
              <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
                Powerful tools to monitor and visualize your exam preparation progress
              </p>
              
              <div className="grid md:grid-cols-2 gap-8">
                {features.map((feature, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                          <feature.icon className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* How Progress Tracking Works */}
          <section className="py-16 bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-12">
                How Exam Progress Tracking Works
              </h2>
              
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Add Your Exam</h3>
                    <p className="text-muted-foreground">
                      {isIndia 
                        ? "Select the exam you're preparing for. ExamTrakr loads the complete syllabus with all subjects and topics."
                        : "Select the test you're preparing for. ExamTrakr loads the complete syllabus with all sections and topics."
                      }
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Study & Mark Complete</h3>
                    <p className="text-muted-foreground">After studying each topic, mark it as complete. Your progress bar updates instantly.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Check Progress Anytime</h3>
                    <p className="text-muted-foreground">
                      {isIndia 
                        ? "Open your dashboard to see overall and subject-wise progress. Visual bars show exactly where you stand."
                        : "Open your dashboard to see overall and section-wise progress. Visual bars show exactly where you stand."
                      }
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">4</div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Complete Before Exam Day</h3>
                    <p className="text-muted-foreground">With clear visibility of progress, you can plan and complete syllabus before your exam date.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 bg-gradient-to-r from-primary to-secondary">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                Start Tracking Your Progress Today
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8">
                See your exam preparation grow with visual progress bars. Join 50,000+ students on ExamTrakr!
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/signup">Create Free Account</Link>
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ProgressTracker;
