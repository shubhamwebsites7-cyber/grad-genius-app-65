import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const Refund = () => {
  return (
    <>
      <Helmet>
        <title>Refund & Cancellation Policy - ExamTrakr</title>
        <meta name="description" content="Read the Refund & Cancellation Policy for ExamTrakr. Understand our refund and cancellation terms." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">Refund & Cancellation Policy</h1>
              <p className="text-muted-foreground">Last updated: 2024</p>
            </div>

            <Card>
              <CardContent className="p-8 prose prose-lg max-w-none">
                <p className="text-foreground leading-relaxed mb-6">
                  We want you to have a smooth and transparent experience with ExamTrakr.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Subscription Plans</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  ExamTrakr offers free and paid plans. Paid plans grant access to premium exams and features.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. Refund Policy</h2>
                <ul className="list-disc pl-6 mb-6 text-foreground">
                  <li>
                    If a payment is made and you do not receive access within 24 hours, please contact us at{' '}
                    <a href="mailto:examtrakr@gmail.com" className="text-primary hover:underline">
                      examtrakr@gmail.com
                    </a>.
                  </li>
                  <li>
                    In case of duplicate payment or technical error, we will process a full refund within 7 working days.
                  </li>
                  <li>Refunds will be issued only to the original payment method used.</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. Cancellations</h2>
                <ul className="list-disc pl-6 mb-6 text-foreground">
                  <li>
                    You can cancel your subscription anytime, but partial or mid-term refunds are not applicable once the service has been used.
                  </li>
                  <li>If you face issues, please contact our support for resolution.</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Payment Gateway</h2>
                <p className="text-foreground leading-relaxed">
                  All transactions are securely processed through Razorpay, which ensures your financial data is safe.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Refund;
