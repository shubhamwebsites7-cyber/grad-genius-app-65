import React, { createContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  isPremium: boolean;
  planName: string;
  expiresAt: string | null;
  status: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionInfo;
  refreshSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    isPremium: false,
    planName: 'Free Plan',
    expiresAt: null,
    status: 'free'
  });

  const fetchSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const subscriptionData = data as any;
        const plan = subscriptionData.plan || {};
        
        // Check if subscription is still valid
        const expiresAt = new Date(subscriptionData.expires_at);
        const isValid = expiresAt > new Date();

        if (isValid) {
          const displayName = subscriptionData.is_trial 
            ? '🎁 Free Trial' 
            : plan.name || 'Premium Plan';
          
          setSubscription({
            isPremium: true,
            planName: displayName,
            expiresAt: subscriptionData.expires_at,
            status: subscriptionData.is_trial ? 'trial' : 'active'
          });
        } else {
          // Expired subscription
          setSubscription({
            isPremium: false,
            planName: 'Free Plan',
            expiresAt: null,
            status: 'expired'
          });
        }
      } else {
        // No subscription - try to activate free trial
        await activateFreeTrial(userId);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription({
        isPremium: false,
        planName: 'Free Plan',
        expiresAt: null,
        status: 'free'
      });
    }
  };

  const activateFreeTrial = async (userId: string) => {
    try {
      // @ts-expect-error - Custom RPC function not in generated types
      const { data, error } = await supabase.rpc('activate_free_trial', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error activating trial:', error);
        setSubscription({
          isPremium: false,
          planName: 'Free Plan',
          expiresAt: null,
          status: 'free'
        });
        return;
      }

      const trialData = data as any;
      if (trialData && Array.isArray(trialData) && trialData.length > 0 && trialData[0].success) {
        setSubscription({
          isPremium: true,
          planName: '🎁 Free Trial',
          expiresAt: trialData[0].trial_ends_at,
          status: 'trial'
        });
      } else {
        setSubscription({
          isPremium: false,
          planName: 'Free Plan',
          expiresAt: null,
          status: 'free'
        });
      }
    } catch (error) {
      console.error('Error in trial activation:', error);
      setSubscription({
        isPremium: false,
        planName: 'Free Plan',
        expiresAt: null,
        status: 'free'
      });
    }
  };

  const refreshSubscription = async () => {
    if (user) {
      await fetchSubscription(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    let initialized = false;
    
    // Set up auth state listener first
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (!mounted) return;
        
        // Only update if initialized or not INITIAL_SESSION
        if (initialized || event !== 'INITIAL_SESSION') {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Use setTimeout to avoid blocking auth flow
            setTimeout(() => {
              if (mounted) {
                fetchSubscription(session.user.id).catch(err => 
                  console.error('Error fetching subscription:', err)
                );
              }
            }, 0);
          } else {
            setSubscription({
              isPremium: false,
              planName: 'Free Plan',
              expiresAt: null,
              status: 'free'
            });
          }
          
          if (initialized) {
            setLoading(false);
          }
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            await fetchSubscription(session.user.id);
          } catch (error) {
            console.error('Error fetching subscription on init:', error);
          }
        }
        
        initialized = true;
        setLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          initialized = true;
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      authSubscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSubscription({
      isPremium: false,
      planName: 'Free Plan',
      expiresAt: null,
      status: 'free'
    });
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, subscription, refreshSubscription, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};
