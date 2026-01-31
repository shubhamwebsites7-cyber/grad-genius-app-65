import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useCountryDetection } from '@/hooks/useCountryDetection';

export const FAQSection: React.FC = () => {
  const { isIndia } = useCountryDetection();

  const indiaFaqs = [
    {
      question: 'What is ExamTrakr?',
      answer: 'ExamTrakr is India\'s #1 exam tracker app for students preparing for IBPS, SSC, UPSC, JEE, NEET, and 150+ competitive exams. Track your syllabus topic-wise, monitor preparation progress, and study smarter.'
    },
    {
      question: 'How does the syllabus tracker work?',
      answer: 'Select your exam, browse topic-wise syllabus, and mark topics complete as you study. ExamTrakr shows visual progress bars so you always know how much is complete. Never forget what you studied!'
    },
    {
      question: 'How to complete syllabus on time?',
      answer: 'ExamTrakr helps you complete syllabus by: showing clear topic-wise breakdown, tracking what\'s complete vs pending, visualizing progress with bars, and helping you identify weak subjects that need more focus.'
    },
    {
      question: 'Is ExamTrakr free to use?',
      answer: 'Yes! Start free to explore exams, view syllabi, and track basic progress. Premium unlocks unlimited exam tracking, detailed analytics, and study resources at affordable prices.'
    },
    {
      question: 'Can I prepare without coaching?',
      answer: 'Absolutely! ExamTrakr is designed for self-study. You get complete topic-wise syllabus, progress tracking, free resources, and a clear roadmap. Many students crack government exams using ExamTrakr without coaching.'
    },
    {
      question: 'Is my data safe?',
      answer: 'Yes! Your data is securely stored with encrypted cloud backup. Auto-save ensures you never lose progress. Access from any device – phone, tablet, or laptop.'
    }
  ];

  const globalFaqs = [
    {
      question: 'What is ExamTrakr?',
      answer: 'ExamTrakr is the #1 exam tracker app worldwide for students preparing for SAT, GRE, GMAT, IELTS, TOEFL, and 100+ global exams. Track your syllabus topic-wise, monitor preparation progress, and study smarter.'
    },
    {
      question: 'How does the syllabus tracker work?',
      answer: 'Select your exam, browse topic-wise syllabus, and mark topics complete as you study. ExamTrakr shows visual progress bars so you always know how much is complete. Never forget what you studied!'
    },
    {
      question: 'Which exams does ExamTrakr support?',
      answer: 'ExamTrakr supports 100+ global exams including SAT, ACT, GRE, GMAT, IELTS, TOEFL, CFA, PMP, AWS certifications, CPA, LSAT, MCAT, and many more standardized tests and professional certifications.'
    },
    {
      question: 'Is ExamTrakr free to use?',
      answer: 'Yes! Start free to explore exams, view syllabi, and track basic progress. Premium unlocks unlimited exam tracking, detailed analytics, and study resources at affordable prices.'
    },
    {
      question: 'Can I use ExamTrakr for professional certifications?',
      answer: 'Absolutely! ExamTrakr supports professional certifications like CFA, PMP, AWS, Google Cloud, Microsoft Azure, CPA, and more. Track your certification prep just like any academic exam.'
    },
    {
      question: 'Is my data safe and accessible anywhere?',
      answer: 'Yes! Your data is securely stored with encrypted cloud backup. Auto-save ensures you never lose progress. Access from any device – phone, tablet, or laptop – from anywhere in the world.'
    }
  ];

  const faqs = isIndia ? indiaFaqs : globalFaqs;

  return (
    <section className="py-24 bg-gradient-to-b from-accent/30 to-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-4">
            <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
              Got Questions?
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about ExamTrakr
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-card border border-border rounded-lg px-6 hover:border-primary/50 transition-colors"
            >
              <AccordionTrigger className="text-left hover:no-underline py-5">
                <span className="text-lg font-semibold text-foreground pr-4">
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <a 
            href="mailto:support@examtrakr.com" 
            className="text-primary hover:text-primary-hover font-semibold underline-offset-4 hover:underline"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  );
};
