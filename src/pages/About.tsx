import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Target, Users } from 'lucide-react';

const About = () => {
  return (
    <>
      <Helmet>
        <title>About Us - ExamTrakr</title>
        <meta name="description" content="Learn more about ExamTrakr, an online exam and test-practice platform designed to help students prepare smarter and track their performance effectively." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">About ExamTrakr</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Welcome to ExamTrakr!
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <BookOpen className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Practice Unlimited</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Practice unlimited topic-wise or full-length exams to master your subjects.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Target className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Analyze Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Get detailed results and difficulty insights to track your progress.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Learn from Mistakes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Receive instant feedback and topic analysis to improve continuously.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="prose prose-lg max-w-none">
                  <p className="text-foreground leading-relaxed mb-4">
                    ExamTrakr is a modern, easy-to-use online exam and test-practice platform designed to help students prepare smarter and track their performance effectively.
                  </p>
                  <p className="text-foreground leading-relaxed mb-4">
                    We aim to make learning simple, accessible, and engaging for everyone — whether you're preparing for competitive exams, school tests, or self-learning assessments.
                  </p>
                  <p className="text-foreground leading-relaxed mb-6">
                    Our mission is to empower learners through technology and data-driven preparation tools that improve real-world results.
                  </p>
                  <p className="text-xl font-semibold text-primary text-center">
                    Let's learn, track, and grow — together!
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

export default About;
