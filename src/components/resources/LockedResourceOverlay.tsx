import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LockedResourceOverlayProps {
  onUpgradeClick?: () => void;
}

export const LockedResourceOverlay: React.FC<LockedResourceOverlayProps> = ({ onUpgradeClick }) => {
  return (
    <div className="absolute inset-0 backdrop-blur-[1px] bg-background/15 z-10 flex flex-col items-center justify-center rounded-lg">
      <div className="bg-card/95 backdrop-blur-md p-4 rounded-lg shadow-lg text-center max-w-xs border border-border/50">
        <Lock className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground mb-1">Premium Content</p>
        <p className="text-xs text-muted-foreground mb-3">
          Upgrade to access all resources
        </p>
        <Button asChild size="sm" variant="hero" className="w-full">
          <Link to="/pricing">Upgrade Now</Link>
        </Button>
      </div>
    </div>
  );
};

export const FREE_RESOURCE_LIMIT = 2;
