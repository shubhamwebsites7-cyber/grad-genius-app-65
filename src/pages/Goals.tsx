import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Trash2, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  priority: 'high' | 'medium' | 'low';
}

interface Tip {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

interface Streak {
  id: string;
  current_count: number;
  max_count: number;
  is_active: boolean;
  last_updated: string;
  created_at: string;
  streak_number: number;
  final_count: number;
}

export default function Goals() {
  console.log("Goals component is rendering - updates are working!");
  const { signOut, user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [newGoal, setNewGoal] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTip, setNewTip] = useState('');
  const [newTipDescription, setNewTipDescription] = useState('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  
  // Dropdown states
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showTipForm, setShowTipForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchTips();
      fetchStreaks();
      checkAutoUpdateStreak();
    }
  }, [user]);

  // Check and auto-update streak daily
  const checkAutoUpdateStreak = async () => {
    if (!user) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const activeStreak = streaks.find(s => s.is_active);

      // Auto-update if there's an active streak and it hasn't been updated today
      if (activeStreak && activeStreak.last_updated !== today) {
        const newCount = activeStreak.current_count + 1;
        const { error } = await supabase
          .from('streaks')
          .update({
            current_count: newCount,
            max_count: Math.max(newCount, activeStreak.max_count),
            last_updated: today
          })
          .eq('id', activeStreak.id);

        if (!error) {
          fetchStreaks();
          toast({
            title: "Auto-updated!",
            description: `Strike ${activeStreak.streak_number} - Day ${newCount}`,
          });
        }
      }
    } catch (error) {
      console.error('Error auto-updating streak:', error);
    }
  };

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goal')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setGoals((data || []) as Goal[]);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch goals",
        variant: "destructive",
      });
    }
  };

  const fetchTips = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTips((data || []) as Tip[]);
    } catch (error) {
      console.error('Error fetching tips:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tips",
        variant: "destructive",
      });
    }
  };

  const fetchStreaks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .order('streak_number', { ascending: false });

      if (error) throw error;
      setStreaks((data || []) as Streak[]);
    } catch (error) {
      console.error('Error fetching streaks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch streaks",
        variant: "destructive",
      });
    }
  };

  const addGoal = async () => {
    if (!newGoal.trim() || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('goal')
        .insert([{ 
          title: newGoal.trim(), 
          user_id: user.id,
          completed: false,
          priority: newGoalPriority,
        }])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Goal added successfully:', data);
      setNewGoal('');
      setNewGoalPriority('medium');
      setShowGoalForm(false);
      await fetchGoals();
      
      toast({
        title: "Success",
        description: "Goal added successfully",
      });
    } catch (error: any) {
      console.error('Error adding goal:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add goal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const { error } = await supabase
        .from('goal')
        .update(updates)
        .eq('id', goalId);

      if (error) throw error;

      setGoals(goals.map(goal => 
        goal.id === goalId ? { ...goal, ...updates } : goal
      ));

      setEditingGoal(null);
      
      toast({
        title: "Success",
        description: "Goal updated successfully",
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Error",
        description: "Failed to update goal",
        variant: "destructive",
      });
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goal')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      setGoals(goals.filter(goal => goal.id !== goalId));
      
      toast({
        title: "Success",
        description: "Goal deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
    }
  };

  const addTip = async () => {
    if (!newTip.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('tips')
        .insert([{ 
          title: newTip, 
          description: newTipDescription,
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) throw error;

      setTips([data as Tip, ...tips]);
      setNewTip('');
      setNewTipDescription('');
      setShowTipForm(false);
      
      toast({
        title: "Success",
        description: "Tip added successfully",
      });
    } catch (error) {
      console.error('Error adding tip:', error);
      toast({
        title: "Error",
        description: "Failed to add tip",
        variant: "destructive",
      });
    }
  };

  const updateTip = async (tipId: string, updates: Partial<Tip>) => {
    try {
      const { error } = await supabase
        .from('tips')
        .update(updates)
        .eq('id', tipId);

      if (error) throw error;

      setTips(tips.map(tip => 
        tip.id === tipId ? { ...tip, ...updates } : tip
      ));

      setEditingTip(null);
      
      toast({
        title: "Success",
        description: "Tip updated successfully",
      });
    } catch (error) {
      console.error('Error updating tip:', error);
      toast({
        title: "Error",
        description: "Failed to update tip",
        variant: "destructive",
      });
    }
  };

  const deleteTip = async (tipId: string) => {
    try {
      const { error } = await supabase
        .from('tips')
        .delete()
        .eq('id', tipId);

      if (error) throw error;

      setTips(tips.filter(tip => tip.id !== tipId));
      
      toast({
        title: "Success",
        description: "Tip deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting tip:', error);
      toast({
        title: "Error",
        description: "Failed to delete tip",
        variant: "destructive",
      });
    }
  };

  const updateStreakDaily = async () => {
    if (!user) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const activeStreak = streaks.find(s => s.is_active);

      if (activeStreak && activeStreak.last_updated === today) {
        toast({
          title: "Already updated",
          description: "Streak already updated today",
          variant: "destructive",
        });
        return;
      }

      if (activeStreak) {
        // Update existing active streak
        const newCount = activeStreak.current_count + 1;
        const { error } = await supabase
          .from('streaks')
          .update({
            current_count: newCount,
            max_count: Math.max(newCount, activeStreak.max_count),
            last_updated: today
          })
          .eq('id', activeStreak.id);

        if (error) throw error;
      } else {
        // Create new streak with next streak number
        const maxStreakNumber = Math.max(...streaks.map(s => s.streak_number), 0);
        const { error } = await supabase
          .from('streaks')
          .insert([{
            user_id: user.id,
            current_count: 1,
            max_count: 1,
            last_updated: today,
            streak_number: maxStreakNumber + 1,
            final_count: 0,
            is_active: true
          }]);

        if (error) throw error;
      }

      fetchStreaks();
      toast({
        title: "Success",
        description: "Daily streak updated!",
      });
    } catch (error) {
      console.error('Error updating streak:', error);
      toast({
        title: "Error",
        description: "Failed to update streak",
        variant: "destructive",
      });
    }
  };

  const breakStreak = async (streakId: string) => {
    try {
      const streakToBreak = streaks.find(s => s.id === streakId);
      if (!streakToBreak) return;

      const { error } = await supabase
        .from('streaks')
        .update({ 
          is_active: false,
          final_count: streakToBreak.current_count
        })
        .eq('id', streakId);

      if (error) throw error;

      fetchStreaks();
      toast({
        title: "Streak completed",
        description: `Streak ${streakToBreak.streak_number} completed with ${streakToBreak.current_count} days!`,
      });
    } catch (error) {
      console.error('Error breaking streak:', error);
      toast({
        title: "Error",
        description: "Failed to break streak",
        variant: "destructive",
      });
    }
  };

  const generateChartData = () => {
    const chartData = [];
    
    // Generate chart data for strikes 1-20 and days 1-150
    for (let strike = 1; strike <= 20; strike++) {
      const streakData = streaks.find(s => s.streak_number === strike);
      
      if (streakData) {
        // Use final_count for completed streaks, current_count for active streak
        const days = streakData.is_active ? streakData.current_count : streakData.final_count;
        chartData.push({
          strike,
          days,
          isActive: streakData.is_active,
          isCompleted: !streakData.is_active && streakData.final_count > 0
        });
      } else {
        // Future strikes that haven't been started
        chartData.push({
          strike,
          days: 0,
          isActive: false,
          isCompleted: false
        });
      }
    }
    
    return chartData;
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Goals & Lifestyle</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Track your goals, tips, and daily streaks</p>
        </div>
        <Button variant="ghost" onClick={() => signOut()} size="sm">
          <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Goals Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Goals</CardTitle>
              <DropdownMenu open={showGoalForm} onOpenChange={setShowGoalForm}>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Add New Goal</h4>
                    <Input
                      placeholder="Enter a new goal..."
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newGoal.trim()) {
                          addGoal();
                        }
                      }}
                    />
                    <Select value={newGoalPriority} onValueChange={(v) => setNewGoalPriority(v as 'high' | 'medium' | 'low')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button onClick={addGoal} disabled={!newGoal.trim()} className="flex-1">
                        Add
                      </Button>
                      <Button variant="ghost" onClick={() => setShowGoalForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[32rem] overflow-y-auto">
              {(['high', 'medium', 'low'] as const).map((level) => {
                const levelGoals = goals.filter((g) => (g.priority || 'medium') === level);
                const styles = {
                  high: { label: 'High Priority', badge: 'bg-destructive/10 text-destructive border-destructive/30' },
                  medium: { label: 'Medium Priority', badge: 'bg-primary/10 text-primary border-primary/30' },
                  low: { label: 'Low Priority', badge: 'bg-muted text-muted-foreground border-border' },
                }[level];
                return (
                  <div key={level} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${styles.badge}`}>
                        {styles.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{levelGoals.length}</span>
                    </div>
                    {levelGoals.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic px-1">No {level} priority goals</p>
                    ) : (
                      levelGoals.map((goal) => (
                        <div key={goal.id} className="flex items-center gap-2 p-2 rounded-lg border">
                          <Checkbox
                            checked={goal.completed}
                            onCheckedChange={(checked) =>
                              updateGoal(goal.id, { completed: checked as boolean })
                            }
                          />
                          {editingGoal?.id === goal.id ? (
                            <Input
                              value={editingGoal.title}
                              onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                              onBlur={() => updateGoal(goal.id, { title: editingGoal.title })}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateGoal(goal.id, { title: editingGoal.title });
                                }
                              }}
                              className="flex-1"
                              autoFocus
                            />
                          ) : (
                            <span
                              className={`flex-1 cursor-pointer ${
                                goal.completed ? 'line-through text-muted-foreground' : ''
                              }`}
                              onClick={() => setEditingGoal(goal)}
                            >
                              {goal.title}
                            </span>
                          )}
                          <Select
                            value={goal.priority || 'medium'}
                            onValueChange={(v) => updateGoal(goal.id, { priority: v as 'high' | 'medium' | 'low' })}
                          >
                            <SelectTrigger className="h-7 w-[90px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingGoal(goal)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteGoal(goal.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
              {goals.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No goals yet. Click the + button to add your first goal!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Health & Lifestyle Tips</CardTitle>
              <DropdownMenu open={showTipForm} onOpenChange={setShowTipForm}>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Add New Tip</h4>
                    <Input
                      placeholder="Tip title..."
                      value={newTip}
                      onChange={(e) => setNewTip(e.target.value)}
                    />
                    <Textarea
                      placeholder="Tip description..."
                      value={newTipDescription}
                      onChange={(e) => setNewTipDescription(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button onClick={addTip} disabled={!newTip.trim()} className="flex-1">
                        Add
                      </Button>
                      <Button variant="ghost" onClick={() => setShowTipForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tips.map((tip) => (
                <div key={tip.id} className="p-3 rounded-lg border">
                  {editingTip?.id === tip.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editingTip.title}
                        onChange={(e) => setEditingTip({ ...editingTip, title: e.target.value })}
                      />
                      <Textarea
                        value={editingTip.description}
                        onChange={(e) => setEditingTip({ ...editingTip, description: e.target.value })}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateTip(tip.id, {
                            title: editingTip.title,
                            description: editingTip.description
                          })}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingTip(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{tip.title}</h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTip(tip)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTip(tip.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {tip.description && (
                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                          {tip.description.split('\n').filter(line => line.trim()).map((line, index) => (
                            <li key={index}>{line.trim()}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              ))}
              {tips.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No tips yet. Click the + button to add your first tip!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Tracking */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex flex-col gap-4">
            <span className="text-lg sm:text-xl">Strike Progress Chart</span>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button onClick={updateStreakDaily} className="bg-green-600 hover:bg-green-700 text-sm sm:text-base w-full sm:w-auto h-12 sm:h-10">
                Update Daily +1
              </Button>
              {streaks.some(s => s.is_active) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const activeStreak = streaks.find(s => s.is_active);
                    if (activeStreak) breakStreak(activeStreak.id);
                  }}
                  className="text-sm w-full sm:w-auto h-12 sm:h-10"
                >
                  Break Streak
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="space-y-6">
            {/* Current Active Strike Info */}
            {streaks.some(s => s.is_active) && (
              <div className="bg-card border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-success">
                      Strike {streaks.find(s => s.is_active)?.streak_number} - Active
                    </h3>
                    <p className="text-success-foreground">
                      Day {streaks.find(s => s.is_active)?.current_count} - Keep going!
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-success rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-success-foreground">
                      {streaks.find(s => s.is_active)?.current_count}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Strike Bars Row */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">All Strikes Progress</h3>
              
              {/* Horizontal Strike Bars with responsive scroll */}
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-3 min-w-max">
                  {streaks
                    .sort((a, b) => a.streak_number - b.streak_number)
                    .map((streak) => (
                      <div key={streak.id} className="bg-card border rounded-lg p-3 min-w-[80px] flex-shrink-0">
                        <div className="text-center mb-2">
                          <h4 className="font-semibold text-sm">Strike {streak.streak_number}</h4>
                          <p className={`text-xs ${streak.is_active ? 'text-green-600' : 'text-blue-600'}`}>
                            {streak.is_active ? 'Active' : 'Completed'}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          {/* Vertical Bar - Responsive height */}
                          <div className="h-32 sm:h-48 md:h-64 w-6 mx-auto bg-gray-200 rounded-lg relative overflow-hidden">
                            <div 
                              className={`absolute bottom-0 left-0 right-0 rounded-lg transition-all duration-500 ${
                                streak.is_active 
                                  ? 'bg-green-500 animate-pulse' 
                                  : 'bg-blue-500'
                              }`}
                              style={{ 
                                height: `${Math.min((streak.is_active ? streak.current_count : streak.final_count) / 30 * 100, 100)}%` 
                              }}
                            />
                            
                            {/* Day count label */}
                            <div className="absolute inset-0 flex items-end justify-center pb-2">
                              <span className="text-xs sm:text-sm font-bold text-white drop-shadow-sm">
                                {streak.is_active ? streak.current_count : streak.final_count}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">
                              {streak.is_active ? streak.current_count : streak.final_count} days
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            {/* Legend and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-card rounded-lg border shadow-sm">
                <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-2"></div>
                <span className="text-sm font-medium text-foreground">Completed Strikes</span>
                <p className="text-xs text-muted-foreground">
                  {streaks.filter(s => s.final_count > 0).length} finished streaks
                </p>
              </div>
              <div className="text-center p-4 bg-card rounded-lg border shadow-sm">
                <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
                <span className="text-sm font-medium text-foreground">Active Strike</span>
                <p className="text-xs text-muted-foreground">Currently growing</p>
              </div>
            </div>

            {streaks.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold mb-2">Start Your First Strike!</h3>
                <p className="text-muted-foreground mb-6">Begin tracking your daily consistency</p>
                <Button onClick={updateStreakDaily} className="bg-green-600 hover:bg-green-700 px-8">
                  Start Strike 1
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}