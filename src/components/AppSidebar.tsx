import { NavLink, useLocation } from 'react-router-dom';
import { CheckSquare, Target, Timer, LogOut, Download, PanelLeft, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { usePWA } from '@/hooks/usePWA';
import { toast } from '@/hooks/use-toast';

const items = [
  { title: 'Todo', url: '/dashboard/todo', icon: CheckSquare },
  { title: 'Pomodoro', url: '/dashboard/pomodoro', icon: Timer },
  { title: 'Journey', url: '/dashboard/analytics', icon: BarChart3 },
  { title: 'Goals', url: '/dashboard/goals', icon: Target },
  { title: 'Settings', url: '/dashboard/settings', icon: SettingsIcon },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { canInstall, installApp } = usePWA();

  const isActive = (url: string) =>
    url === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(url);

  const handleInstall = async () => {
    try {
      await installApp();
      toast({ title: 'Success', description: 'App installed successfully!' });
    } catch {
      toast({ title: 'Installation Failed', description: 'Unable to install.', variant: 'destructive' });
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2 px-1 py-1`}>
          {!collapsed && (
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              GoalGrip
            </h1>
          )}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 shrink-0" aria-label="Toggle sidebar">
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} end={item.url === '/dashboard'} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className={`flex ${collapsed ? 'flex-col items-center' : 'items-center justify-between'} gap-2 p-1`}>
          {!collapsed && user && (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs truncate max-w-[120px]">{user.email}</span>
            </div>
          )}
          <div className={`flex ${collapsed ? 'flex-col' : 'items-center'} gap-1`}>
            <ThemeToggle />
            {canInstall && (
              <Button variant="ghost" size="icon" onClick={handleInstall} className="h-8 w-8" aria-label="Install app">
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => signOut()} className="h-8 w-8" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
