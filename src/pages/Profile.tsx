import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileInfoCard } from '@/components/profile/ProfileInfoCard';
import { UnifiedSubscriptionCard } from '@/components/profile/UnifiedSubscriptionCard';
import { SupportCard } from '@/components/profile/SupportCard';
import { ProfileLoadingSkeleton } from '@/components/profile/ProfileLoadingSkeleton';
import { PaymentHistoryCard } from '@/components/profile/PaymentHistoryCard';
import { convertToE164Format, isValidIndianPhoneNumber, extractDisplayNumber } from '@/utils/phoneUtils';

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
    phone_number: '',
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
  }, [user?.id]);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment_status');
    if (paymentStatus === 'success') {
      toast({
        title: "Payment Successful! 🎉",
        description: "Your subscription has been activated. Enjoy premium features!",
      });
      // Remove query parameter
      setSearchParams({});
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
      if (error) throw error;

      if (data) {
        const userData = data as any;
        setProfileData({
          full_name: userData.full_name || '',
          email: userData.email || '',
          phone_number: userData.phone_number ? extractDisplayNumber(userData.phone_number) : '',
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
      // Validate phone number if provided
      let phoneNumberToSave = null;
      if (profileData.phone_number) {
        if (!isValidIndianPhoneNumber(profileData.phone_number)) {
          toast({
            title: "Invalid phone number",
            description: "Please enter a valid 10-digit Indian mobile number.",
            variant: "destructive",
          });
          return;
        }
        // Convert to E.164 format for Cashfree compatibility
        phoneNumberToSave = convertToE164Format(profileData.phone_number);
      }

      const { error } = await supabase
        .from('users')
        // @ts-ignore - Supabase type inference issue
        .update({
          full_name: profileData.full_name,
          phone_number: phoneNumberToSave,
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
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Profile</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your account and preferences
              </p>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <ProfileInfoCard
                  profileData={profileData}
                  isEditing={isEditing}
                  hasChanges={hasChanges}
                  onEdit={() => setIsEditing(true)}
                  onSave={handleSaveProfile}
                  onChange={handleChange}
                />
              </TabsContent>

              <TabsContent value="billing" className="space-y-6">
                <UnifiedSubscriptionCard />
                <PaymentHistoryCard />
              </TabsContent>

              <TabsContent value="support" className="space-y-6">
                <SupportCard />
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Profile;