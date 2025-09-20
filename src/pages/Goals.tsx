import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Trash2, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
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
}

export default function Goals() {
  const { signOut, user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [newGoal, setNewGoal] = useState('');
  const [newTip, setNewTip] = useState('');
  const [newTipDescription, setNewTipDescription] = useState('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchTips();
      fetchStreaks();
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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
        .order('created_at', { ascending: false });

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
        .order('created_at', { ascending: false });

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

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([{ title: newGoal, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setGoals([data as Goal, ...goals]);
      setNewGoal('');
      
      toast({
        title: "Success",
        description: "Goal added successfully",
      });
    } catch (error) {
      console.error('Error adding goal:', error);
      toast({
        title: "Error",
        description: "Failed to add goal",
        variant: "destructive",
      });
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const { error } = await supabase
        .from('goals')
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
        .from('goals')
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
        // Update existing streak
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
        // Create new streak
        const { error } = await supabase
          .from('streaks')
          .insert([{
            user_id: user.id,
            current_count: 1,
            max_count: 1,
            last_updated: today
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
      const { error } = await supabase
        .from('streaks')
        .update({ is_active: false })
        .eq('id', streakId);

      if (error) throw error;

      fetchStreaks();
      toast({
        title: "Streak broken",
        description: "Your streak has been reset. Start a new one!",
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

  const renderStreakColumns = () => {
    const activeStreak = streaks.find(s => s.is_active);
    const currentCount = activeStreak?.current_count || 0;
    const maxCount = activeStreak?.max_count || 0;
    
    // Define the three milestone columns
    const columns = [
      { 
        id: 1, 
        title: "First Goal", 
        target: 3, 
        completed: maxCount >= 3,
        description: "3 Days"
      },
      { 
        id: 2, 
        title: "Second Goal", 
        target: 7, 
        completed: maxCount >= 7,
        description: "7 Days"
      },
      { 
        id: 3, 
        title: "Current Streak", 
        target: currentCount || 1, 
        completed: false,
        description: "Active",
        isCurrent: true
      }
    ];

    return (
      <div className="grid grid-cols-3 gap-6">
        {columns.map((column) => {
          const barHeight = column.isCurrent 
            ? Math.min(200, Math.max(40, currentCount * 8)) 
            : Math.min(200, Math.max(40, column.target * 8));
          
          const progressPercentage = column.isCurrent 
            ? 100 
            : column.completed ? 100 : 0;

          return (
            <div key={column.id} className="flex flex-col items-center">
              {/* Column Header */}
              <div className="text-center mb-4">
                <h4 className="font-semibold text-sm">{column.title}</h4>
                <p className="text-xs text-muted-foreground">{column.description}</p>
              </div>

              {/* Vertical Progress Bar */}
              <div className="relative">
                <div 
                  className="w-16 bg-muted rounded-lg border-2 border-yellow-400 overflow-hidden transition-all duration-500"
                  style={{ height: `${barHeight}px` }}
                >
                  {/* Animated fill */}
                  <div 
                    className={`w-full bg-gradient-to-t from-green-500 to-green-400 transition-all duration-1000 ease-out ${
                      column.isCurrent ? 'animate-pulse' : ''
                    }`}
                    style={{ 
                      height: `${progressPercentage}%`,
                      animation: column.isCurrent ? 'pulse 2s infinite' : 'none'
                    }}
                  />
                </div>
                
                {/* Day counter inside bar */}
                <div className="absolute inset-0 flex items-end justify-center pb-2">
                  <span className="text-white font-bold text-sm drop-shadow-lg">
                    {column.isCurrent ? currentCount : column.target}
                  </span>
                </div>
              </div>

              {/* Status indicators */}
              <div className="mt-3 text-center">
                {column.completed && !column.isCurrent && (
                  <div className="flex items-center justify-center text-green-600">
                    <span className="text-lg">✓</span>
                    <span className="text-xs ml-1">Complete</span>
                  </div>
                )}
                {column.isCurrent && (
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-blue-600">{currentCount} days</span>
                    <span className="text-xs text-muted-foreground">In progress</span>
                  </div>
                )}
                {!column.completed && !column.isCurrent && (
                  <span className="text-xs text-gray-400">Not reached</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Goals & Lifestyle</h1>
          <p className="text-muted-foreground mt-1">Track your goals, tips, and daily streaks</p>
        </div>
        <Button variant="ghost" onClick={() => signOut()}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              My Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a new goal..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addGoal} disabled={!newGoal.trim()}>
                Add
              </Button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {goals.map((goal) => (
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
              ))}
              {goals.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No goals yet. Add your first goal above!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Health & Lifestyle Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Tip title..."
                value={newTip}
                onChange={(e) => setNewTip(e.target.value)}
              />
              <Textarea
                placeholder="Tip description..."
                value={newTipDescription}
                onChange={(e) => setNewTipDescription(e.target.value)}
                rows={2}
              />
              <Button onClick={addTip} disabled={!newTip.trim()} className="w-full">
                Add Tip
              </Button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
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
                        <p className="text-sm text-muted-foreground">{tip.description}</p>
                      )}
                    </>
                  )}
                </div>
              ))}
              {tips.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No tips yet. Add your first tip above!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Daily Streak Tracker</span>
            <div className="flex gap-2">
              <Button onClick={updateStreakDaily} className="bg-green-600 hover:bg-green-700">
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
                >
                  Break Streak
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-gradient-to-r from-background to-muted/20 rounded-lg">
            {streaks.length > 0 ? (
              <>
                {/* Column-based streak visualization */}
                <div className="mb-8">
                  <h5 className="text-lg font-semibold mb-6 text-center">Streak Progress</h5>
                  {renderStreakColumns()}
                </div>
                
                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {streaks.find(s => s.is_active)?.current_count || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Current Streak</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.max(...streaks.map(s => s.max_count), 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Best Record</div>
                  </div>
                </div>
                
                {streaks.find(s => s.is_active) && (
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Last updated: {format(new Date(streaks.find(s => s.is_active)?.last_updated || new Date()), 'MMM dd, yyyy')}
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold mb-2">Ready to start your journey?</h3>
                <p className="text-muted-foreground mb-6">Build consistency with daily streak tracking</p>
                <Button onClick={updateStreakDaily} className="bg-green-600 hover:bg-green-700 px-8">
                  Start Your First Streak
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}