import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PopularExamsSection } from '@/components/landing/PopularExamsSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Examtrakr - Smart Exam Preparation Tracker for IBPS, NEET, JEE & Competitive Exams</title>
        <meta 
          name="description" 
          content="Track your exam preparation progress with Examtrakr. AI-powered platform for IBPS PO, NEET, JEE, SSC, UPSC & competitive exams. Get analytics, study insights & achieve success with personalized study plans." 
        />
        <meta 
          name="keywords" 
          content="exam tracker, exam preparation, IBPS PO, NEET, JEE, SSC, UPSC, CAT, GATE, student progress tracker, competitive exams, study analytics, exam planner" 
        />
        <meta property="og:title" content="Examtrakr - Smart Exam Preparation Tracker" />
        <meta property="og:description" content="AI-powered exam tracking platform for IBPS, NEET, JEE & competitive exams. Track progress, get analytics, and achieve academic success." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://examtrakr.com/" />
        <link rel="canonical" href="/" />
        
        {/* Structured Data for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Examtrakr",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "description": "Smart exam preparation tracker for competitive exams",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "5000"
            }
          })}
        </script>
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        <main className="flex-1">
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <PopularExamsSection />
          <StatsSection />
          <TestimonialsSection />
          <TrustSection />
          <FAQSection />
          <CTASection />
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Index;