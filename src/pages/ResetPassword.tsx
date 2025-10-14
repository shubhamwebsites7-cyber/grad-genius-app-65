import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BookOpen, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if we have a valid session for password reset
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setIsValidSession(false);
        } else if (session) {
          setIsValidSession(true);
        } else {
          // Try to get session from URL hash (for email links)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');
          
          if (accessToken && refreshToken && type === 'recovery') {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (sessionError) {
              console.error('Set session error:', sessionError);
              setIsValidSession(false);
            } else {
              setIsValidSession(true);
            }
          } else {
            setIsValidSession(false);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setIsValidSession(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await updatePassword(formData.password);

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message || "Failed to reset password. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Password updated successfully!",
        description: "Your password has been reset. You can now login with your new password.",
      });
      
      // Redirect to login page after successful password reset
      setTimeout(() => {
        navigate('/login');
      }, 2000);
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
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isCheckingSession) {
    return (
      <>
        <Helmet>
          <title>Reset Password - Examtrakr</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Verifying reset link...</p>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (!isValidSession) {
    return (
      <>
        <Helmet>
          <title>Invalid Reset Link - Examtrakr</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
              <div className="text-center">
                <Link to="/" className="inline-flex items-center space-x-2 mb-6">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <span className="text-2xl font-bold text-foreground">Examtrakr</span>
                </Link>
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-foreground">Invalid Reset Link</h1>
                <p className="mt-2 text-muted-foreground">
                  This password reset link is invalid or has expired.
                </p>
              </div>
              
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The reset link may have expired or already been used.
                    </p>
                    <div className="space-y-2">
                      <Link to="/forgot-password">
                        <Button variant="hero" size="lg" className="w-full">
                          Request new reset link
                        </Button>
                      </Link>
                      <Link to="/login">
                        <Button variant="outline" size="lg" className="w-full">
                          Back to login
                        </Button>
                      </Link>
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

  return (
    <>
      <Helmet>
        <title>Reset Password - Examtrakr | Set Your New Password</title>
        <meta 
          name="description" 
          content="Set your new Examtrakr password. Enter a secure password to regain access to your account." 
        />
        <link rel="canonical" href="/reset-password" />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Reset Password - Examtrakr" />
        <meta property="og:description" content="Set your new Examtrakr password" />
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
              <h1 className="text-3xl font-bold text-foreground">Set new password</h1>
              <p className="mt-2 text-muted-foreground">
                Enter a strong password to secure your account.
              </p>
            </div>

            {/* Reset Password Form */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary mr-2" />
                  New Password
                </CardTitle>
                <CardDescription className="text-center">
                  Choose a secure password that you haven't used before.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 pr-10"
                        placeholder="Enter new password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10 pr-10"
                        placeholder="Confirm new password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    <p className="font-medium mb-1">Password requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>At least 6 characters long</li>
                      <li>Use a unique password you haven't used before</li>
                      <li>Consider using a mix of letters, numbers, and symbols</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating password...' : 'Update password'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm text-primary hover:text-primary-hover"
                  >
                    Remember your password? Sign in
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

export default ResetPassword;
