import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BookOpen, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(email);

      if (error) {
        // Handle rate limiting gracefully
        const errorMessage = error.message?.includes('rate limit') 
          ? "Too many reset requests. Please wait a few minutes before trying again."
          : error.message || "Failed to send reset email. Please try again.";
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      setIsEmailSent(true);
      toast({
        title: "Reset email sent!",
        description: "Check your email for password reset instructions.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password - Examtrakr | Reset Your Password</title>
        <meta 
          name="description" 
          content="Reset your Examtrakr password. Enter your email address to receive password reset instructions." 
        />
        <link rel="canonical" href="/forgot-password" />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Forgot Password - Examtrakr" />
        <meta property="og:description" content="Reset your Examtrakr password" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            {/* Logo and Header */}
            <div className="text-center">
              <Link to="/" className="inline-flex items-center space-x-2 mb-6">
                <BookOpen className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-foreground">Examtrakr</span>
              </Link>
              <h1 className="text-3xl font-bold text-foreground">
                {isEmailSent ? 'Check your email' : 'Forgot your password?'}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {isEmailSent 
                  ? "We've sent password reset instructions to your email address."
                  : "No worries! Enter your email address and we'll send you reset instructions."
                }
              </p>
            </div>

            {/* Form or Success Message */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-center">
                  {isEmailSent ? (
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  ) : (
                    <Mail className="h-6 w-6 text-primary mr-2" />
                  )}
                  {isEmailSent ? 'Email Sent' : 'Reset Password'}
                </CardTitle>
                <CardDescription className="text-center">
                  {isEmailSent 
                    ? 'Follow the instructions in your email to reset your password.'
                    : 'Enter your email address below to receive reset instructions.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isEmailSent ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={email}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder="Enter your email address"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="hero"
                      size="lg"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending...' : 'Send reset instructions'}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Reset instructions have been sent to <strong>{email}</strong>
                      </p>
                    </div>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      <p>Didn't receive the email? Check your spam folder or</p>
                      <Button
                        variant="link"
                        className="p-0 h-auto font-normal"
                        onClick={() => {
                          setIsEmailSent(false);
                          setEmail('');
                        }}
                      >
                        try again with a different email
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm text-primary hover:text-primary-hover"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to login
                  </Link>
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

export default ForgotPassword;
