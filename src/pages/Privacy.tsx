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
                <p className="text-foreground leading-relaxed mb-4">
                  We may collect the following information when you use our platform or app:
                </p>
                <ul className="list-disc pl-6 mb-6 text-foreground">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Exam preferences and progress</li>
                  <li>Device & usage data (analytics)</li>
                  <li>Payment-related information processed securely by Razorpay</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. How We Use Your Information</h2>
                <p className="text-foreground leading-relaxed mb-4">
                  We use your information to:
                </p>
                <ul className="list-disc pl-6 mb-6 text-foreground">
                  <li>Provide and improve ExamTrakr services</li>
                  <li>Manage your account and progress</li>
                  <li>Process secure payments and subscriptions (via Razorpay)</li>
                  <li>Send important updates or notifications (optional)</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. Data Security</h2>
                <p className="text-foreground leading-relaxed mb-4">
                  We use industry-standard security practices.
                  Your data is securely managed using trusted services like:
                </p>
                <ul className="list-disc pl-6 mb-4 text-foreground">
                  <li>Supabase (authentication & database)</li>
                  <li>Razorpay (payments)</li>
                </ul>
                <p className="text-foreground leading-relaxed mb-6">
                  We do not store your full card details on our servers.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Third-Party Services</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  We may use third-party tools such as Supabase, Razorpay, and analytics services.
                  These services process data according to their own privacy policies.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Your Rights</h2>
                <p className="text-foreground leading-relaxed mb-4">
                  You can request to:
                </p>
                <ul className="list-disc pl-6 mb-4 text-foreground">
                  <li>Access your data</li>
                  <li>Update your data</li>
                  <li>Delete your data</li>
                </ul>
                <p className="text-foreground leading-relaxed mb-6">
                  Contact us at{' '}
                  <a href="mailto:examtrakr@gmail.com" className="text-primary hover:underline">
                    examtrakr@gmail.com
                  </a>{' '}
                  for any requests.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">6. Children's Privacy</h2>
                <p className="text-foreground leading-relaxed mb-6">
                  ExamTrakr is not intended for children under 13.
                  If you believe a child has provided personal data, contact us for removal.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">7. Policy Updates</h2>
                <p className="text-foreground leading-relaxed">
                  We may update this privacy policy from time to time.
                  Any changes will be posted on this page.
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
