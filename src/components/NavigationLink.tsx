import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function NavigationLink({ href, icon: Icon, label, isActive = false, onClick }: NavigationLinkProps) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-colors text-xs font-medium",
        isActive 
          ? "text-primary bg-primary/10" 
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}