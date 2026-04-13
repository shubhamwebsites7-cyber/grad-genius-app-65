import React, { useState, useEffect, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, X, Home, User, BarChart3, CreditCard, LogOut, Download, UserCircle, BookOpen, Smartphone, Timer } from 'lucide-react';
import examtrackerIcon from '@/assets/srcassetsexamtracker-icon.jpeg';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.examtrakr.android';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { useCountryDetection } from '@/hooks/useCountryDetection';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Exams', href: '/exams', icon: BookOpen },
  { name: 'Pomodoro', href: '/pomodoro', icon: Timer },
  { name: 'Pricing', href: '/pricing', icon: CreditCard },
  { name: 'Profile', href: '/profile', icon: User, desktopOnly: true },
];

// Memoized components for better performance
const Logo = memo(() => (
  <Link to="/" className="flex items-center space-x-2">
    <img src={examtrackerIcon} alt="ExamTracker" className="h-8 w-8 rounded-lg" />
    <span className="text-xl font-bold text-foreground">ExamTracker</span>
  </Link>
));
Logo.displayName = 'Logo';

const MobileLogo = memo(() => (
  <Link to="/" className="flex items-center space-x-2">
    <img src={examtrackerIcon} alt="ExamTracker" className="h-8 w-8 rounded-lg" />
    <span className="text-lg font-bold text-foreground">ExamTracker</span>
  </Link>
));
MobileLogo.displayName = 'MobileLogo';

const InstallButton = memo(({ onClick, isMobile }: { onClick: () => void; isMobile: boolean }) => (
  <Button 
    variant={isMobile ? "ghost" : "outline"} 
    size={isMobile ? "sm" : "sm"} 
    onClick={onClick}
  >
    <Download className="h-4 w-4" />
    {!isMobile && <span className="ml-2">Install App</span>}
  </Button>
));
InstallButton.displayName = 'InstallButton';

export const Navigation = memo(() => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const { countryName } = useCountryDetection();
  const navigate = useNavigate();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isAndroidApp = document.referrer.includes('android-app://');
    
    if (isStandalone || isIOSStandalone || isAndroidApp) {
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    setDeferredPrompt(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  if (!isMobile) {
    return (
      <header className="bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />

            <div className="hidden md:flex items-center space-x-8">
              {navItems.filter(item => !(item as any).mobileOnly).map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
              >
                <Smartphone className="h-4 w-4" />
                Download App
              </a>
              <ThemeToggle />
              {showInstallButton && (
                <InstallButton onClick={handleInstallClick} isMobile={false} />
              )}
              {!user ? (
                <>
                  <Button variant="outline" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button variant="hero" asChild>
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          <UserCircle className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background z-50">
                    <DropdownMenuLabel>My Account {countryName && `(${countryName})`}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col space-y-4">
                {navItems.filter(item => !(item as any).mobileOnly).map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="pt-4 border-t border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Theme</span>
                    <ThemeToggle />
                  </div>
                  {showInstallButton && (
                    <Button variant="outline" className="w-full" onClick={handleInstallClick}>
                      <Download className="h-4 w-4 mr-2" />
                      Install App
                    </Button>
                  )}
                  {!user ? (
                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" asChild>
                        <Link to="/login">Login</Link>
                      </Button>
                      <Button variant="hero" asChild>
                        <Link to="/signup">Sign Up</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" asChild className="justify-start">
                        <Link to="/profile">
                          <User className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Link>
                      </Button>
                      <Button variant="ghost" onClick={handleSignOut} className="justify-start text-destructive">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>
    );
  }

  return (
    <>
      <header className="bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50 shadow-sm">
        <div className="flex justify-between items-center h-16 px-4">
          <MobileLogo />
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            {showInstallButton && (
              <InstallButton onClick={handleInstallClick} isMobile={true} />
            )}
            {!user ? (
              <Button variant="hero" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-full p-1">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        <UserCircle className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background z-50">
                  <DropdownMenuLabel className="text-xs">My Account {countryName && `(${countryName})`}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer text-sm">
                      <User className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-sm text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border/50 z-50 shadow-lg">
        <nav className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'text-primary bg-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
});

Navigation.displayName = 'Navigation';
