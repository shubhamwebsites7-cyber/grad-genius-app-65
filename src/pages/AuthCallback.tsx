import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Handling OAuth callback...');
        console.log('Current URL:', window.location.href);
        console.log('URL hash:', window.location.hash);
        
        // Clear hash from URL immediately to prevent loops
        const hash = window.location.hash;
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Handle OAuth tokens from URL hash
        if (hash && hash.includes('access_token')) {
          console.log('Processing OAuth tokens from hash...');
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            console.log('Setting session with OAuth tokens...');
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (sessionError) {
              console.error('Error setting session:', sessionError);
              navigate('/auth?error=session_failed', { replace: true });
              return;
            } 
            
            if (sessionData.session) {
              console.log('OAuth session set successfully, user:', sessionData.session.user.email);
              // Small delay to ensure session is properly established
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 100);
              return;
            }
          }
        }
        
        // Fallback: check for existing session
        console.log('Checking for existing session...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/auth?error=auth_failed', { replace: true });
          return;
        }

        if (data.session && data.session.user) {
          console.log('Found existing session, user:', data.session.user.email);
          navigate('/', { replace: true });
        } else {
          console.log('No session found, redirecting to auth');
          navigate('/auth', { replace: true });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/auth?error=auth_failed', { replace: true });
      }
    };

    // Process callback immediately
    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
        <p className="text-xs text-muted-foreground mt-2">Processing OAuth callback...</p>
      </div>
    </div>
  );
}
