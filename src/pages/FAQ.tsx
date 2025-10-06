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
      answer: 'ExamTrakr is an online platform where students can take topic-wise and full-length exams, check performance reports, and improve based on difficulty analysis.'
    },
    {
      question: 'Is ExamTrakr free to use?',
      answer: 'Yes, many features are free! You can also upgrade to a paid plan for unlimited exams and detailed performance analytics.'
    },
    {
      question: 'How can I access all topics or exams?',
      answer: 'After logging in, simply choose your subject and start taking tests. Premium users get access to all subjects and advanced reports.'
    },
    {
      question: 'How can I purchase the premium plan?',
      answer: 'You can make a secure payment through Razorpay using any UPI, card, or wallet once the plan is live.'
    },
    {
      question: 'What happens if my payment fails?',
      answer: 'If your payment fails but the amount is deducted, it is automatically refunded by Razorpay within 5–7 working days.'
    },
    {
      question: 'How can I contact support?',
      answer: 'You can email us at examtrakr@gmail.com or call/WhatsApp +91 9302418061.'
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
