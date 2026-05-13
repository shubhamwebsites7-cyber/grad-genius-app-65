import { NavLink, useLocation } from 'react-router-dom';
import { Utensils, Weight, CheckSquare, Target, Dumbbell, Timer } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Calories', url: '/dashboard', icon: Utensils },
  { title: 'Weight', url: '/dashboard/weight', icon: Weight },
  { title: 'Todo', url: '/dashboard/todo', icon: CheckSquare },
  { title: 'Goals', url: '/dashboard/goals', icon: Target },
  { title: 'Exercise', url: '/dashboard/exercise', icon: Dumbbell },
  { title: 'Pomodoro', url: '/dashboard/pomodoro', icon: Timer },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname } = useLocation();
  const isActive = (url: string) =>
    url === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
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
    </Sidebar>
  );
}