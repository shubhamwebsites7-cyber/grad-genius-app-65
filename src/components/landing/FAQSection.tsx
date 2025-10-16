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
      question: 'What is ExamTrakr?',
      answer: 'ExamTrakr is a smart web app to prepare for exams like IBPS, NEET, JEE, and more — track your learning, access resources, and stay organized.'
    },
    {
      question: 'Is ExamTrakr free to use?',
      answer: 'Yes! You can start free — explore exams and topics, then upgrade for full access when ready.'
    },
    {
      question: 'Do I need to download any app?',
      answer: 'No need — ExamTrakr works directly on your browser. You can also install it as a PWA on mobile or desktop.'
    },
    {
      question: 'Can I track my study progress?',
      answer: 'Yes! Every topic you study can be marked complete to visualize your progress.'
    },
    {
      question: 'Is ExamTrakr available for all exams?',
      answer: 'We\'re adding new exams regularly — from banking and government to engineering and medical entrances.'
    },
    {
      question: 'Is my data safe?',
      answer: 'Absolutely. Your data is securely stored and managed through Supabase with encrypted access.'
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