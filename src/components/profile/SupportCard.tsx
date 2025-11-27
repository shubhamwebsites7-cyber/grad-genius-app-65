import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, ExternalLink, AlertTriangle } from 'lucide-react';

export const SupportCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Support & Help</CardTitle>
        <CardDescription>
          Get assistance with your account
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/support" className="flex items-center space-x-2">
            <HelpCircle className="h-4 w-4" />
            <span>Need billing or tech support?</span>
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Link>
        </Button>
        
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link to="/faq">
            <HelpCircle className="h-4 w-4 mr-2" />
            <span>FAQ</span>
          </Link>
        </Button>

        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" asChild>
          <Link to="/delete-account">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>Delete Account</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
