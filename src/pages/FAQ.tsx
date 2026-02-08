import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Link } from 'react-router-dom';

const FAQ = () => {
  const faqs = [
    {
      question: 'What is ExamTracker?',
      answer: 'ExamTracker is a smart exam tracker app designed for Indian students preparing for competitive and government exams like IBPS, SSC, UPSC, JEE, NEET, CTET. It helps you track topic-wise syllabus, monitor preparation progress, and stay organized throughout your exam preparation journey.'
    },
    {
      question: 'How does the syllabus tracker work?',
      answer: 'Our syllabus tracker shows you the complete topic-wise syllabus for your exam. As you study each topic, mark it as complete. ExamTracker shows your progress with visual progress bars, so you always know how much syllabus is complete and what\'s remaining.'
    },
    {
      question: 'How to track exam syllabus effectively?',
      answer: 'With ExamTracker, tracking exam syllabus is simple: 1) Select your exam, 2) Browse topic-wise syllabus organized by subjects, 3) Mark topics complete as you study, 4) Monitor progress bars to see completion percentage. This helps you complete syllabus on time!'
    },
    {
      question: 'Is ExamTracker free to use?',
      answer: 'Yes! ExamTracker offers a free plan where you can explore all exams, view complete topic-wise syllabus, and track basic progress. Premium features like unlimited exam tracking, detailed analytics, and study resources are available with our affordable subscription plans.'
    },
    {
      question: 'Which exams does ExamTracker support?',
      answer: 'ExamTracker supports 150+ exams including Banking (IBPS PO, IBPS Clerk, SBI PO, RBI), SSC (CGL, CHSL, MTS), UPSC (CSE, CDS, NDA), Railway (RRB NTPC, Group D), Teaching (CTET, State TETs), and Entrance exams (JEE, NEET, GATE, CAT). We add new exams regularly!'
    },
    {
      question: 'How to complete exam syllabus on time?',
      answer: 'The key is consistent tracking. With ExamTracker\'s exam tracker, you can: see exactly how much syllabus is complete, identify weak subjects that need more attention, set daily goals and track consistency, and plan revision before exam day. Visual progress keeps you motivated!'
    },
    {
      question: 'Can I prepare for government exams without coaching?',
      answer: 'Absolutely! ExamTracker is designed to help self-study students succeed. You get complete topic-wise syllabus, progress tracking, free study resources, and a clear roadmap. Many students have cracked government exams using ExamTracker without expensive coaching.'
    },
    {
      question: 'How to manage when syllabus is too big?',
      answer: 'This is the #1 problem students face. ExamTracker solves this by: breaking syllabus into small topics, showing progress for each subject separately, helping you track what\'s complete vs pending, and giving you a clear picture of where you stand. No more overwhelm!'
    },
    {
      question: 'Do I need to download any app?',
      answer: 'ExamTracker works directly in your browser – no download needed! You can also install it as a PWA (Progressive Web App) on your mobile or desktop for offline access. It\'s available on Android via Google Play Store too.'
    },
    {
      question: 'Is my study progress data safe?',
      answer: 'Absolutely! Your data is securely stored with encrypted cloud backup. Auto-save ensures you never lose progress. Access your data from any device – phone, tablet, or laptop. Your privacy is our priority.'
    },
    {
      question: 'How is ExamTracker different from other apps?',
      answer: 'ExamTracker focuses specifically on syllabus tracking and progress monitoring for Indian competitive exams. Unlike general study apps, we provide exam-specific topic-wise syllabus, visual progress tracking, and features designed for how Indian students prepare for exams.'
    },
    {
      question: 'Can I track multiple exams at once?',
      answer: 'Yes! With ExamTracker Premium, you can track unlimited exams simultaneously. This is perfect if you\'re preparing for multiple exams like IBPS PO + SSC CGL, or JEE + board exams. See progress for all exams from your dashboard.'
    }
  ];

  // FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://examtrakr.com" },
      { "@type": "ListItem", "position": 2, "name": "FAQ", "item": "https://examtrakr.com/faq" }
    ]
  };

  return (
    <>
      <Helmet>
        <title>FAQ – Exam Tracker Questions Answered | ExamTracker</title>
        <meta name="description" content="Frequently asked questions about ExamTracker exam tracker app. Learn how to track exam syllabus, monitor progress, complete syllabus on time for IBPS, SSC, UPSC, JEE, NEET." />
        <meta name="keywords" content="exam tracker FAQ, how to track exam syllabus, syllabus tracker questions, exam preparation help, how to complete syllabus on time, ExamTracker help" />
        <meta property="og:title" content="FAQ – Exam Tracker Questions Answered | ExamTracker" />
        <meta property="og:description" content="Get answers to common questions about ExamTracker exam tracker and syllabus tracking." />
        <meta property="og:url" content="https://examtrakr.com/faq" />
        <link rel="canonical" href="https://examtrakr.com/faq" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Breadcrumb */}
            <nav className="text-sm text-muted-foreground mb-6">
              <Link to="/" className="hover:text-primary">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">FAQ</span>
            </nav>

            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">Frequently Asked Questions</h1>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about ExamTrakr exam tracker
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold text-foreground">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                Still have questions about our exam tracker?
              </p>
              <Link
                to="/contact"
                className="text-primary hover:underline font-medium"
              >
                Contact our support team
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FAQ;
