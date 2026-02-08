import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const Terms = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service - ExamTracker</title>
        <meta name="description" content="Read the Terms of Service for ExamTracker. Understand your rights and responsibilities when using our platform." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: 2024</p>
            </div>

            <Card>
              <CardContent className="p-8 prose prose-lg max-w-none">
                <p className="text-foreground leading-relaxed mb-6">
                  Welcome to ExamTrakr! By using our website and services, you agree to the following terms and conditions. Please read them carefully before proceeding.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  By accessing or using ExamTrakr, you agree to be bound by these Terms and our Privacy Policy.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. Use of Services</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  You agree to use ExamTrakr only for lawful purposes. Misuse, spamming, or attempting to breach our systems is strictly prohibited.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. Account Responsibility</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  You are responsible for maintaining the confidentiality of your login credentials and any activities that occur under your account.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Payments and Plans</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  Premium features may require a paid subscription. All payments are securely processed via Razorpay. You agree to provide accurate billing information.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Refund Policy</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  Please refer to our Refund & Cancellation Policy for details on refunds.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">6. Intellectual Property</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  All content, design, and features of ExamTrakr are owned by ExamTrakr and protected under applicable copyright laws.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">7. Changes to Terms</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  We may update these Terms at any time. Continued use of our website after changes means you accept the updated Terms.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">8. Contact Information</h2>
                <p className="text-foreground leading-relaxed">
                  For any questions, reach us at{' '}
                  <a href="mailto:examtrakr@gmail.com" className="text-primary hover:underline">
                    examtrakr@gmail.com
                  </a>.
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

export default Terms;
