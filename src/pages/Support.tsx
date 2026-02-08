import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, BookOpen, ArrowLeft } from 'lucide-react';

const Support = () => {
  return (
    <>
      <Helmet>
        <title>Support - ExamTracker | Get Help</title>
        <meta 
          name="description" 
          content="Get help and support for your ExamTracker account. Contact us for technical support, billing questions, or general inquiries." 
        />
        <link rel="canonical" href="/support" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button variant="ghost" asChild className="mb-6">
              <Link to="/profile" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Profile</span>
              </Link>
            </Button>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Support & Help</h1>
              <p className="text-muted-foreground mt-2">
                We're here to help! Choose the best way to get in touch with us.
              </p>
            </div>

            {/* Support Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Email Support */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Email Support</CardTitle>
                  </div>
                  <CardDescription>
                    Get detailed assistance via email
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Send us your questions or issues and we'll get back to you within 24 hours.
                  </p>
                  <Button className="w-full" asChild>
                    <a href="mailto:support@examtrakr.com">
                      Send Email
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Live Chat */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MessageCircle className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Live Chat</CardTitle>
                  </div>
                  <CardDescription>
                    Chat with our support team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get instant help from our support team during business hours (Mon-Fri, 9AM-6PM).
                  </p>
                  <Button className="w-full" variant="outline" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </div>
                <CardDescription>
                  Quick answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">How do I enroll in an exam?</h3>
                  <p className="text-sm text-muted-foreground">
                    Visit the exam page and click the "Enroll in Exam" button. You'll need to be logged in to enroll.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Can I track my progress?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes! Your dashboard shows comprehensive progress tracking for all your enrolled exams, including completed topics and overall progress percentage.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">How do I upgrade my subscription?</h3>
                  <p className="text-sm text-muted-foreground">
                    Go to your Profile page and click "Upgrade Plan" in the Subscription section, or visit our Pricing page.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">How can I reset my password?</h3>
                  <p className="text-sm text-muted-foreground">
                    Visit your Profile page and click the "Change Password" button to update your password securely.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">What payment methods do you accept?</h3>
                  <p className="text-sm text-muted-foreground">
                    We accept all major credit cards, debit cards, and UPI payments for Indian users.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Support;
