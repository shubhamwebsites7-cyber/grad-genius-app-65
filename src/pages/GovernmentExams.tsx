import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, Target, BarChart3, CheckCircle, ArrowRight, Users, Award } from 'lucide-react';

const GovernmentExams = () => {
  const govtExams = [
    { name: 'SSC CGL', description: 'Staff Selection Commission - Combined Graduate Level' },
    { name: 'SSC CHSL', description: 'Combined Higher Secondary Level' },
    { name: 'SSC MTS', description: 'Multi Tasking Staff' },
    { name: 'SSC GD', description: 'General Duty Constable' },
    { name: 'UPSC CSE', description: 'Civil Services Examination - IAS, IPS, IFS' },
    { name: 'UPSC CDS', description: 'Combined Defence Services' },
    { name: 'UPSC NDA', description: 'National Defence Academy' },
    { name: 'Railway RRB NTPC', description: 'Non-Technical Popular Categories' },
    { name: 'Railway Group D', description: 'RRB Group D Level 1 Posts' },
    { name: 'State PSC', description: 'State Public Service Commission Exams' },
    { name: 'DSSSB', description: 'Delhi Subordinate Services Selection Board' },
    { name: 'Police Constable', description: 'State Police Recruitment' },
  ];

  const subjects = [
    { name: 'General Knowledge', topics: '500+ topics' },
    { name: 'Quantitative Aptitude', topics: '200+ topics' },
    { name: 'Reasoning Ability', topics: '150+ topics' },
    { name: 'English Language', topics: '100+ topics' },
    { name: 'Current Affairs', topics: 'Daily updates' },
    { name: 'General Science', topics: '300+ topics' },
  ];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://examtrakr.com" },
      { "@type": "ListItem", "position": 2, "name": "Government Exams", "item": "https://examtrakr.com/government-exams" }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Government Exam Tracker – SSC, UPSC, Railway Syllabus | ExamTrakr</title>
        <meta 
          name="description" 
          content="Track your government exam preparation with ExamTrakr. Topic-wise syllabus tracker for SSC CGL, UPSC, Railway exams. Monitor progress & complete syllabus on time." 
        />
        <meta 
          name="keywords" 
          content="government exam tracker, SSC CGL syllabus tracker, UPSC preparation app, Railway exam tracker, govt exam syllabus, SSC preparation progress, government exam planner, competitive exam tracker, sarkari exam preparation" 
        />
        <meta property="og:title" content="Government Exam Tracker – SSC, UPSC, Railway | ExamTrakr" />
        <meta property="og:description" content="Track SSC, UPSC, Railway exam syllabus topic-wise. Visual progress tracker for government exams." />
        <meta property="og:url" content="https://examtrakr.com/government-exams" />
        <link rel="canonical" href="https://examtrakr.com/government-exams" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
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
                <span className="text-foreground">Government Exams</span>
              </nav>
              
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                  Government Exam Tracker – Complete{' '}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Syllabus on Time
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Struggling with vast government exam syllabus? ExamTrakr is your smart exam preparation app to track topic-wise progress for SSC CGL, UPSC, Railway, and State PSC exams. Know exactly where you stand in your preparation!
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" asChild>
                    <Link to="/signup">
                      Start Tracking Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/exams">Browse All Govt Exams</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Problem-Solution Section */}
          <section className="py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-6">
                    Government Exam Syllabus is Too Big – How to Manage?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    We understand the struggle. SSC CGL has 4 tiers, UPSC has lakhs of aspirants, and the syllabus seems endless. Most students face these problems:
                  </p>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="text-destructive">✗</span>
                      <span>"I forgot what I studied last week"</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-destructive">✗</span>
                      <span>"How much syllabus is complete? I don't know"</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-destructive">✗</span>
                      <span>"Exam is near but syllabus is pending"</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-destructive">✗</span>
                      <span>"No clear exam preparation roadmap"</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-primary/5 p-8 rounded-2xl">
                  <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    ExamTrakr Solves This
                  </h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="text-primary">✓</span>
                      <span>Topic-wise syllabus tracker – mark what you studied</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary">✓</span>
                      <span>Visual progress bars – see exact completion percentage</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary">✓</span>
                      <span>Subject-wise tracking – Quant, Reasoning, GK separately</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary">✓</span>
                      <span>Exam preparation roadmap – follow structured path</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Government Exams List */}
          <section className="py-16 bg-accent/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4">
                Government Exams on ExamTrakr
              </h2>
              <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
                Track syllabus completion for SSC, UPSC, Railway, State PSC and more sarkari exams
              </p>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {govtExams.map((exam, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Award className="h-5 w-5 text-primary" />
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

          {/* Subjects Covered */}
          <section className="py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center text-foreground mb-12">
                Subjects & Topics We Cover
              </h2>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subject, index) => (
                  <Card key={index} className="text-center">
                    <CardContent className="p-6">
                      <BookOpen className="h-10 w-10 text-primary mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-foreground mb-2">{subject.name}</h3>
                      <p className="text-primary font-semibold">{subject.topics}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="py-16 bg-accent/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">50,000+</div>
                  <div className="text-muted-foreground">Students Tracking</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">100+</div>
                  <div className="text-muted-foreground">Government Exams</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">5,000+</div>
                  <div className="text-muted-foreground">Topics Covered</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">4.9★</div>
                  <div className="text-muted-foreground">User Rating</div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 bg-gradient-to-r from-primary to-secondary">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                Start Tracking Your Government Exam Today
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8">
                Don't let vast syllabus overwhelm you. Track progress, complete syllabus, crack your sarkari exam!
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

export default GovernmentExams;