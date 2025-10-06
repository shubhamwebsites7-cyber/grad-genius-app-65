import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const Privacy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - ExamTrakr</title>
        <meta name="description" content="Read the Privacy Policy for ExamTrakr. Learn how we collect, use, and protect your personal information." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: 2024</p>
            </div>

            <Card>
              <CardContent className="p-8 prose prose-lg max-w-none">
                <p className="text-foreground leading-relaxed mb-6">
                  ExamTrakr values your privacy and is committed to protecting your personal information.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Information We Collect</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  We may collect your name, email, phone number, and usage data when you create an account or interact with our platform.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. How We Use Your Information</h2>
                <ul className="list-disc pl-6 mb-6 text-foreground">
                  <li>To provide and improve our services</li>
                  <li>To process payments and subscriptions securely via Razorpay</li>
                  <li>To send important updates, offers, or notifications (you can opt out anytime)</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. Data Security</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  We use industry-standard security measures and trusted third-party services like Supabase and Razorpay to keep your information safe.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Third-Party Services</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  Our payment gateway partner, Razorpay, may collect and process your payment information securely as per their own privacy policies.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Your Rights</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  You can request to access, update, or delete your data anytime by contacting{' '}
                  <a href="mailto:examtrakr@gmail.com" className="text-primary hover:underline">
                    examtrakr@gmail.com
                  </a>.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">6. Policy Updates</h2>
                <p className="text-foreground leading-relaxed">
                  We may revise this policy occasionally. Any changes will be posted on this page.
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

export default Privacy;
