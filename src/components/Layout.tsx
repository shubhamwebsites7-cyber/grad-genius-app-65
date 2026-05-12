import { Outlet, useLocation } from 'react-router-dom';
import { Utensils, Weight, Download, CheckSquare, Target, Dumbbell, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { usePWA } from '@/hooks/usePWA';
import { NavigationLink } from '@/components/NavigationLink';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Layout() {
  console.log("Layout component is rendering - changes are working!");
  const { user, signOut } = useAuth();
  const { canInstall, installApp } = usePWA();
  const location = useLocation();

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
    { href: '/dashboard', icon: Utensils, label: 'Calories' },
    { href: '/dashboard/weight', icon: Weight, label: 'Weight' },
    { href: '/dashboard/todo', icon: CheckSquare, label: 'Todo' },
    { href: '/dashboard/goals', icon: Target, label: 'Goals' },
    { href: '/dashboard/exercise', icon: Dumbbell, label: 'Exercise' },
    { href: '/dashboard/pomodoro', icon: Timer, label: 'Pomodoro' },
  ];

  const currentPage = navigationItems.find(item => item.href === location.pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              GoalGrip
            </h1>
          </div>

          {/* Desktop Navigation - in header */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <NavigationLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={location.pathname === item.href}
                textOnly
              />
            ))}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            
            {canInstall && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleInstallClick}
                className="text-muted-foreground hover:text-foreground"
              >
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Install App</span>
              </Button>
            )}
            
            {user && (
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu - Removed since bottom nav is available */}
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-4">
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile only */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 md:hidden">
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