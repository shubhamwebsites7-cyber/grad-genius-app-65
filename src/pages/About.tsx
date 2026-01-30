import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, Target, Users, TrendingUp, CheckCircle, Heart, ArrowRight } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Target,
      title: 'Student-First Approach',
      description: 'Every feature we build is designed with Indian students in mind. We understand the challenges of competitive exam preparation.'
    },
    {
      icon: BookOpen,
      title: 'Simplified Learning',
      description: 'We break complex syllabi into manageable topics. No more overwhelm – just clear, trackable progress.'
    },
    {
      icon: TrendingUp,
      title: 'Progress-Focused',
      description: 'Visual progress tracking keeps you motivated. See your preparation grow day by day.'
    },
    {
      icon: Heart,
      title: 'Made in India',
      description: 'Built by Indians, for Indians. We understand the unique needs of government and competitive exam aspirants.'
    },
  ];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://examtrakr.com" },
      { "@type": "ListItem", "position": 2, "name": "About", "item": "https://examtrakr.com/about" }
    ]
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ExamTrakr",
    "url": "https://examtrakr.com",
    "logo": "https://examtrakr.com/examtrakr.png",
    "description": "India's #1 exam tracker app for government and competitive exam preparation. Track syllabus, monitor progress, study smarter.",
    "foundingDate": "2024",
    "foundingLocation": "India"
  };

  return (
    <>
      <Helmet>
        <title>About ExamTrakr – India's Best Exam Tracker App</title>
        <meta name="description" content="ExamTrakr is India's #1 exam tracker app built for students preparing for IBPS, SSC, UPSC, JEE, NEET. Track syllabus topic-wise, monitor progress, and study smarter." />
        <meta name="keywords" content="about ExamTrakr, exam tracker app, Indian exam preparation, study tracker, syllabus tracking app, government exam preparation app" />
        <meta property="og:title" content="About ExamTrakr – India's Best Exam Tracker App" />
        <meta property="og:description" content="Learn about ExamTrakr - the exam tracker app helping 50,000+ Indian students prepare smarter." />
        <meta property="og:url" content="https://examtrakr.com/about" />
        <link rel="canonical" href="https://examtrakr.com/about" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Breadcrumb */}
              <nav className="text-sm text-muted-foreground mb-6">
                <Link to="/" className="hover:text-primary">Home</Link>
                <span className="mx-2">/</span>
                <span className="text-foreground">About</span>
              </nav>

              <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                  About{' '}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    ExamTrakr
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  India's most loved exam tracker app, helping 50,000+ students track their exam preparation journey
                </p>
              </div>
            </div>
          </section>

          {/* Mission Section */}
          <section className="py-16 bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-3xl font-bold text-foreground mb-6 text-center">Our Mission</h2>
                  <div className="prose prose-lg max-w-none text-center">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      We believe every student deserves smart tools to prepare effectively for competitive exams. ExamTrakr was born from a simple question: "How much syllabus have I actually covered?"
                    </p>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Too many students study hard but can't measure their progress. They forget what they studied, miss important topics, and feel overwhelmed by vast syllabi. ExamTrakr solves this with a simple yet powerful exam tracker that shows exactly where you stand.
                    </p>
                    <p className="text-xl font-semibold text-primary">
                      Our mission: Help every Indian student complete their exam syllabus on time and crack their dream exam!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Values */}
          <section className="py-16 bg-accent/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center text-foreground mb-12">What We Stand For</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {values.map((value, index) => (
                  <Card key={index}>
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <value.icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="font-bold text-foreground mb-2">{value.title}</h3>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">50,000+</div>
                  <div className="text-muted-foreground">Students Trust Us</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">150+</div>
                  <div className="text-muted-foreground">Exams Supported</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">5,000+</div>
                  <div className="text-muted-foreground">Topics Tracked</div>
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
                Join 50,000+ Students Using ExamTrakr
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8">
                Start tracking your exam preparation today – it's free!
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/signup">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default About;
