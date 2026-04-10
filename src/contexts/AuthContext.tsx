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
        
        // Check if subscription is still valid - must be active status AND not expired
        const expiresAt = new Date(subscriptionData.expires_at);
        const isValid = subscriptionData.status === 'active' && expiresAt > new Date();

        if (isValid) {
          setSubscription({
            isPremium: true,
            planName: plan.name || 'Premium Plan',
            expiresAt: subscriptionData.expires_at,
            status: 'active'
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
        // No subscription found
        setSubscription({
          isPremium: false,
          planName: 'Free Plan',
          expiresAt: null,
          status: 'free'
        });
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

  const refreshSubscription = async () => {
    if (user) {
      await fetchSubscription(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const resetSubscriptionState = () => {
      setSubscription({
        isPremium: false,
        planName: 'Free Plan',
        expiresAt: null,
        status: 'free',
      });
    };

    // 1) Listen for auth changes (OAuth redirect will trigger SIGNED_IN here)
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (import.meta.env.DEV) {
        // Avoid logging sensitive auth details in production
        console.log('[Auth] state:', event);
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        // Defer non-auth DB calls to avoid blocking the auth flow
        setTimeout(() => {
          if (!mounted) return;
          fetchSubscription(session.user.id).catch((err) => {
            console.error('Error fetching subscription:', err);
          });
        }, 0);
      } else {
        resetSubscriptionState();
      }
    });

    // 2) Hydrate existing session on first load
    (async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error && import.meta.env.DEV) {
          console.error('Error getting session:', error);
        }

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          await fetchSubscription(session.user.id);
        } else {
          resetSubscriptionState();
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error initializing auth:', error);
        }
        if (mounted) setLoading(false);
      }
    })();

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
