import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Download, CheckSquare, Target, Timer, BarChart3, Settings as SettingsIcon, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { usePWA } from '@/hooks/usePWA';
import { NavigationLink } from '@/components/NavigationLink';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Layout() {
  const { user, signOut } = useAuth();
  const { canInstall, installApp } = usePWA();
  const location = useLocation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  useSmartNotifications();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleInstallClick = async () => {
    try {
      await installApp();
      toast({
        title: "Success",
        description: "App installed successfully! You can now access it from your home screen.",
      });
    } catch (error) {
      toast({
        title: "Installation Failed",
        description: "Unable to install the app. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const navigationItems = [
    { href: '/dashboard/todo', icon: CheckSquare, label: 'Todo' },
    { href: '/dashboard/pomodoro', icon: Timer, label: 'Pomodoro' },
    { href: '/dashboard/analytics', icon: BarChart3, label: 'Journey' },
    { href: '/dashboard/goals', icon: Target, label: 'Goals' },
    { href: '/dashboard/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const ProfileMenu = (
    user ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Open profile menu"
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
          <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
            <SettingsIcon className="h-4 w-4 mr-2" /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button size="sm" onClick={() => navigate('/auth')}>
        <LogIn className="h-4 w-4 mr-1" /> Login
      </Button>
    )
  );

  const Header = (
    <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-14 items-center justify-between px-3 sm:px-4 gap-2">
        <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          GoalGrip
        </h1>
        <div className="flex items-center gap-1 sm:gap-2">
          {canInstall && (
            <Button variant="ghost" size="icon" onClick={handleInstallClick} aria-label="Install app">
              <Download className="h-4 w-4" />
            </Button>
          )}
          <ThemeToggle />
          {ProfileMenu}
        </div>
      </div>
    </header>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {Header}
        <main className="flex-1 pb-20">
          <Outlet />
        </main>
        <footer className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <nav className="flex items-center justify-around h-16 px-2 max-w-md mx-auto overflow-x-auto">
            {navigationItems.map((item) => (
              <NavigationLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={location.pathname === item.href}
              />
            ))}
          </nav>
        </footer>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 pb-4">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}