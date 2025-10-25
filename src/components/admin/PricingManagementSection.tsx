import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, DollarSign, Gift, Clock } from 'lucide-react';
import { Database } from '@/integrations/supabase/database.types';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  duration_months: number;
  features: any;
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
}

interface PlanPricing {
  id: string;
  plan_id: string;
  country_code: string;
  currency: string;
  price: number;
  original_price: number | null;
  discount_percentage: number;
  is_active: boolean;
}

interface PlanWithPricing extends SubscriptionPlan {
  pricing: PlanPricing[];
}

interface PricingOffer {
  id: string;
  offer_end_time: string;
  is_active: boolean;
  created_at: string;
}

const COUNTRIES = [
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹' },
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£' },
  { code: 'EU', name: 'European Union', currency: 'EUR', symbol: '€' },
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$' },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$' },
];

export const PricingManagementSection = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanWithPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedPlanForPricing, setSelectedPlanForPricing] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [offer, setOffer] = useState<PricingOffer | null>(null);
  const [offerForm, setOfferForm] = useState({
    hours: 8,
  });

  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    duration_months: 1,
    features: '',
    is_popular: false,
    is_active: true,
  });

  const [pricingForm, setPricingForm] = useState({
    country_code: 'IN',
    price: '',
    original_price: '',
    discount_percentage: 0,
  });

  useEffect(() => {
    fetchPlans();
    fetchActiveOffer();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('duration_months');

      if (plansError) throw plansError;

      // Fetch pricing for all plans
      const { data: pricingData, error: pricingError } = await supabase
        .from('plan_pricing')
        .select('*');

      if (pricingError) throw pricingError;

      // Combine plans with their pricing
      const plansWithPricing: PlanWithPricing[] = (plansData || []).map(plan => ({
        ...plan,
        pricing: (pricingData || []).filter(p => p.plan_id === plan.id),
      }));

      setPlans(plansWithPricing);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription plans.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOffer = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_offers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const offerData = data as unknown as PricingOffer;
        setOffer(offerData);
        const endTime = new Date(offerData.offer_end_time);
        const now = new Date();
        const hoursRemaining = Math.max(0, Math.round((endTime.getTime() - now.getTime()) / (1000 * 60 * 60)));
        setOfferForm({
          hours: hoursRemaining,
        });
      }
    } catch (error) {
      console.error('Error fetching offer:', error);
    }
  };

  const handleUpdateOffer = async () => {
    try {
      setSubmitting(true);
      
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + offerForm.hours);

      const offerData = {
        offer_end_time: endTime.toISOString(),
        is_active: true,
      };

      if (offer) {
        const { error } = await (supabase
          .from('pricing_offers')
          .update as any)(offerData)
          .eq('id', offer.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from('pricing_offers')
          .insert as any)([offerData]);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Limited time offer updated successfully.',
      });

      await fetchActiveOffer();
    } catch (error) {
      console.error('Error updating offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to update offer.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOrUpdatePlan = async () => {
    try {
      setSubmitting(true);

      let features;
      try {
        features = planForm.features ? JSON.parse(planForm.features) : [];
      } catch (e) {
        toast({
          title: 'Error',
          description: 'Invalid JSON format for features.',
          variant: 'destructive',
        });
        return;
      }

      const planData = {
        name: planForm.name,
        description: planForm.description || null,
        duration_months: Number(planForm.duration_months),
        features,
        is_popular: planForm.is_popular,
        is_active: planForm.is_active,
      };

      if (editingPlan) {
        const { error } = await (supabase
          .from('subscription_plans')
          .update as any)(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Plan updated successfully.',
        });
      } else {
        const { error } = await (supabase
          .from('subscription_plans')
          .insert as any)([planData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Plan created successfully.',
        });
      }

      setIsDialogOpen(false);
      resetPlanForm();
      await fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to save plan.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddOrUpdatePricing = async () => {
    if (!selectedPlanForPricing) return;

    try {
      setSubmitting(true);

      const pricingData = {
        plan_id: selectedPlanForPricing,
        country_code: pricingForm.country_code,
        currency: COUNTRIES.find(c => c.code === pricingForm.country_code)?.currency || 'USD',
        price: Number(pricingForm.price),
        original_price: pricingForm.original_price ? Number(pricingForm.original_price) : null,
        discount_percentage: Number(pricingForm.discount_percentage),
        is_active: true,
      };

      // Check if pricing already exists for this plan and country
      const { data: existingPricing } = await supabase
        .from('plan_pricing')
        .select('id')
        .eq('plan_id', selectedPlanForPricing)
        .eq('country_code', pricingForm.country_code)
        .maybeSingle();

      if (existingPricing) {
        const { error } = await (supabase
          .from('plan_pricing')
          .update as any)(pricingData)
          .eq('id', (existingPricing as any).id);

        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from('plan_pricing')
          .insert as any)([pricingData]);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Pricing updated successfully.',
      });

      setIsPricingDialogOpen(false);
      resetPricingForm();
      await fetchPlans();
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast({
        title: 'Error',
        description: 'Failed to save pricing.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This will also delete all associated pricing.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Plan deleted successfully.',
      });

      await fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete plan.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePricing = async (pricingId: string) => {
    if (!confirm('Are you sure you want to delete this pricing?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('plan_pricing')
        .delete()
        .eq('id', pricingId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Pricing deleted successfully.',
      });

      await fetchPlans();
    } catch (error) {
      console.error('Error deleting pricing:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete pricing.',
        variant: 'destructive',
      });
    }
  };

  const resetPlanForm = () => {
    setPlanForm({
      name: '',
      description: '',
      duration_months: 1,
      features: '',
      is_popular: false,
      is_active: true,
    });
    setEditingPlan(null);
  };

  const resetPricingForm = () => {
    setPricingForm({
      country_code: 'IN',
      price: '',
      original_price: '',
      discount_percentage: 0,
    });
    setSelectedPlanForPricing(null);
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      duration_months: plan.duration_months,
      features: JSON.stringify(plan.features, null, 2),
      is_popular: plan.is_popular,
      is_active: plan.is_active,
    });
    setIsDialogOpen(true);
  };

  const openPricingDialog = (planId: string, countryCode?: string) => {
    setSelectedPlanForPricing(planId);
    
    if (countryCode) {
      const plan = plans.find(p => p.id === planId);
      const existingPricing = plan?.pricing.find(p => p.country_code === countryCode);
      
      if (existingPricing) {
        setPricingForm({
          country_code: existingPricing.country_code,
          price: existingPricing.price.toString(),
          original_price: existingPricing.original_price?.toString() || '',
          discount_percentage: existingPricing.discount_percentage,
        });
      }
    }
    
    setIsPricingDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Limited Time Offer Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Limited Time Offer Settings
          </CardTitle>
          <CardDescription>
            Configure the countdown timer duration (discount % is managed in plan pricing above)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hours Remaining
            </Label>
            <Input
              id="hours"
              type="number"
              min="1"
              value={offerForm.hours}
              onChange={(e) => setOfferForm({ ...offerForm, hours: parseInt(e.target.value) || 1 })}
            />
            <p className="text-sm text-muted-foreground">
              Note: Discount percentages are managed in each plan's pricing settings above
            </p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              {offer ? (
                <>Timer ends: {new Date(offer.offer_end_time).toLocaleString()}</>
              ) : (
                'No active offer'
              )}
            </div>
            <Button onClick={handleUpdateOffer} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {offer ? 'Update Offer' : 'Create Offer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Subscription Plans</h2>
          <p className="text-muted-foreground">Manage subscription plans and country-wise pricing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetPlanForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
              <DialogDescription>
                {editingPlan ? 'Update plan details' : 'Add a new subscription plan'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g., Premium Monthly"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Brief description of the plan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Months)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={planForm.duration_months}
                  onChange={(e) => setPlanForm({ ...planForm, duration_months: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="features">Features (JSON Array)</Label>
                <Textarea
                  id="features"
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  placeholder='["Feature 1", "Feature 2", "Feature 3"]'
                  rows={5}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="popular"
                  checked={planForm.is_popular}
                  onCheckedChange={(checked) => setPlanForm({ ...planForm, is_popular: checked })}
                />
                <Label htmlFor="popular">Mark as Popular</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={planForm.is_active}
                  onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdatePlan} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingPlan ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans List */}
      <div className="space-y-6">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.is_popular && <Badge>Popular</Badge>}
                    {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <CardDescription className="mt-2">
                    {plan.description} • {plan.duration_months} {plan.duration_months === 1 ? 'month' : 'months'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(plan)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Country Pricing
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPricingDialog(plan.id)}
                      className="ml-auto"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Pricing
                    </Button>
                  </h4>
                  {plan.pricing.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Country</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Original Price</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plan.pricing.map((pricing) => {
                          const country = COUNTRIES.find(c => c.code === pricing.country_code);
                          return (
                            <TableRow key={pricing.id}>
                              <TableCell>
                                {country?.name} ({pricing.country_code})
                              </TableCell>
                              <TableCell>
                                {country?.symbol}{pricing.price}
                              </TableCell>
                              <TableCell>
                                {pricing.original_price ? `${country?.symbol}${pricing.original_price}` : '-'}
                              </TableCell>
                              <TableCell>
                                {pricing.discount_percentage > 0 ? `${pricing.discount_percentage}%` : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={pricing.is_active ? 'default' : 'secondary'}>
                                  {pricing.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openPricingDialog(plan.id, pricing.country_code)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePricing(pricing.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No pricing configured for this plan</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pricing Dialog */}
      <Dialog open={isPricingDialogOpen} onOpenChange={setIsPricingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add/Update Pricing</DialogTitle>
            <DialogDescription>Set country-specific pricing for this plan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={pricingForm.country_code}
                onValueChange={(value) => setPricingForm({ ...pricingForm, country_code: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name} ({country.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={pricingForm.price}
                onChange={(e) => setPricingForm({ ...pricingForm, price: e.target.value })}
                placeholder="99.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="original_price">Original Price (Optional)</Label>
              <Input
                id="original_price"
                type="number"
                step="0.01"
                value={pricingForm.original_price}
                onChange={(e) => setPricingForm({ ...pricingForm, original_price: e.target.value })}
                placeholder="149.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Discount Percentage</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={pricingForm.discount_percentage}
                onChange={(e) => setPricingForm({ ...pricingForm, discount_percentage: parseInt(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsPricingDialogOpen(false);
              resetPricingForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddOrUpdatePricing} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Pricing'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
