import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface WeightEntry {
  id: string;
  date: string;
  weight: number;
}

interface Goal {
  weight_goal: number;
}

interface ChartData {
  date: string;
  weight: number;
  goal: number;
}

export default function Weight() {
  const { user } = useAuth();
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weightInput, setWeightInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingWeight, setEditingWeight] = useState<WeightEntry | null>(null);

  useEffect(() => {
    if (user) {
      fetchWeightData();
    }
  }, [user]);

  const fetchWeightData = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch weights
      const { data: weightData, error: weightError } = await supabase
        .from('weights')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (weightError) {
        console.error('Error fetching weights:', weightError);
      } else if (weightData) {
        setWeights(weightData);
      }

      // Fetch goal - use maybeSingle() instead of single() to avoid errors when no goal exists
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('weight_goal')
        .eq('user_id', user.id)
        .maybeSingle();

      if (goalError) {
        console.error('Error fetching goal:', goalError);
      } else if (goalData) {
        setGoal(goalData);
      }
    } catch (error) {
      console.error('Error fetching weight data:', error);
      toast({
        title: "Error",
        description: "Failed to load weight data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addWeight = async () => {
    if (!weightInput || !selectedDate || !user?.id) {
      toast({
        title: "Error",
        description: "Please enter a valid weight and date.",
        variant: "destructive"
      });
      return;
    }

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      if (editingWeight) {
        // Update existing entry
        const { data, error } = await supabase
          .from('weights')
          .update({ weight: parseFloat(weightInput), date: dateStr })
          .eq('id', editingWeight.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        setWeights(prev => prev.map(w => w.id === editingWeight.id ? data : w));
        toast({
          title: "Success",
          description: "Weight entry updated successfully!",
        });
      } else {
        // Add new entry
        const { data, error } = await supabase
          .from('weights')
          .upsert({ 
            user_id: user.id,
            date: dateStr,
            weight: parseFloat(weightInput)
          })
          .select()
          .single();

        if (error) throw error;

        setWeights(prev => {
          const filtered = prev.filter(w => w.date !== dateStr);
          return [data, ...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });

        toast({
          title: "Success",
          description: "Weight entry added successfully!",
        });
      }

      setIsAddDialogOpen(false);
      setWeightInput('');
      setEditingWeight(null);
    } catch (error) {
      console.error('Error saving weight:', error);
      toast({
        title: "Error",
        description: "Failed to save weight entry.",
        variant: "destructive"
      });
    }
  };

  const deleteWeight = async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('weights')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setWeights(prev => prev.filter(w => w.id !== id));
      toast({
        title: "Success",
        description: "Weight entry deleted.",
      });
    } catch (error) {
      console.error('Error deleting weight:', error);
      toast({
        title: "Error",
        description: "Failed to delete weight entry.",
        variant: "destructive"
      });
    }
  };

  const updateGoal = async () => {
    if (!goalInput || !user?.id) {
      toast({
        title: "Error",
        description: "Please enter a valid goal weight.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('goals')
        .upsert({
          user_id: user.id,
          weight_goal: parseFloat(goalInput)
        })
        .select()
        .single();

      if (error) throw error;

      setGoal(data);
      setIsGoalDialogOpen(false);
      setGoalInput('');
      toast({
        title: "Success",
        description: "Weight goal updated!",
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Error",
        description: "Failed to update goal.",
        variant: "destructive"
      });
    }
  };

  const handleEditWeight = (weight: WeightEntry) => {
    setEditingWeight(weight);
    setSelectedDate(new Date(weight.date));
    setWeightInput(weight.weight.toString());
    setIsAddDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentWeight = weights.length > 0 ? weights[0].weight : null;
  const goalWeight = goal?.weight_goal || null;
  
  const chartData: ChartData[] = weights
    .slice(0, 30)
    .reverse()
    .map(w => ({
      date: format(new Date(w.date), 'MMM dd'),
      weight: w.weight,
      goal: goalWeight || 0
    }));

  const progressPercentage = currentWeight && goalWeight 
    ? Math.abs(((currentWeight - goalWeight) / goalWeight) * 100)
    : 0;

  const remainingWeight = currentWeight && goalWeight 
    ? Math.abs(currentWeight - goalWeight)
    : 0;

  const isGainGoal = currentWeight && goalWeight ? currentWeight < goalWeight : false;

  return (
    <div className="container mx-auto p-4 pb-20 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Weight Tracker</h1>
        <p className="text-muted-foreground">
          Monitor your weight progress and achieve your goals
        </p>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Weight</p>
              <p className="text-3xl font-bold">{currentWeight || '---'} kg</p>
              {weights.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {format(new Date(weights[0].date), 'MMM dd, yyyy')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weight Goal</CardTitle>
            <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGoalInput(goalWeight?.toString() || '')}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Weight Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="goal">Target Weight (kg)</Label>
                    <Input
                      id="goal"
                      type="number"
                      step="0.1"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      placeholder="70.0"
                    />
                  </div>
                  <Button onClick={updateGoal} className="w-full">
                    Update Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold">{goalWeight || '---'} kg</p>
              {currentWeight && goalWeight && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    {isGainGoal ? 'Remaining to gain' : 'Remaining to lose'}: {remainingWeight.toFixed(1)} kg
                  </p>
                  <Progress 
                    value={Math.max(0, 100 - progressPercentage)} 
                    className="h-2" 
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weight Progress Chart */}
      {chartData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Weight Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2} 
                  name="Weight"
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
                {goalWeight && (
                  <Line 
                    type="monotone" 
                    dataKey="goal" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    name="Goal"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Add Weight Entry */}
      <div className="mb-6">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {editingWeight ? 'Edit Weight Entry' : 'Add Weight Entry'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingWeight ? 'Edit Weight Entry' : 'Add Weight Entry'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                  disabled={(date) => date > new Date()}
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="72.5"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={addWeight} className="flex-1">
                  {editingWeight ? 'Update' : 'Add'} Entry
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingWeight(null);
                    setWeightInput('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Weight History */}
      <Card>
        <CardHeader>
          <CardTitle>Weight History</CardTitle>
        </CardHeader>
        <CardContent>
          {weights.length > 0 ? (
            <div className="space-y-3">
              {weights.slice(0, 10).map((weight) => (
                <div key={weight.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium">{weight.weight} kg</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(weight.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditWeight(weight)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteWeight(weight.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {weights.length > 10 && (
                <p className="text-center text-sm text-muted-foreground">
                  Showing latest 10 entries
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">⚖️</div>
              <p className="text-muted-foreground">No weight entries yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start tracking your weight to see progress
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}