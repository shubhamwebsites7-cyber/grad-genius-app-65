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
import { useCountryDetection } from '@/hooks/useCountryDetection';

const Index = () => {
  const { isIndia } = useCountryDetection();

  // Dynamic SEO content based on country
  const seoContent = isIndia ? {
    title: "ExamTrakr – Best Exam Tracker App for Government & Competitive Exams",
    description: "ExamTrakr is India's #1 exam tracker app. Track your exam syllabus topic-wise, monitor preparation progress, and study smarter for IBPS, SSC, UPSC, JEE, NEET & more government exams.",
    keywords: "exam tracker, exam tracker app, syllabus tracker, exam preparation app, government exam preparation, exam progress tracker, study tracker for exams, competitive exam preparation, online exam preparation, exam planning app, syllabus tracker app, exam preparation planner app, study planner for exams, topic wise syllabus tracker, exam wise syllabus, best exam tracking app, how to track exam syllabus, preparation tracker for government exams, IBPS preparation, SSC CGL preparation, UPSC preparation, JEE preparation, NEET preparation",
    ogLocale: "en_IN",
    currency: "INR"
  } : {
    title: "ExamTrakr – Best Exam Tracker App for SAT, GRE, IELTS & Global Exams",
    description: "ExamTrakr is the #1 exam tracker app worldwide. Track your syllabus topic-wise, monitor preparation progress, and study smarter for SAT, ACT, GRE, GMAT, IELTS, TOEFL, CFA & more global exams.",
    keywords: "exam tracker, exam tracker app, syllabus tracker, exam preparation app, study tracker for exams, competitive exam preparation, online exam preparation, exam planning app, SAT preparation, GRE preparation, GMAT preparation, IELTS preparation, TOEFL preparation, ACT preparation, CFA exam tracker, PMP exam tracker, AWS certification tracker, study planner for exams, best exam tracking app, how to track exam syllabus, exam preparation progress app",
    ogLocale: "en_US",
    currency: "USD"
  };

  // SEO structured data for WebApplication
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ExamTrakr",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web, Android, iOS",
    "description": isIndia 
      ? "ExamTrakr is the best exam tracker app for Indian students. Track your exam syllabus, monitor preparation progress, and study smarter for government and competitive exams."
      : "ExamTrakr is the best exam tracker app worldwide. Track your exam syllabus, monitor preparation progress, and study smarter for SAT, GRE, IELTS, TOEFL and global exams.",
    "url": "https://examtrakr.com",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": seoContent.currency
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "5000",
      "bestRating": "5"
    },
    "author": {
      "@type": "Organization",
      "name": "ExamTrakr"
    }
  };

  // SEO structured data for Organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ExamTrakr",
    "url": "https://examtrakr.com",
    "logo": "https://examtrakr.com/examtrakr.png",
    "sameAs": [
      "https://www.youtube.com/@ExamTrakr",
      "https://t.me/Examtrakr",
      "https://www.instagram.com/examtrakr/"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-9302418061",
      "contactType": "customer service",
      "availableLanguage": isIndia ? ["English", "Hindi"] : ["English"]
    }
  };

  // FAQ Schema for rich snippets - Dynamic based on country
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": isIndia ? [
      {
        "@type": "Question",
        "name": "What is ExamTrakr?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ExamTrakr is a smart exam tracker app for Indian students preparing for government exams, competitive exams like IBPS, SSC, UPSC, JEE, NEET. Track your syllabus, monitor progress, and study smarter."
        }
      },
      {
        "@type": "Question",
        "name": "How does the exam syllabus tracker work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ExamTrakr provides topic-wise syllabus for each exam. Mark topics as complete, track your progress with visual progress bars, and never forget what you studied."
        }
      },
      {
        "@type": "Question",
        "name": "Is ExamTrakr free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! ExamTrakr offers free access to explore exams, view syllabus, and track basic progress. Premium features unlock full syllabus tracking and advanced analytics."
        }
      },
      {
        "@type": "Question",
        "name": "Which exams does ExamTrakr support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ExamTrakr supports 150+ exams including Banking (IBPS PO, IBPS Clerk, SBI PO), SSC (CGL, CHSL, MTS), UPSC, State PSC, Teaching (CTET, TET), Railway, and entrance exams like JEE, NEET, GATE."
        }
      }
    ] : [
      {
        "@type": "Question",
        "name": "What is ExamTrakr?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ExamTrakr is the best exam tracker app for students worldwide. Track your syllabus, monitor preparation progress, and study smarter for SAT, GRE, GMAT, IELTS, TOEFL, and professional certifications."
        }
      },
      {
        "@type": "Question",
        "name": "How does the exam syllabus tracker work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ExamTrakr provides topic-wise syllabus for each exam. Mark topics as complete, track your progress with visual progress bars, and never forget what you studied."
        }
      },
      {
        "@type": "Question",
        "name": "Is ExamTrakr free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! ExamTrakr offers free access to explore exams, view syllabus, and track basic progress. Premium features unlock full syllabus tracking and advanced analytics."
        }
      },
      {
        "@type": "Question",
        "name": "Which exams does ExamTrakr support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ExamTrakr supports 100+ global exams including SAT, ACT, GRE, GMAT, IELTS, TOEFL, and professional certifications like CFA, PMP, AWS, CPA, LSAT, and many more."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{seoContent.title}</title>
        <meta name="description" content={seoContent.description} />
        <meta name="keywords" content={seoContent.keywords} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoContent.title} />
        <meta property="og:description" content={seoContent.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://examtrakr.com/" />
        <meta property="og:image" content="https://examtrakr.com/examtrakr.png" />
        <meta property="og:site_name" content="ExamTrakr" />
        <meta property="og:locale" content={seoContent.ogLocale} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ExamTrakr – Best Exam Tracker App" />
        <meta name="twitter:description" content={seoContent.description} />
        <meta name="twitter:image" content="https://examtrakr.com/examtrakr.png" />
        
        <link rel="canonical" href="https://examtrakr.com/" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(webAppSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
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
