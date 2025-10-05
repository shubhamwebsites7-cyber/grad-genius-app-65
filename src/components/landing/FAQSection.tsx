import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const FAQSection: React.FC = () => {
  const faqs = [
    {
      question: 'Is Examtrakr completely free to use?',
      answer: 'Yes! Examtrakr offers a generous free plan that includes basic exam tracking, progress monitoring, and topic completion tracking. You can upgrade to Premium for advanced features like detailed analytics, AI insights, and unlimited exam tracking.'
    },
    {
      question: 'Which competitive exams are supported?',
      answer: 'We support 150+ competitive exams including NEET, JEE, IBPS PO, IBPS SO, SBI, SSC CGL, SSC CHSL, UPSC, CAT, GATE, CLAT, NDA, CDS, and many more. New exams are added regularly based on student requests.'
    },
    {
      question: 'How does the AI-powered tracking work?',
      answer: 'Our AI analyzes your study patterns, topic completion rates, and time spent on different subjects. It provides personalized insights, identifies weak areas, predicts your performance, and suggests optimized study plans to maximize your preparation efficiency.'
    },
    {
      question: 'Can I track multiple exams simultaneously?',
      answer: 'Yes! Free users can track up to 3 exams simultaneously, while Premium users get unlimited exam tracking. This is perfect if you\'re preparing for multiple competitive exams or want to keep backup options.'
    },
    {
      question: 'Is my study data secure and private?',
      answer: 'Absolutely! We take data security seriously. All your study data is encrypted and stored securely. We never share your personal information or study patterns with third parties. Your privacy is our top priority.'
    },
    {
      question: 'Can I access Examtrakr offline?',
      answer: 'Yes! Examtrakr is a Progressive Web App (PWA) that works offline once installed. You can track your progress, mark topics as completed, and view your analytics even without an internet connection. Data syncs automatically when you\'re back online.'
    },
    {
      question: 'How is Examtrakr different from other study apps?',
      answer: 'Unlike generic study apps, Examtrakr is specifically designed for competitive exam preparation. We focus on structured topic tracking, exam-specific analytics, progress monitoring, and AI-powered insights tailored for Indian competitive exams.'
    },
    {
      question: 'What happens if I upgrade to Premium later?',
      answer: 'All your existing data is preserved when you upgrade. You\'ll immediately get access to Premium features including advanced analytics, unlimited exams, AI insights, and priority support. You can upgrade or downgrade anytime.'
    }
  ];

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
            Everything you need to know about Examtrakr
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