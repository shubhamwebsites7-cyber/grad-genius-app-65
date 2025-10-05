import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';

interface SubscriptionCardProps {
  subscriptionData: {
    plan: string;
    status: string;
    nextBilling: string;
    price: string;
  };
}

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'default';
    case 'expired':
      return 'destructive';
    case 'free plan':
      return 'secondary';
    default:
      return 'secondary';
  }
};

export const SubscriptionCard = ({ subscriptionData }: SubscriptionCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>
          Manage your subscription plan and billing
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Plan</span>
            <span className="font-medium">{subscriptionData.plan}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={getStatusBadgeVariant(subscriptionData.status)}>
              {subscriptionData.status}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Next Billing</span>
            <span className="text-sm">{subscriptionData.nextBilling}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-medium">{subscriptionData.price}</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button asChild className="w-full" variant="default">
            <Link to="/pricing" className="flex items-center justify-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Upgrade Plan</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
