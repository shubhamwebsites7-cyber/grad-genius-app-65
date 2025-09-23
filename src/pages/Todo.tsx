import { useState, useEffect } from 'react';
import { format, subDays, subMonths, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, LogOut } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart-simple';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  date: string;
}

interface TaskCounts {
  high: number;
  medium: number;
  low: number;
}

const PRIORITY_LIMITS = {
  high: 3,
  medium: 3,
  low: 4
};

export default function Todo() {
  const { signOut, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('low');
  const [loading, setLoading] = useState(false);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('weekly');

  const taskCounts: TaskCounts = tasks.reduce(
    (acc, task) => {
      acc[task.priority]++;
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as TaskCounts
  );

  const completedCounts: TaskCounts = tasks.reduce(
    (acc, task) => {
      if (task.completed) {
        acc[task.priority]++;
      }
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as TaskCounts
  );

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchProgressData();
    }
  }, [selectedDate, user]);

  const fetchTasks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', format(selectedDate, 'yyyy-MM-dd'))
        .order('created_at', { ascending: true });

      if (error) throw error;

      setTasks((data || []) as Task[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressData = async () => {
    if (!user) return;

    try {
      let startDate: Date;
      let interval: string;

      switch (activeTab) {
        case 'weekly':
          startDate = startOfWeek(subDays(selectedDate, 7));
          interval = 'day';
          break;
        case 'monthly':
          startDate = subMonths(selectedDate, 1);
          interval = 'day';
          break;
        case '3months':
          startDate = subMonths(selectedDate, 3);
          interval = 'week';
          break;
        default:
          startDate = startOfWeek(subDays(selectedDate, 7));
          interval = 'day';
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('date, completed')
        .eq('user_id', user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(selectedDate, 'yyyy-MM-dd'));

      if (error) throw error;

      // Process data for chart
      const processedData = processProgressData(data || [], startDate, selectedDate, interval);
      setProgressData(processedData);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    }
  };

  const processProgressData = (data: any[], startDate: Date, endDate: Date, interval: string) => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTasks = data.filter(task => task.date === dayStr);
      const completed = dayTasks.filter(task => task.completed).length;
      const total = dayTasks.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        date: format(day, interval === 'day' ? 'MMM dd' : 'MMM dd'),
        day: format(day, 'EEE'),
        percentage
      };
    });
  };

  const addTask = async () => {
    if (!newTask.trim() || !user) return;

    // Check priority limits
    if (taskCounts[newTaskPriority] >= PRIORITY_LIMITS[newTaskPriority]) {
      toast({
        title: "Limit reached",
        description: `You can only add ${PRIORITY_LIMITS[newTaskPriority]} ${newTaskPriority} priority tasks per day`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: newTask,
            priority: newTaskPriority,
            date: format(selectedDate, 'yyyy-MM-dd'),
            user_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setTasks([...tasks, data as Task]);
      setNewTask('');
      setNewTaskPriority('low');
      
      toast({
        title: "Success",
        description: "Task added successfully",
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed } : task
      ));

      fetchProgressData(); // Refresh progress data
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.filter(task => task.id !== taskId));
      
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, [activeTab]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My ToDo</h1>
          <p className="text-muted-foreground mt-1">
            {format(selectedDate, 'MMMM do, yyyy')}
          </p>
        </div>
        <Button variant="ghost" onClick={() => signOut()}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Progress Overview */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{Math.min(completedTasks, 10)}/10 tasks</h2>
            <p className="text-muted-foreground">
              {Math.round((Math.min(completedTasks, 10) / 10) * 100)}% completed
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardContent className="pt-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Add New Task */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Todo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">What needs to be done?</label>
              <Input
                placeholder="Enter your task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="mb-4"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Priority Level</label>
              <Select value={newTaskPriority} onValueChange={(value) => setNewTaskPriority(value as 'high' | 'medium' | 'low')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low Priority ({taskCounts.low}/{PRIORITY_LIMITS.low})</SelectItem>
                  <SelectItem value="medium">🟡 Medium Priority ({taskCounts.medium}/{PRIORITY_LIMITS.medium})</SelectItem>
                  <SelectItem value="high">🔴 High Priority ({taskCounts.high}/{PRIORITY_LIMITS.high})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={addTask} className="w-full" disabled={!newTask.trim()}>
              Add Todo
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tasks by Priority */}
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        {(['high', 'medium', 'low'] as const).map((priority) => (
          <Card key={priority} className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm ${getPriorityColor(priority)} capitalize flex items-center gap-2`}>
                {getPriorityEmoji(priority)} {priority} Priority
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {completedCounts[priority]}/{taskCounts[priority]} completed
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {taskCounts[priority]}/{PRIORITY_LIMITS[priority]}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.filter(task => task.priority === priority).length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No {priority} priority tasks yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add up to {PRIORITY_LIMITS[priority]} tasks
                  </p>
                </div>
              ) : (
                tasks
                  .filter(task => task.priority === priority)
                  .map((task) => (
                    <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg border">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) => toggleTask(task.id, checked as boolean)}
                      />
                      <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTask(task.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        ×
                      </Button>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Chart */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="3months">3 Months</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}