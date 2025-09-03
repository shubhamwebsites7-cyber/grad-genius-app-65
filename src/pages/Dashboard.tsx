import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CalorieData {
  id: string;
  morning: number;
  afternoon: number;
  evening: number;
  dinner: number;
  daily_goal: number;
}

interface Profile {
  name: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [calorieData, setCalorieData] = useState<CalorieData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMeal, setEditingMeal] = useState<string | null>(null);
  const [mealInput, setMealInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const mealEmojis = {
    morning: '☀️',
    afternoon: '🌤️',
    evening: '🌙',
    dinner: '🍽️'
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user?.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch today's calorie data
      const { data: calorieDataResult } = await supabase
        .from('calories')
        .select('*')
        .eq('user_id', user?.id)
        .eq('date', today)
        .single();

      if (calorieDataResult) {
        setCalorieData(calorieDataResult);
      } else {
        // Create initial entry for today
        const { data: newEntry } = await supabase
          .from('calories')
          .insert({
            user_id: user?.id,
            date: today,
            morning: 0,
            afternoon: 0,
            evening: 0,
            dinner: 0,
            daily_goal: 2400
          })
          .select()
          .single();

        if (newEntry) {
          setCalorieData(newEntry);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateMealCalories = async (meal: string, calories: number) => {
    if (!calorieData) return;

    try {
      const { data, error } = await supabase
        .from('calories')
        .update({ [meal]: calories })
        .eq('id', calorieData.id)
        .select()
        .single();

      if (error) throw error;

      setCalorieData(data);
      toast({
        title: "Success",
        description: `${meal.charAt(0).toUpperCase() + meal.slice(1)} calories updated!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update calories.",
        variant: "destructive"
      });
    }
  };

  const updateDailyGoal = async (newGoal: number) => {
    if (!calorieData) return;

    try {
      const { data, error } = await supabase
        .from('calories')
        .update({ daily_goal: newGoal })
        .eq('id', calorieData.id)
        .select()
        .single();

      if (error) throw error;

      setCalorieData(data);
      setIsGoalDialogOpen(false);
      toast({
        title: "Success",
        description: "Daily calorie goal updated!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update goal.",
        variant: "destructive"
      });
    }
  };

  const handleMealEdit = (meal: string) => {
    setEditingMeal(meal);
    setMealInput(calorieData?.[meal as keyof CalorieData]?.toString() || '0');
  };

  const handleMealSave = () => {
    if (editingMeal && mealInput) {
      updateMealCalories(editingMeal, parseInt(mealInput));
      setEditingMeal(null);
      setMealInput('');
    }
  };

  const handleGoalSave = () => {
    if (goalInput) {
      updateDailyGoal(parseInt(goalInput));
      setGoalInput('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalCalories = calorieData 
    ? calorieData.morning + calorieData.afternoon + calorieData.evening + calorieData.dinner
    : 0;
  
  const goalProgress = calorieData 
    ? Math.min((totalCalories / calorieData.daily_goal) * 100, 100)
    : 0;

  const remainingCalories = calorieData 
    ? Math.max(calorieData.daily_goal - totalCalories, 0)
    : 0;

  return (
    <div className="container mx-auto p-4 pb-20 max-w-2xl">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {profile?.name || 'there'}! 👋
        </h1>
        <p className="text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Daily Goal Card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Today's Goal</CardTitle>
          <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGoalInput(calorieData?.daily_goal.toString() || '2400')}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Daily Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="goal">Daily Calorie Goal</Label>
                  <Input
                    id="goal"
                    type="number"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="2400"
                  />
                </div>
                <Button onClick={handleGoalSave} className="w-full">
                  Update Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">
                {totalCalories} / {calorieData?.daily_goal || 2400} kcal
              </span>
            </div>
            <Progress value={goalProgress} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="text-success">Consumed: {totalCalories} kcal</span>
              <span className="text-muted-foreground">Remaining: {remainingCalories} kcal</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Cards */}
      <div className="grid gap-4">
        {Object.entries(mealEmojis).map(([meal, emoji]) => (
          <Card key={meal} className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="text-2xl">{emoji}</span>
                  <span className="capitalize">{meal}</span>
                </span>
                <div className="flex items-center space-x-2">
                  {editingMeal === meal ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={mealInput}
                        onChange={(e) => setMealInput(e.target.value)}
                        className="w-20 h-8"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleMealSave}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingMeal(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-lg">
                        {calorieData?.[meal as keyof CalorieData] || 0} kcal
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMealEdit(meal)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}