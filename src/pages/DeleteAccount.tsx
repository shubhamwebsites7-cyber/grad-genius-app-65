import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertTriangle, FileText, Clock, Shield } from 'lucide-react';

export default function DeleteAccount() {
  const handleEmailRequest = () => {
    const subject = encodeURIComponent('Account Deletion Request - ExamTrakr');
    const body = encodeURIComponent(
      'Hello ExamTrakr Support Team,\n\n' +
      'I would like to request the deletion of my ExamTrakr account and all associated data.\n\n' +
      'Account Email: [Your email address]\n' +
      'Reason for deletion (optional): \n\n' +
      'I understand that this action is permanent and cannot be undone.\n\n' +
      'Thank you.'
    );
    window.location.href = `mailto:examtrakr@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <Helmet>
        <title>Delete Account - ExamTrakr</title>
        <meta name="description" content="Request deletion of your ExamTrakr account and associated data. Learn about our account deletion process and data retention policy." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Account Deletion Request</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Submit a request to permanently delete your ExamTrakr account and associated data
              </p>
            </div>

            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                <strong>Warning:</strong> Account deletion is permanent and cannot be undone. All your data will be permanently removed.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  How to Request Account Deletion
                </CardTitle>
                <CardDescription>
                  To request deletion of your ExamTrakr account, please send an email to our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Email Address:</p>
                  <a 
                    href="mailto:examtrakr@gmail.com" 
                    className="text-primary hover:underline font-mono text-sm"
                  >
                    examtrakr@gmail.com
                  </a>
                </div>

                <Button 
                  onClick={handleEmailRequest}
                  className="w-full"
                  size="lg"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Deletion Request via Email
                </Button>

                <div className="text-sm text-muted-foreground space-y-2">
                  <p>When emailing, please include:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your registered email address</li>
                    <li>Confirmation that you want to delete your account</li>
                    <li>Optional: Reason for deletion (helps us improve)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  What Data Will Be Deleted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Personal Information</p>
                      <p className="text-sm text-muted-foreground">Your name, email, phone number, and profile data</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Study Data</p>
                      <p className="text-sm text-muted-foreground">Your exam preferences, progress, notes, and study history</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Account Details</p>
                      <p className="text-sm text-muted-foreground">Login credentials and authentication data</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Data Retention & Processing Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm mb-1">Processing Time</p>
                    <p className="text-sm text-muted-foreground">
                      Account deletion requests are typically processed within 7-14 business days of receiving your request.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-sm mb-1">Data Retention</p>
                    <p className="text-sm text-muted-foreground">
                      Most of your data will be permanently deleted immediately. However, some information may be retained for up to 30 days for:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-2 text-sm text-muted-foreground">
                      <li>Backup system purging</li>
                      <li>Legal compliance requirements</li>
                      <li>Financial record keeping (payment history may be retained for 7 years as required by law)</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium text-sm mb-1">Anonymized Data</p>
                    <p className="text-sm text-muted-foreground">
                      Some aggregated and anonymized analytics data (without any personal identifiers) may be retained for statistical purposes.
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Note:</strong> Active subscriptions will be cancelled upon account deletion. Any remaining subscription period will not be refunded unless required by applicable law.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Before You Delete Your Account</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Please consider the following before submitting your deletion request:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Download any data or notes you want to keep (if applicable)</li>
                    <li>Cancel any active subscriptions to avoid future charges</li>
                    <li>This action cannot be undone - you'll need to create a new account to use ExamTrakr again</li>
                    <li>Alternative: You can temporarily deactivate your account instead of permanently deleting it</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
