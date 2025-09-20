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

  const renderStreakBars = (count: number) => {
    const fullWeeks = Math.floor(count / 7);
    const remainingDays = count % 7;
    const bars = [];

    // Full weeks (7 days each)
    for (let i = 0; i < fullWeeks; i++) {
      bars.push(
        <div key={`week-${i}`} className="flex gap-1">
          {Array.from({ length: 7 }, (_, j) => (
            <div key={j} className="w-4 h-8 bg-green-500 rounded-sm" />
          ))}
        </div>
      );
    }

    // Remaining days
    if (remainingDays > 0) {
      bars.push(
        <div key="remaining" className="flex gap-1">
          {Array.from({ length: remainingDays }, (_, j) => (
            <div key={j} className="w-4 h-8 bg-green-500 rounded-sm" />
          ))}
          {Array.from({ length: 7 - remainingDays }, (_, j) => (
            <div key={`empty-${j}`} className="w-4 h-8 bg-gray-200 rounded-sm" />
          ))}
        </div>
      );
    }

    return bars;
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
            <Button onClick={updateStreakDaily} className="bg-green-600 hover:bg-green-700">
              Update Daily +1
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {streaks.map((streak, index) => (
              <div key={streak.id} className="p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-medium">
                      {streak.is_active ? 'Current Streak' : `Streak #${streaks.length - index}`}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {streak.current_count} days • Best: {streak.max_count} days
                    </p>
                  </div>
                  {streak.is_active && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => breakStreak(streak.id)}
                    >
                      Break Streak
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {renderStreakBars(streak.current_count)}
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((streak.current_count % 7) / 7 * 100, 100)}%` }}
                  />
                </div>
                
                <p className="text-xs text-muted-foreground mt-1">
                  Started: {format(new Date(streak.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
            ))}
            
            {streaks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No streaks yet!</p>
                <Button onClick={updateStreakDaily} className="bg-green-600 hover:bg-green-700">
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