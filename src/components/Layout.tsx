import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Home, Calendar, BarChart3, Weight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { NavigationLink } from '@/components/NavigationLink';

export function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const navigationItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/calendar', icon: Calendar, label: 'Calendar' },
    { href: '/progress', icon: BarChart3, label: 'Progress' },
    { href: '/weight', icon: Weight, label: 'Weight' },
  ];

  const currentPage = navigationItems.find(item => item.href === location.pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              TrackMyCalories
            </h1>
          </div>

          <div className="flex items-center space-x-4">
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
                  Sign out
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-card/95 backdrop-blur">
            <nav className="px-4 py-2 space-y-1">
              {navigationItems.map((item) => (
                <NavigationLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => setIsMenuOpen(false)}
                />
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Bottom Navigation - Desktop/Mobile */}
      <footer className="border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <nav className="flex items-center justify-around h-16 px-4 max-w-md mx-auto md:max-w-2xl">
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