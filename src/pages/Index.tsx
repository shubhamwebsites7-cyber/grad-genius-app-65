import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PromoVideoSection } from '@/components/landing/PromoVideoSection';
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
        <title>ExamTrakr – Track Your Exam Progress & Study Smarter</title>
        <meta 
          name="description" 
          content="Track your exam prep smarter with ExamTrakr — monitor subject progress, access top-quality study resources, and stay exam-ready. Study less, achieve more!" 
        />
        <meta 
          name="keywords" 
          content="exam preparation, exam tracker, study progress tracker, subject wise progress, online exam preparation, competitive exams, smart study platform, exam progress tracking, best exam resources, study planner for students, jee preparation, neet preparation, banking exams india, ssc cgl preparation, upsc preparation, gre preparation, gmat preparation, sat preparation, lsat preparation, track study progress, student productivity, exam study tools, study smart app, learning progress tracker" 
        />
        <meta property="og:title" content="ExamTrakr – Track Your Exam Progress & Study Smarter" />
        <meta property="og:description" content="Track your exam prep smarter with ExamTrakr — monitor subject progress, access top-quality study resources, and stay exam-ready. Study less, achieve more!" />
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
            "description": "ExamTrakr – Track Your Exam Progress & Study Smarter",
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
          <PromoVideoSection />
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