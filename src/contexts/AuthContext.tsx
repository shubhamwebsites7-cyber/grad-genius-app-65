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
        // No subscription
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
    
    // Set up auth state listener first
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            await fetchSubscription(session.user.id);
          } catch (error) {
            console.error('Error fetching subscription on auth change:', error);
          }
        } else {
          setSubscription({
            isPremium: false,
            planName: 'Free Plan',
            expiresAt: null,
            status: 'free'
          });
        }
        
        setLoading(false);
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
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
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
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

  return (
    <AuthContext.Provider value={{ user, session, loading, subscription, refreshSubscription, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
