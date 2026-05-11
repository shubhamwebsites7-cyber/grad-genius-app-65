import { useState, useEffect } from 'react';
import { format, subDays, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, LogOut, ArrowRight, Pencil, X, Check, ChevronDown } from 'lucide-react';
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
  const [period, setPeriod] = useState<'week' | 'month' | '3months' | '6months' | 'year'>('week');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

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

  // Build a 10-cell progress bar ordered high → medium → low
  const orderedTasks = (['high', 'medium', 'low'] as const).flatMap((p) =>
    tasks.filter((t) => t.priority === p)
  );
  const cellPriorityColor = (p: 'high' | 'medium' | 'low') =>
    p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-green-500';
  const progressCells = Array.from({ length: 10 }).map((_, i) => {
    const t = orderedTasks[i];
    const filled = t && t.completed;
    return { filled: !!filled, color: t ? cellPriorityColor(t.priority) : '' };
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

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
      const today = new Date();
      let startDate: Date;
      let mode: 'day' | 'week';

      switch (period) {
        case 'week':
          startDate = subDays(today, 6);
          mode = 'day';
          break;
        case 'month':
          startDate = subDays(today, 29);
          mode = 'day';
          break;
        case '3months':
          startDate = subMonths(today, 3);
          mode = 'week';
          break;
        case '6months':
          startDate = subMonths(today, 6);
          mode = 'week';
          break;
        case 'year':
          startDate = subMonths(today, 12);
          mode = 'week';
          break;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('date, completed')
        .eq('user_id', user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(today, 'yyyy-MM-dd'));

      if (error) throw error;

      const processedData = processProgressData(data || [], startDate, today, mode);
      setProgressData(processedData);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    }
  };

  const processProgressData = (data: any[], startDate: Date, endDate: Date, mode: 'day' | 'week') => {
    if (mode === 'day') {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      return days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTasks = data.filter(task => task.date === dayStr);
        const completed = dayTasks.filter(task => task.completed).length;
        const percentage = Math.min(Math.round((completed / 10) * 100), 100);
        return {
          date: format(day, 'MMM dd'),
          day: format(day, 'EEE dd'),
          percentage,
        };
      });
    }
    const weekStarts = eachWeekOfInterval({ start: startDate, end: endDate });
    return weekStarts.map(weekStart => {
      const weekEnd = endOfWeek(weekStart);
      const completed = data.filter(t => {
        const d = new Date(t.date);
        return t.completed && d >= weekStart && d <= weekEnd;
      }).length;
      const percentage = Math.min(Math.round((completed / 70) * 100), 100);
      return {
        date: format(weekStart, 'MMM dd'),
        day: format(weekStart, 'MMM dd'),
        percentage,
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

      const updatedTasks = [...tasks, data as Task];
      setTasks(updatedTasks);
      setNewTask('');
      
      // Calculate new counts after adding task
      const newCounts = updatedTasks.reduce(
        (acc, task) => {
          acc[task.priority]++;
          return acc;
        },
        { high: 0, medium: 0, low: 0 } as TaskCounts
      );
      
      // Keep same priority if still has room, otherwise find available priority
      if (newCounts[newTaskPriority] < PRIORITY_LIMITS[newTaskPriority]) {
        // Keep current priority
      } else {
        // Find next available priority
        const availablePriority = (['high', 'medium', 'low'] as const).find(
          p => newCounts[p] < PRIORITY_LIMITS[p]
        );
        if (availablePriority) {
          setNewTaskPriority(availablePriority);
        }
      }
      
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

  const copyTaskToNextDay = async (task: Task) => {
    if (!user) return;
    const nextDateObj = addDays(new Date(task.date), 1);
    const nextDate = format(nextDateObj, 'yyyy-MM-dd');
    try {
      const { data: existing, error: checkError } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', nextDate)
        .eq('title', task.title)
        .eq('priority', task.priority)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        toast({
          title: "Already exists",
          description: `"${task.title}" is already on ${format(nextDateObj, 'MMM dd')}`,
        });
        return;
      }

      const { error } = await supabase.from('tasks').insert([
        {
          title: task.title,
          priority: task.priority,
          date: nextDate,
          user_id: user.id,
        },
      ]);
      if (error) throw error;

      toast({
        title: "Copied to next day",
        description: `"${task.title}" added to ${format(nextDateObj, 'MMM dd')}`,
      });
    } catch (error) {
      console.error('Error copying task:', error);
      toast({
        title: "Error",
        description: "Failed to copy task to next day",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, [period]);

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const saveTaskTitle = async () => {
    if (!editingTaskId || !editingTitle.trim()) {
      setEditingTaskId(null);
      return;
    }
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ title: editingTitle.trim() })
        .eq('id', editingTaskId);
      if (error) throw error;
      setTasks(tasks.map(t => (t.id === editingTaskId ? { ...t, title: editingTitle.trim() } : t)));
      setEditingTaskId(null);
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

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
    <div className="min-h-screen bg-background p-2 sm:p-4 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My ToDo</h1>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button className="text-muted-foreground mt-1 text-sm sm:text-base inline-flex items-center gap-1 hover:text-foreground transition-colors">
                {format(selectedDate, 'MMMM do, yyyy')}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${calendarOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0 animate-in fade-in-0 zoom-in-95">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }
                }}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button variant="ghost" onClick={() => signOut()} size="sm">
          <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>

      {/* Progress Overview - 10-cell priority bar */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-bold">
              {Math.min(completedTasks, 10)}/10 tasks
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {Math.round((Math.min(completedTasks, 10) / 10) * 100)}% completed
            </p>
          </div>
          <div className="flex gap-1.5 w-full">
            {progressCells.map((c, i) => (
              <div
                key={i}
                className={`flex-1 h-3 rounded-full transition-colors ${
                  c.filled ? c.color : 'bg-muted'
                }`}
                title={c.filled ? 'Completed' : 'Empty'}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Add New Task */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              Add New Todo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">What needs to be done?</label>
              <Input
                placeholder="Enter your task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="mb-3 sm:mb-4"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
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
                      {editingTaskId === task.id ? (
                        <Input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={saveTaskTitle}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveTaskTitle();
                            if (e.key === 'Escape') setEditingTaskId(null);
                          }}
                          className="flex-1 h-7 text-sm"
                        />
                      ) : (
                        <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                      )}
                      {editingTaskId === task.id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={saveTaskTitle}
                          title="Save"
                          className="h-6 w-6 p-0 text-primary hover:bg-transparent hover:text-primary"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditTask(task)}
                            title="Edit"
                            className="h-6 w-6 p-0 text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyTaskToNextDay(task)}
                            title="Copy to next day"
                            className="h-6 w-6 p-0 text-primary hover:bg-transparent hover:text-primary"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask(task.id)}
                            title="Delete"
                            className="h-6 w-6 p-0 text-destructive hover:bg-transparent hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Chart */}
      <Card className="mt-4 sm:mt-6">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-lg sm:text-xl">Progress Overview</CardTitle>
            <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">1 Week</SelectItem>
                <SelectItem value="month">1 Month</SelectItem>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="6months">6 Months</SelectItem>
                <SelectItem value="year">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${Math.max(500, progressData.length * 60)}px` }}>
              <ChartContainer className="h-56 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                      interval={0}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}