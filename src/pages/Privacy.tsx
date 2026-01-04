import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Lock, Database, Mail } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Privacy Policy
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 4, 2026</p>
          </div>

          {/* Introduction */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-primary" />
              Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              GoalGrip ("we", "our", or "us") operates the GoalGrip mobile application and web service 
              (the "Service"). This page informs you of our policies regarding the collection, use, 
              and disclosure of personal data when you use our Service and the choices you have 
              associated with that data.
            </p>
          </section>

          {/* Data Collection */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-primary" />
              Information We Collect
            </h2>
            <div className="bg-muted/50 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Account Information</h3>
                <p className="text-muted-foreground">
                  Email address and name (for authentication and personalization)
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Health & Wellness Data</h3>
                <p className="text-muted-foreground">
                  Calorie intake, weight measurements, exercise logs, goals, and tasks that you voluntarily enter
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Usage Data</h3>
                <p className="text-muted-foreground">
                  App usage patterns to improve our service (no personal data is sold or shared)
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Data */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Data</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                To provide and maintain our Service
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                To sync your data across devices
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                To track your progress and provide insights
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                To improve and personalize your experience
              </li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <p className="text-muted-foreground leading-relaxed">
                We use industry-standard encryption and security measures to protect your data. 
                Your information is stored on secure servers with row-level security policies 
                ensuring only you can access your personal data. We never sell, trade, or 
                transfer your personal information to third parties.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal data only for as long as necessary to provide you with our 
              Service and as described in this Privacy Policy. You can request deletion of your 
              account and all associated data at any time by contacting us.
            </p>
          </section>

          {/* Your Rights */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Access and download your data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Request correction of inaccurate data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Request deletion of your account and data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Opt-out of promotional communications
              </li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service is not intended for use by children under the age of 13. We do not 
              knowingly collect personal information from children under 13. If you are a parent 
              or guardian and you are aware that your child has provided us with personal data, 
              please contact us.
            </p>
          </section>

          {/* Changes */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any 
              changes by posting the new Privacy Policy on this page and updating the 
              "Last updated" date.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-primary" />
              Contact Us
            </h2>
            <div className="bg-muted/50 rounded-xl p-6">
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <p className="mt-4 font-medium">
                Email: <a href="mailto:privacy@goalgrip.app" className="text-primary hover:underline">privacy@goalgrip.app</a>
              </p>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link to="/">
            <Button variant="outline" size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t mt-12">
        <div className="max-w-4xl mx-auto text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} GoalGrip. All rights reserved.
        </div>
      </footer>
    </div>
  );
}