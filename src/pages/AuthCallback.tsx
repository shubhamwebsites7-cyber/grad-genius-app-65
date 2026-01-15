import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // CRITICAL: Check for existing session FIRST before any code exchange
        // This handles the Android/TWA double-callback issue where the second
        // callback lacks code_verifier but a session already exists
        const { data: existingSession } = await supabase.auth.getSession();
        
        if (existingSession?.session) {
          console.log('Session already exists, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
          return;
        }

        // PKCE flow: Supabase returns `?code=...` which must be exchanged for a session
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('Auth code exchange error:', exchangeError);
            
            // Double-check for session - it might have been created by a parallel callback
            const { data: retrySession } = await supabase.auth.getSession();
            if (retrySession?.session) {
              console.log('Session found after exchange error, redirecting');
              navigate('/dashboard', { replace: true });
              return;
            }
            
            setError(exchangeError.message);
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          // Don't rely on exchangeData.session (it can be null in some environments).
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Auth session read error:', error);
            setError(error.message);
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          if (data.session) {
            navigate('/dashboard', { replace: true });
            return;
          }
        }

        // Implicit flow fallback: tokens are in the URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            console.error('Set session error:', setSessionError);
            
            // Check if session exists anyway
            const { data: retrySession } = await supabase.auth.getSession();
            if (retrySession?.session) {
              navigate('/dashboard', { replace: true });
              return;
            }
            
            setError(setSessionError.message);
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          navigate('/dashboard', { replace: true });
          return;
        }

        // No code or tokens - redirect to login
        navigate('/login', { replace: true });
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        
        // Even on error, check if a session exists before showing error
        const { data: fallbackSession } = await supabase.auth.getSession();
        if (fallbackSession?.session) {
          navigate('/dashboard', { replace: true });
          return;
        }
        
        setError('An unexpected error occurred');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <div className="text-destructive text-lg mb-2">Authentication Error</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
