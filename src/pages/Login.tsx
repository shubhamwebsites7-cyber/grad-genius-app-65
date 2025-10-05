import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BookOpen, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Login successful!",
          description: "Welcome back to Examtrakr.",
        });
        navigate('/dashboard');
      }
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

  return (
    <>
      <Helmet>
        <title>Login - Examtrakr | Access Your Study Dashboard</title>
        <meta 
          name="description" 
          content="Login to Examtrakr to access your personalized study dashboard, track exam preparation progress, and continue your learning journey." 
        />
        <link rel="canonical" href="/login" />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Login - Examtrakr" />
        <meta property="og:description" content="Access your personalized exam preparation dashboard" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/login" />
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
              <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
              <p className="mt-2 text-muted-foreground">
                Sign in to your account to continue your learning journey
              </p>
            </div>

            {/* Login Form */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                        Remember me
                      </label>
                    </div>

                    <div className="text-sm">
                      <Link
                        to="/forgot-password"
                        className="text-primary hover:text-primary-hover"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>

                <div className="mt-6">
                  <div className="text-center text-sm">
                    <span className="text-muted-foreground">Don't have an account? </span>
                    <Link
                      to="/signup"
                      className="text-primary hover:text-primary-hover font-medium"
                    >
                      Sign up
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
};

export default Login;