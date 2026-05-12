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

export default function Goals() {
  console.log("Goals component is rendering - updates are working!");
  const { signOut, user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [newGoal, setNewGoal] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTip, setNewTip] = useState('');
  const [newTipDescription, setNewTipDescription] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  
  // Dropdown states
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showTipForm, setShowTipForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchTips();
    }
  }, [user]);

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

  const addGoal = async () => {
    if (!newGoal.trim() || !user) return;

    setLoading(true);
    try {
      if (editingGoalId) {
        const { error } = await supabase
          .from('goal')
          .update({ title: newGoal.trim(), priority: newGoalPriority })
          .eq('id', editingGoalId);
        if (error) throw error;
        setGoals((prev) =>
          prev.map((g) =>
            g.id === editingGoalId ? { ...g, title: newGoal.trim(), priority: newGoalPriority } : g
          )
        );
        setNewGoal('');
        setNewGoalPriority('medium');
        setEditingGoalId(null);
        setShowGoalForm(false);
        toast({ title: 'Success', description: 'Goal updated successfully' });
        return;
      }
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

  const startEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setNewGoal(goal.title);
    setNewGoalPriority(goal.priority || 'medium');
    setShowGoalForm(true);
  };

  const cancelGoalForm = () => {
    setShowGoalForm(false);
    setEditingGoalId(null);
    setNewGoal('');
    setNewGoalPriority('medium');
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
    </div>
  );
}