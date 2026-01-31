import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Target, CheckCircle, BarChart3, ArrowRight, Layers, Eye } from 'lucide-react';
import { useCountryDetection } from '@/hooks/useCountryDetection';

const SyllabusTracker = () => {
  const { isIndia } = useCountryDetection();

  const indiaFeatures = [
    {
      icon: Layers,
      title: 'Exam-Wise Syllabus',
      description: 'Complete topic-wise syllabus for 150+ exams including IBPS, SSC, UPSC, JEE, NEET, CTET. Everything organized by subjects and sections.'
    },
    {
      icon: CheckCircle,
      title: 'Mark Topics Complete',
      description: 'As you study each topic, mark it complete with one click. ExamTrakr remembers your progress automatically.'
    },
    {
      icon: BarChart3,
      title: 'Visual Progress Bars',
      description: 'See beautiful progress bars for each subject and section. Know exactly how much syllabus is complete at a glance.'
    },
    {
      icon: Eye,
      title: 'Never Miss a Topic',
      description: 'With topic-wise tracking, you will never forget what you studied. Review completed topics anytime before exams.'
    },
  ];

  const globalFeatures = [
    {
      icon: Layers,
      title: 'Exam-Wise Syllabus',
      description: 'Complete topic-wise syllabus for 100+ exams including SAT, GRE, GMAT, IELTS, TOEFL, CFA, PMP. Everything organized by sections.'
    },
    {
      icon: CheckCircle,
      title: 'Mark Topics Complete',
      description: 'As you study each topic, mark it complete with one click. ExamTrakr remembers your progress automatically.'
    },
    {
      icon: BarChart3,
      title: 'Visual Progress Bars',
      description: 'See beautiful progress bars for each section and module. Know exactly how much syllabus is complete at a glance.'
    },
    {
      icon: Eye,
      title: 'Never Miss a Topic',
      description: 'With topic-wise tracking, you will never forget what you studied. Review completed topics anytime before exams.'
    },
  ];

  const features = isIndia ? indiaFeatures : globalFeatures;

  const indiaHowItWorks = [
    {
      step: '1',
      title: 'Select Your Exam',
      description: 'Choose from 150+ exams like IBPS PO, SSC CGL, UPSC, JEE, NEET. We have the complete syllabus ready for you.'
    },
    {
      step: '2',
      title: 'Browse Topic-Wise Syllabus',
      description: 'See every topic organized by subject and section. No more confusion about what to study.'
    },
    {
      step: '3',
      title: 'Mark Topics as Complete',
      description: 'After studying a topic, mark it complete. Watch your progress bar grow with each topic you finish.'
    },
    {
      step: '4',
      title: 'Track Your Progress',
      description: 'Check your syllabus completion anytime. See subject-wise and overall progress to stay motivated.'
    },
  ];

  const globalHowItWorks = [
    {
      step: '1',
      title: 'Select Your Exam',
      description: 'Choose from 100+ exams like SAT, GRE, GMAT, IELTS, TOEFL, CFA, PMP. We have the complete syllabus ready for you.'
    },
    {
      step: '2',
      title: 'Browse Topic-Wise Syllabus',
      description: 'See every topic organized by section and module. No more confusion about what to study.'
    },
    {
      step: '3',
      title: 'Mark Topics as Complete',
      description: 'After studying a topic, mark it complete. Watch your progress bar grow with each topic you finish.'
    },
    {
      step: '4',
      title: 'Track Your Progress',
      description: 'Check your syllabus completion anytime. See section-wise and overall progress to stay motivated.'
    },
  ];

  const howItWorks = isIndia ? indiaHowItWorks : globalHowItWorks;

  const indiaExamTags = ['IBPS PO', 'SBI Clerk', 'SSC CGL', 'SSC CHSL', 'UPSC', 'Railway', 'CTET', 'JEE Main', 'NEET', 'GATE', 'CAT', 'CLAT'];
  const globalExamTags = ['SAT', 'ACT', 'GRE', 'GMAT', 'IELTS', 'TOEFL', 'CFA', 'PMP', 'AWS', 'CISSP', 'LSAT', 'MCAT'];
  const examTags = isIndia ? indiaExamTags : globalExamTags;

  const seoContent = isIndia ? {
    title: "Syllabus Tracker – Track Exam Syllabus Topic-Wise | ExamTrakr",
    description: "ExamTrakr Syllabus Tracker helps you track exam syllabus topic-wise. Mark topics complete, see visual progress, never miss any topic. Best syllabus tracker app for competitive exams.",
    keywords: "syllabus tracker, syllabus tracker app, topic wise syllabus tracker, exam syllabus tracker, syllabus tracking app, how to track exam syllabus, syllabus completion tracker, exam wise syllabus tracker app, best way to complete exam syllabus",
    h1: "Syllabus Tracker – Track Every",
    h1Highlight: "Topic You Study",
    heroText: "Wondering \"how to track exam syllabus\"? ExamTrakr's syllabus tracker lets you mark topics complete, see visual progress bars, and never forget what you studied. The best way to complete exam syllabus on time!",
    problemTitle: "Syllabus is Too Big – How to Manage?",
    problemText: "Every student preparing for competitive exams faces this problem. The syllabus seems endless, you study but forget, and exam day comes with incomplete preparation. Sound familiar?",
    examsSupported: "Syllabus Tracker for All Major Exams",
    examsSubtitle: "ExamTrakr has topic-wise syllabus ready for 150+ competitive and government exams",
    moreExams: "+ 140 more exams",
    currency: "INR"
  } : {
    title: "Syllabus Tracker – Track Exam Syllabus Topic-Wise | ExamTrakr",
    description: "ExamTrakr Syllabus Tracker helps you track exam syllabus topic-wise. Mark topics complete, see visual progress, never miss any topic. Best syllabus tracker app for global exams.",
    keywords: "syllabus tracker, syllabus tracker app, topic wise syllabus tracker, exam syllabus tracker, SAT study tracker, GRE syllabus tracker, IELTS preparation tracker, GMAT study planner, exam preparation progress app",
    h1: "Syllabus Tracker – Track Every",
    h1Highlight: "Topic You Study",
    heroText: "Wondering \"how to track exam syllabus\"? ExamTrakr's syllabus tracker lets you mark topics complete, see visual progress bars, and never forget what you studied. The best way to complete exam syllabus on time!",
    problemTitle: "Syllabus is Overwhelming – How to Manage?",
    problemText: "Every student preparing for standardized tests faces this problem. The material seems endless, you study but forget, and exam day comes with incomplete preparation. Sound familiar?",
    examsSupported: "Syllabus Tracker for All Major Exams",
    examsSubtitle: "ExamTrakr has topic-wise syllabus ready for 100+ standardized tests and certifications worldwide",
    moreExams: "+ 90 more exams",
    currency: "USD"
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://examtrakr.com" },
      { "@type": "ListItem", "position": 2, "name": "Syllabus Tracker", "item": "https://examtrakr.com/syllabus-tracker" }
    ]
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ExamTrakr Syllabus Tracker",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web, Android, iOS",
    "description": isIndia 
      ? "Topic-wise syllabus tracker for competitive and government exams. Track your preparation progress visually."
      : "Topic-wise syllabus tracker for global standardized tests and certifications. Track your preparation progress visually.",
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
        <meta property="og:url" content="https://examtrakr.com/syllabus-tracker" />
        <link rel="canonical" href="https://examtrakr.com/syllabus-tracker" />
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
                <span className="text-foreground">Syllabus Tracker</span>
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
                      Start Tracking Syllabus <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/exams">Browse Exam Syllabi</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Problem Section */}
          <section className="py-16 bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                {seoContent.problemTitle}
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                {seoContent.problemText}
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="text-destructive text-xl">✗</span>
                  <span>"I forgot what I studied last week"</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="text-destructive text-xl">✗</span>
                  <span>"Syllabus is too big, can't manage"</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="text-destructive text-xl">✗</span>
                  <span>"No idea how much is complete"</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="text-destructive text-xl">✗</span>
                  <span>"Exam near, syllabus pending"</span>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="py-16 bg-accent/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4">
                ExamTrakr Syllabus Tracker Features
              </h2>
              <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
                Everything you need to track your exam syllabus effectively
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

          {/* How It Works */}
          <section className="py-16 bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-12">
                How to Track Exam Syllabus with ExamTrakr
              </h2>
              
              <div className="space-y-8">
                {howItWorks.map((item, index) => (
                  <div key={index} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Exams Supported */}
          <section className="py-16 bg-accent/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {seoContent.examsSupported}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                {seoContent.examsSubtitle}
              </p>
              
              <div className="flex flex-wrap justify-center gap-3">
                {examTags.map((exam, index) => (
                  <span key={index} className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-full">
                    {exam}
                  </span>
                ))}
                <span className="px-4 py-2 bg-secondary/10 text-secondary font-medium rounded-full">
                  {seoContent.moreExams}
                </span>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 bg-gradient-to-r from-primary to-secondary">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                Start Tracking Your Syllabus Today
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8">
                Join 50,000+ students who use ExamTrakr to track their exam syllabus. Free to start!
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

export default SyllabusTracker;
