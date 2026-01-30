import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, Target, BarChart3, CheckCircle, ArrowRight, TrendingUp } from 'lucide-react';

const BankingExams = () => {
  const bankingExams = [
    { name: 'IBPS PO', description: 'Institute of Banking Personnel Selection - Probationary Officer' },
    { name: 'IBPS Clerk', description: 'Institute of Banking Personnel Selection - Clerk' },
    { name: 'IBPS SO', description: 'Institute of Banking Personnel Selection - Specialist Officer' },
    { name: 'IBPS RRB', description: 'Regional Rural Banks Officer Scale I, II, III' },
    { name: 'SBI PO', description: 'State Bank of India - Probationary Officer' },
    { name: 'SBI Clerk', description: 'State Bank of India - Junior Associate' },
    { name: 'RBI Grade B', description: 'Reserve Bank of India - Grade B Officer' },
    { name: 'RBI Assistant', description: 'Reserve Bank of India - Assistant' },
    { name: 'NABARD', description: 'National Bank for Agriculture and Rural Development' },
    { name: 'SIDBI', description: 'Small Industries Development Bank of India' },
  ];

  const features = [
    {
      icon: Target,
      title: 'Topic-Wise Syllabus Tracking',
      description: 'Track every topic in Quantitative Aptitude, Reasoning, English, General Awareness, and Computer Knowledge.'
    },
    {
      icon: BarChart3,
      title: 'Visual Progress Tracker',
      description: 'See your banking exam preparation progress with beautiful progress bars for each subject and section.'
    },
    {
      icon: CheckCircle,
      title: 'Syllabus Completion Tracker',
      description: 'Mark topics as complete and never forget what you studied. Perfect for IBPS, SBI, RBI exam preparation.'
    },
    {
      icon: TrendingUp,
      title: 'Exam Preparation Roadmap',
      description: 'Follow a structured roadmap to complete your banking exam syllabus on time.'
    },
  ];

  // Structured data for Banking Exams page
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://examtrakr.com" },
      { "@type": "ListItem", "position": 2, "name": "Banking Exams", "item": "https://examtrakr.com/banking-exams" }
    ]
  };

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Banking Exam Preparation with ExamTrakr",
    "description": "Complete syllabus tracking and progress monitoring for IBPS, SBI, RBI and other banking exams",
    "provider": {
      "@type": "Organization",
      "name": "ExamTrakr",
      "sameAs": "https://examtrakr.com"
    }
  };

  return (
    <>
      <Helmet>
        <title>Banking Exam Tracker – IBPS, SBI, RBI Syllabus & Preparation | ExamTrakr</title>
        <meta 
          name="description" 
          content="Track your banking exam preparation with ExamTrakr. Topic-wise syllabus tracker for IBPS PO, IBPS Clerk, SBI PO, SBI Clerk, RBI Grade B. Monitor progress & study smarter." 
        />
        <meta 
          name="keywords" 
          content="banking exam tracker, IBPS PO syllabus, IBPS Clerk preparation, SBI PO exam tracker, banking exam syllabus, IBPS preparation app, banking exam progress tracker, RBI Grade B syllabus, bank exam study planner" 
        />
        <meta property="og:title" content="Banking Exam Tracker – IBPS, SBI, RBI Preparation | ExamTrakr" />
        <meta property="og:description" content="Track your banking exam syllabus topic-wise. Monitor IBPS, SBI, RBI preparation progress with visual trackers." />
        <meta property="og:url" content="https://examtrakr.com/banking-exams" />
        <link rel="canonical" href="https://examtrakr.com/banking-exams" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(courseSchema)}</script>
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
                <span className="text-foreground">Banking Exams</span>
              </nav>
              
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                  Banking Exam Tracker – Your Complete{' '}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Syllabus Tracker
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Preparing for IBPS, SBI, or RBI exams? ExamTrakr is your smart exam tracker app to track topic-wise syllabus, monitor your preparation progress, and stay organized. Stop wondering "what to study next" – start tracking today!
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" asChild>
                    <Link to="/signup">
                      Start Tracking Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/exams">Explore Banking Exams</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Why Use ExamTrakr for Banking Exams */}
          <section className="py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4">
                Why Use ExamTrakr for Banking Exam Preparation?
              </h2>
              <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
                Banking exams like IBPS PO, SBI Clerk have vast syllabi. Our syllabus tracker helps you complete every topic without missing anything.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <Card key={index} className="border-border hover:border-primary/50 transition-all">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl mb-4">
                        <feature.icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Supported Banking Exams */}
          <section className="py-16 bg-accent/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4">
                Banking Exams We Support
              </h2>
              <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
                Track syllabus and monitor progress for all major banking exams in India
              </p>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {bankingExams.map((exam, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{exam.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">{exam.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* How to Track Banking Exam Syllabus */}
          <section className="py-16 bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-12">
                How to Track Your Banking Exam Syllabus
              </h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Select Your Banking Exam</h3>
                    <p className="text-muted-foreground">Choose IBPS PO, SBI Clerk, RBI Grade B or any banking exam you're preparing for. ExamTrakr has complete topic-wise syllabus ready.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Start Marking Topics Complete</h3>
                    <p className="text-muted-foreground">As you study each topic in Quant, Reasoning, English, GA – mark it complete. See your progress bar fill up!</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Monitor Your Progress Daily</h3>
                    <p className="text-muted-foreground">Check your exam preparation progress anytime. Know exactly how much syllabus is complete and what's remaining.</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-12">
                <Button size="lg" asChild>
                  <Link to="/signup">Start Tracking Your Banking Exam <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 bg-gradient-to-r from-primary to-secondary">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Crack Your Banking Exam?
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8">
                Join thousands of students using ExamTrakr to track their IBPS, SBI, RBI preparation. Start free today!
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

export default BankingExams;