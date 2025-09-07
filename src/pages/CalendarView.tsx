import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CalorieEntry {
  morning: number;
  afternoon: number;
  evening: number;
  dinner: number;
  daily_goal: number;
}

export default function CalendarView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calorieData, setCalorieData] = useState<CalorieEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<CalorieEntry | null>(null);

  const mealEmojis = {
    morning: '☀️',
    afternoon: '🌤️',
    evening: '🌙',
    dinner: '🍽️'
  };

  useEffect(() => {
    if (selectedDate && user) {
      fetchCalorieData(selectedDate);
    }
  }, [selectedDate, user]);

  const fetchCalorieData = async (date: Date) => {
    setIsLoading(true);
    setIsEditing(false);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data } = await supabase
        .from('calories')
        .select('morning, afternoon, evening, dinner, daily_goal')
        .eq('user_id', user?.id)
        .eq('date', dateStr)
        .maybeSingle();

      setCalorieData(data);
      setEditedData(data);
    } catch (error) {
      console.error('Error fetching calorie data:', error);
      setCalorieData(null);
      setEditedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(calorieData || {
      morning: 0,
      afternoon: 0,
      evening: 0,
      dinner: 0,
      daily_goal: 2400
    });
  };

  const handleSave = async () => {
    if (!editedData || !user) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      if (calorieData) {
        // Update existing entry
        await supabase
          .from('calories')
          .update(editedData)
          .eq('user_id', user.id)
          .eq('date', dateStr);
      } else {
        // Create new entry
        await supabase
          .from('calories')
          .insert({
            ...editedData,
            user_id: user.id,
            date: dateStr
          });
      }

      setCalorieData(editedData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Calories updated successfully!"
      });
    } catch (error) {
      console.error('Error saving calorie data:', error);
      toast({
        title: "Error",
        description: "Failed to update calories. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(calorieData);
  };

  const updateMealCalories = (meal: keyof CalorieEntry, value: string) => {
    if (!editedData) return;
    
    const numValue = parseInt(value) || 0;
    setEditedData({
      ...editedData,
      [meal]: numValue
    });
  };

  const displayData = isEditing ? editedData : calorieData;
  const totalCalories = displayData
    ? displayData.morning + displayData.afternoon + displayData.evening + displayData.dinner
    : 0;

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="container mx-auto p-4 pb-20 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Calendar View</h1>
        <p className="text-muted-foreground">
          Select a date to view your calorie intake
        </p>
      </div>

      {/* Calendar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
            disabled={(date) => date > new Date()}
          />
        </CardContent>
      </Card>

      {/* Selected Date Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
            <div className="flex items-center gap-2">
              {isToday && <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded">Today</span>}
              {(calorieData || !isEditing) && !isLoading && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={handleSave} className="h-10 min-w-[44px] touch-manipulation">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel} className="h-10 min-w-[44px] touch-manipulation">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={handleEdit} className="h-10 min-w-[44px] touch-manipulation">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : displayData || isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(mealEmojis).map(([meal, emoji]) => (
                  <div key={meal} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{emoji}</span>
                      <span className="capitalize font-medium">{meal}</span>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editedData?.[meal as keyof CalorieEntry] || 0}
                          onChange={(e) => updateMealCalories(meal as keyof CalorieEntry, e.target.value)}
                          className="w-20 h-8 text-right"
                          min="0"
                        />
                        <span className="text-sm">kcal</span>
                      </div>
                    ) : (
                      <span className="font-bold">
                        {displayData?.[meal as keyof CalorieEntry] || 0} kcal
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Total Calories</span>
                  <span className="text-lg font-bold">{totalCalories} kcal</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Daily Goal</span>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editedData?.daily_goal || 2400}
                        onChange={(e) => updateMealCalories('daily_goal', e.target.value)}
                        className="w-20 h-8 text-right"
                        min="0"
                      />
                      <span className="text-sm">kcal</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">{displayData?.daily_goal || 2400} kcal</span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min((totalCalories / (displayData?.daily_goal || 2400)) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>
                      {totalCalories < (displayData?.daily_goal || 2400)
                        ? `${(displayData?.daily_goal || 2400) - totalCalories} kcal remaining`
                        : `${totalCalories - (displayData?.daily_goal || 2400)} kcal over goal`
                      }
                    </span>
                    <span>{Math.round((totalCalories / (displayData?.daily_goal || 2400)) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🍽️</div>
              <p className="text-muted-foreground">No entries for this date</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {isToday ? "Start logging your meals for today!" : "No data available for this date"}
              </p>
              <Button onClick={handleEdit} size="sm" className="h-10 min-w-[120px] touch-manipulation">
                <Edit2 className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}