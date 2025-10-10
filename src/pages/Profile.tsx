import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ProfileInfoCard } from '@/components/profile/ProfileInfoCard';
import { SubscriptionCard } from '@/components/profile/SubscriptionCard';
import { SupportCard } from '@/components/profile/SupportCard';
import { ProfileLoadingSkeleton } from '@/components/profile/ProfileLoadingSkeleton';

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    country_code: '',
    timezone: '',
    created_at: '',
    is_email_verified: false,
  });

  const [subscriptionData, setSubscriptionData] = useState({
    plan: 'Free Plan',
    status: 'Active',
    nextBilling: '-',
    price: '$0/month'
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchSubscriptionData();
    }
  }, [user]);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment_status');
    if (paymentStatus === 'success') {
      toast({
        title: "Payment Successful! 🎉",
        description: "Your subscription has been activated. Enjoy premium features!",
      });
      // Remove query parameter
      setSearchParams({});
      // Refresh subscription data
      fetchSubscriptionData();
    } else if (paymentStatus === 'failed') {
      toast({
        title: "Payment Failed",
        description: "Your payment could not be processed. Please try again.",
        variant: "destructive",
      });
      setSearchParams({});
    }
  }, [searchParams]);

  const fetchProfileData = async () => {
    try {
      console.log('Current user ID:', user?.id);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      console.log('Query error:', error);
      console.log('Query data:', data);

      if (error) throw error;

      if (data) {
        const userData = data as any;
        setProfileData({
          full_name: userData.full_name || '',
          email: userData.email || '',
          country_code: userData.country_code || 'US',
          timezone: userData.timezone || 'UTC',
          created_at: userData.created_at || '',
          is_email_verified: userData.is_email_verified || false,
        });
      } else {
        console.warn('No user data found - RLS policy may be blocking access');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const subscriptionData = data as any;
        const plan = subscriptionData.plan || {};
        setSubscriptionData({
          plan: plan.name || 'Free Plan',
          status: subscriptionData.status || 'Active',
          nextBilling: subscriptionData.expires_at ? new Date(subscriptionData.expires_at).toLocaleDateString() : '-',
          price: plan.name || '$0/month'
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('users')
        // @ts-ignore - Supabase type inference issue
        .update({
          full_name: profileData.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      setIsEditing(false);
      setHasChanges(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Profile - Examtrakr | Manage Your Account</title>
          <meta 
            name="description" 
            content="Manage your Examtrakr profile, view achievements, and update your account settings." 
          />
          <link rel="canonical" href="/profile" />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <ProfileLoadingSkeleton />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profile - Examtrakr | Manage Your Account</title>
        <meta 
          name="description" 
          content="Manage your Examtrakr profile, view achievements, and update your account settings." 
        />
        <link rel="canonical" href="/profile" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="/profile" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        <main className="flex-1 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Profile</h1>
              <p className="text-muted-foreground mt-2">
                Manage your account, subscription, and preferences.
              </p>
            </div>

            {/* Two-column layout on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column / Top on Mobile - Profile Information */}
              <div className="lg:col-span-2 space-y-6">
                <ProfileInfoCard
                  profileData={profileData}
                  isEditing={isEditing}
                  hasChanges={hasChanges}
                  onEdit={() => setIsEditing(true)}
                  onSave={handleSaveProfile}
                  onChange={handleChange}
                />
              </div>

              {/* Right Column / Below on Mobile - Subscription & Support */}
              <div className="space-y-6">
                <SubscriptionCard subscriptionData={subscriptionData} />
                <SupportCard />
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Profile;