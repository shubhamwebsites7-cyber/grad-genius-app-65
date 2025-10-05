import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resend'>('verifying');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token || type !== 'email') {
        setStatus('error');
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        });

        if (error) throw error;

        // Update user verification status
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('users')
            // @ts-ignore - Supabase type inference issue
            .update({ is_email_verified: true })
            .eq('id', user.id);
        }

        setStatus('success');
        toast({
          title: 'Email Verified',
          description: 'Your email has been successfully verified.',
        });

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } catch (error: any) {
        console.error('Error verifying email:', error);
        setStatus('error');
        toast({
          title: 'Verification Failed',
          description: error.message || 'Failed to verify email. The link may have expired.',
          variant: 'destructive',
        });
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  const handleResendVerification = async () => {
    try {
      setResending(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('No user email found');
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      toast({
        title: 'Verification Email Sent',
        description: 'Please check your email for the verification link.',
      });
      setStatus('resend');
    } catch (error: any) {
      console.error('Error resending verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend verification email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Verify Email - Examtrakr</title>
        <meta name="description" content="Verify your email address to activate your Examtrakr account." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {status === 'verifying' && <Loader2 className="h-16 w-16 animate-spin text-primary" />}
                {status === 'success' && <CheckCircle className="h-16 w-16 text-success" />}
                {status === 'error' && <XCircle className="h-16 w-16 text-destructive" />}
                {status === 'resend' && <Mail className="h-16 w-16 text-primary" />}
              </div>
              <CardTitle>
                {status === 'verifying' && 'Verifying Your Email'}
                {status === 'success' && 'Email Verified!'}
                {status === 'error' && 'Verification Failed'}
                {status === 'resend' && 'Check Your Email'}
              </CardTitle>
              <CardDescription>
                {status === 'verifying' && 'Please wait while we verify your email address...'}
                {status === 'success' && 'Your email has been successfully verified. Redirecting to dashboard...'}
                {status === 'error' && 'The verification link may have expired or is invalid.'}
                {status === 'resend' && 'A new verification link has been sent to your email.'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {status === 'error' && (
                <>
                  <Button
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="w-full"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/login')}
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </>
              )}
              
              {status === 'success' && (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              )}

              {status === 'resend' && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/profile')}
                  className="w-full"
                >
                  Go to Profile
                </Button>
              )}
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default VerifyEmail;
