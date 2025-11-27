import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertTriangle, FileText, Clock, Shield, Trash2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function DeleteAccount() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    reason: '',
    confirmed: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.confirmed) {
      toast({
        variant: "destructive",
        title: "Confirmation Required",
        description: "Please confirm that you understand this action is permanent."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-deletion-request', {
        body: formData
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Request Submitted",
        description: "Your account deletion request has been received. We'll process it within 7 business days."
      });
    } catch (error) {
      console.error('Error submitting deletion request:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Unable to submit your request. Please try again or contact support."
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Account & Data Deletion Request</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                ExamTrakr by Shubham Choudhary
              </p>
            </div>

            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                <strong>Warning:</strong> Account deletion is permanent and cannot be undone. All your data will be permanently removed within 7 business days.
              </AlertDescription>
            </Alert>

            {isSubmitted ? (
              <Card className="border-green-500/50 bg-green-500/10">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                    <h2 className="text-2xl font-bold text-foreground">Request Submitted Successfully</h2>
                    <p className="text-muted-foreground max-w-md">
                      Your account deletion request has been received. We will process it within 7 business days. 
                      You will receive a confirmation email once completed.
                    </p>
                    <Button onClick={() => window.location.href = '/'}>
                      Return to Home
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trash2 className="h-5 w-5 text-primary" />
                      Submit Account Deletion Request
                    </CardTitle>
                    <CardDescription>
                      Fill this form with your registered email. Our team will delete your account and data within 7 business days.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Registered Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter your registered email"
                        />
                        <p className="text-xs text-muted-foreground">
                          Use the same email you used to register your ExamTrakr account
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter your phone number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Deletion (Optional)</Label>
                        <Textarea
                          id="reason"
                          value={formData.reason}
                          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="Help us improve by sharing why you're leaving"
                          rows={3}
                        />
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="confirm"
                          checked={formData.confirmed}
                          onCheckedChange={(checked) => 
                            setFormData(prev => ({ ...prev, confirmed: checked as boolean }))
                          }
                        />
                        <Label 
                          htmlFor="confirm" 
                          className="text-sm font-normal leading-tight cursor-pointer"
                        >
                          I understand all my data will be deleted permanently, and this action cannot be undone
                        </Label>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        size="lg"
                        disabled={isSubmitting || !formData.confirmed}
                      >
                        {isSubmitting ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Submit Deletion Request
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Alternative: Email Request
                    </CardTitle>
                    <CardDescription>
                      You can also submit your request via email
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">Contact Email:</p>
                      <a 
                        href="mailto:examtrakr@gmail.com" 
                        className="text-primary hover:underline font-mono text-sm"
                      >
                        examtrakr@gmail.com
                      </a>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Include your registered email address and confirmation in your message.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  What Data Will Be Deleted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-3">
                    Upon request, we will permanently delete the following data:
                  </p>
                  
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Account Information</p>
                      <p className="text-sm text-muted-foreground">Email, password, phone number, and profile settings</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Exam Selections & Progress</p>
                      <p className="text-sm text-muted-foreground">All exam enrollments, topic progress, and study history</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Saved Preferences</p>
                      <p className="text-sm text-muted-foreground">Settings, notifications, and customization data</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Purchase Records</p>
                      <p className="text-sm text-muted-foreground">In-app purchase history and subscription details</p>
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
                      We delete data within <strong>7 business days</strong> of receiving your request.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-sm mb-1">What Data Is Retained</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      For legal and tax compliance purposes, the following may be retained:
                    </p>
                    <Alert className="border-yellow-500/50 bg-yellow-500/10">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-sm">
                        <strong>Transaction Records:</strong> Payment and purchase records may be stored for 
                        <strong> 180 days (6 months)</strong> for legal, tax, and financial compliance requirements.
                      </AlertDescription>
                    </Alert>
                  </div>

                  <div>
                    <p className="font-medium text-sm mb-1">Complete Data Removal</p>
                    <p className="text-sm text-muted-foreground">
                      After the 180-day retention period, all remaining data including transaction records 
                      will be permanently and irreversibly deleted from our systems.
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Active Subscriptions:</strong> Any active subscriptions will be cancelled immediately. 
                    Unused subscription time is non-refundable unless required by law.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Important Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Before Submitting Your Request:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                      <li>Export or save any data you want to keep</li>
                      <li>This action cannot be undone</li>
                      <li>You'll need to create a new account to use ExamTrakr again</li>
                      <li>Active subscriptions will be cancelled</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Developer Information:</p>
                    <p className="text-muted-foreground">
                      ExamTrakr by <strong>Shubham Choudhary</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Need Help?</p>
                    <p className="text-muted-foreground">
                      If you have questions or need assistance, contact us at{' '}
                      <a href="mailto:examtrakr@gmail.com" className="text-primary hover:underline">
                        examtrakr@gmail.com
                      </a>
                    </p>
                  </div>
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
