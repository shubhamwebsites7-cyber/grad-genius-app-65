import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  FileText, 
  CreditCard, 
  Settings, 
  User, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  Check,
  X,
  TrendingUp,
  Award,
  DollarSign,
  Activity,
  AlertCircle,
  Loader2,
  ClipboardList,
  MessageSquare,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AnalyticsSection } from "@/components/admin/AnalyticsSection";
import { ExamRequestsSection } from "@/components/admin/ExamRequestsSection";
import { FeedbackSection } from "@/components/admin/FeedbackSection";
import { EnhancedResourcesSection } from "@/components/admin/EnhancedResourcesSection";
import { PricingManagementSection } from "@/components/admin/PricingManagementSection";
import { SubscriptionsManagementSection } from "@/components/admin/SubscriptionsManagementSection";
import { UsersManagementSection } from "@/components/admin/UsersManagementSection";

interface Stats {
  totalUsers: number;
  totalExams: number;
  totalSubjects: number;
  totalTopics: number;
  totalResources: number;
  pendingResources: number;
  activeSubscriptions: number;
}

interface UserData {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  is_active: boolean;
}

interface ExamData {
  id: string;
  name: string;
  enrollment_count: number;
  is_active: boolean;
  category_id?: string;
}

interface ResourceData {
  id: string;
  title: string;
  resource_type: string;
  topic_id: string;
  contributed_by_user_id: string;
  admin_approved: boolean;
  created_at: string;
  url: string;
  topics?: {
    name: string;
    subjects?: {
      name: string;
    };
  };
  users?: {
    full_name: string;
  };
}

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalExams: 0,
    totalSubjects: 0,
    totalTopics: 0,
    totalResources: 0,
    pendingResources: 0,
    activeSubscriptions: 0,
  });
  
  const [users, setUsers] = useState<any[]>([]);
  const [exams, setExams] = useState<ExamData[]>([]);
  const [pendingResources, setPendingResources] = useState<ResourceData[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Check if user has admin role using the has_role function
      const { data, error } = await (supabase.rpc as any)('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error) {
        console.error('Error checking admin role:', error);
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive'
        });
        navigate('/dashboard');
        return;
      }

      if (!data) {
        toast({
          title: 'Access Denied',
          description: 'You do not have administrator privileges.',
          variant: 'destructive'
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error in admin check:', error);
      navigate('/dashboard');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats in parallel
      const [
        usersCount,
        examsCount,
        subjectsCount,
        topicsCount,
        resourcesCount,
        pendingResourcesCount,
        subscriptionsCount,
        usersData,
        examsWithEnrollments,
        pendingResourcesData
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('exams').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('topics').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('topic_resources').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('admin_approved', true),
        supabase.from('topic_resources').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('admin_approved', false),
        supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('users').select('id, full_name, email, created_at, is_active, phone_number, country_code').eq('is_active', true).order('created_at', { ascending: false }).limit(10),
        supabase.from('exams').select('id, name, is_active').eq('is_active', true),
        supabase.from('topic_resources').select(`
          id,
          title,
          resource_type,
          topic_id,
          contributed_by_user_id,
          admin_approved,
          created_at,
          topics (
            name,
            subjects (
              name
            )
          ),
          users (
            full_name
          )
        `).eq('is_active', true).eq('admin_approved', false).order('created_at', { ascending: false })
      ]);

      // Fetch enrollment counts for each exam
      const examsData = await Promise.all(
        (examsWithEnrollments.data || []).map(async (exam) => {
          const { count } = await supabase
            .from('user_exam_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id)
            .eq('is_active', true);
          
          return {
            ...exam,
            enrollment_count: count || 0
          };
        })
      );

      // Sort exams by enrollment count
      examsData.sort((a, b) => b.enrollment_count - a.enrollment_count);

      // Fetch enrollment count for each user
      const usersWithEnrollments = await Promise.all(
        (usersData.data || []).map(async (user) => {
          const { count } = await supabase
            .from('user_exam_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_active', true);
          
          return {
            ...user,
            enrollment_count: count || 0
          };
        })
      );

      setStats({
        totalUsers: usersCount.count || 0,
        totalExams: examsCount.count || 0,
        totalSubjects: subjectsCount.count || 0,
        totalTopics: topicsCount.count || 0,
        totalResources: resourcesCount.count || 0,
        pendingResources: pendingResourcesCount.count || 0,
        activeSubscriptions: subscriptionsCount.count || 0,
      });

      setUsers(usersWithEnrollments);
      setExams(examsData.slice(0, 10)); // Top 10 exams by enrollment
      setPendingResources(pendingResourcesData.data || []);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data.',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleApproveResource = async (resourceId: string) => {
    try {
      const { error } = await (supabase
        .from('topic_resources')
        .update as any)({ admin_approved: true })
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Resource approved successfully.',
      });

      await fetchDashboardData();
    } catch (error) {
      console.error('Error approving resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve resource.',
        variant: 'destructive'
      });
    }
  };

  const handleRejectResource = async (resourceId: string) => {
    try {
      const { error } = await (supabase
        .from('topic_resources')
        .update as any)({ is_active: false })
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Resource rejected.',
      });

      await fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject resource.',
        variant: 'destructive'
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Sidebar navigation items
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Users Management', icon: Users },
    { id: 'exams', label: 'Exams Management', icon: BookOpen },
    { id: 'exam-requests', label: 'Exam Requests', icon: ClipboardList },
    { id: 'resources', label: 'Resources', icon: FileText },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'pricing', label: 'Pricing Management', icon: DollarSign },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalExams}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalSubjects} subjects, {stats.totalTopics} topics
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resources</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalResources}</div>
                  {stats.pendingResources > 0 && (
                    <Badge variant="outline" className="mt-1 bg-warning/10 text-warning">
                      {stats.pendingResources} pending
                    </Badge>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeSubscriptions.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Resources Alert */}
            {stats.pendingResources > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have {stats.pendingResources} pending resource{stats.pendingResources !== 1 ? 's' : ''} awaiting approval.
                  <Button 
                    variant="link" 
                    className="ml-2 p-0 h-auto"
                    onClick={() => setActiveSection('resources')}
                  >
                    Review now →
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Top Exams */}
            <Card>
              <CardHeader>
                <CardTitle>Top Enrolled Exams</CardTitle>
                <CardDescription>Most popular exams by enrollment count</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam Name</TableHead>
                      <TableHead>Enrollments</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.name}</TableCell>
                        <TableCell>{exam.enrollment_count.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={exam.is_active ? 'default' : 'secondary'}>
                            {exam.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case 'analytics':
        return <AnalyticsSection />;

      case 'exam-requests':
        return <ExamRequestsSection />;

      case 'feedback':
        return <FeedbackSection />;

      case 'users':
        return <UsersManagementSection />;

      case 'exams':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Exams Management</h2>
                <p className="text-muted-foreground">Manage exams, subjects, and topics</p>
              </div>
              <Button onClick={() => navigate('/add-exam')}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Exam
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam Name</TableHead>
                      <TableHead>Enrollments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.name}</TableCell>
                        <TableCell>{exam.enrollment_count.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={exam.is_active ? 'default' : 'secondary'}>
                            {exam.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/exam/${exam.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case 'resources':
        return <EnhancedResourcesSection />;

      case 'pricing':
        return <PricingManagementSection />;

      case 'subscriptions':
        return <SubscriptionsManagementSection />;

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Settings</h2>
              <p className="text-muted-foreground">Manage application settings and configurations</p>
            </div>
            
            <Card>
              <CardContent className="p-12 text-center">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Application Settings</h3>
                <p className="text-muted-foreground">Configuration options coming soon.</p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isAdmin && !loading) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Examtrakr</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <TooltipProvider>
        <div className="min-h-screen flex w-full">
          {/* Fixed Sidebar */}
          <aside 
            className={`fixed left-0 top-0 h-screen border-r bg-card z-40 transition-all duration-300 hidden lg:flex flex-col ${
              sidebarCollapsed ? 'w-16' : 'w-64'
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Logo and Header */}
              <div className={`p-4 border-b flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                <Link to="/" className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Examtrakr
                    </span>
                  )}
                </Link>
              </div>

              {/* Toggle Button */}
              <div className={`px-3 py-2 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className={sidebarCollapsed ? 'w-10 h-10 p-0' : 'w-full justify-start'}
                >
                  {sidebarCollapsed ? (
                    <PanelLeft className="h-4 w-4" />
                  ) : (
                    <>
                      <PanelLeftClose className="h-4 w-4 mr-2" />
                      <span className="text-sm">Collapse</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Admin Panel Label */}
              {!sidebarCollapsed && (
                <div className="px-6 py-2">
                  <h2 className="text-lg font-bold text-foreground">Admin Panel</h2>
                </div>
              )}

              {/* Navigation Items - Scrollable */}
              <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  const buttonContent = (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                    </button>
                  );

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.id} delayDuration={0}>
                        <TooltipTrigger asChild>
                          {buttonContent}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-popover text-popover-foreground border">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return buttonContent;
                })}
              </nav>

              {/* Logout Button */}
              <div className={`p-3 border-t ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
                {sidebarCollapsed ? (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleLogout}
                        className="w-10 h-10"
                      >
                        <LogOut className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover text-popover-foreground border">
                      Logout
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">Logout</span>
                  </Button>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content - with left margin for fixed sidebar */}
          <main 
            className={`flex-1 overflow-y-auto transition-all duration-300 ${
              sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
            }`}
          >
            <div className="min-h-screen p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      </TooltipProvider>
    </>
  );
};

export default AdminDashboard;