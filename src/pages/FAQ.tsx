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

const FAQ = () => {
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
    <>
      <Helmet>
        <title>FAQ - ExamTrakr</title>
        <meta name="description" content="Frequently asked questions about ExamTrakr. Find answers to common questions about our exam preparation platform." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">Frequently Asked Questions</h1>
              <p className="text-xl text-muted-foreground">
                Find answers to common questions about ExamTrakr
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold text-foreground">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                Still have questions?
              </p>
              <a
                href="/contact"
                className="text-primary hover:underline font-medium"
              >
                Contact our support team
              </a>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FAQ;
