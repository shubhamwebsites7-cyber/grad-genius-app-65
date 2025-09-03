import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface CalorieEntry {
  morning: number;
  afternoon: number;
  evening: number;
  dinner: number;
  daily_goal: number;
}

export default function CalendarView() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calorieData, setCalorieData] = useState<CalorieEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data } = await supabase
        .from('calories')
        .select('morning, afternoon, evening, dinner, daily_goal')
        .eq('user_id', user?.id)
        .eq('date', dateStr)
        .single();

      setCalorieData(data);
    } catch (error) {
      console.error('Error fetching calorie data:', error);
      setCalorieData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCalories = calorieData
    ? calorieData.morning + calorieData.afternoon + calorieData.evening + calorieData.dinner
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
            {isToday && <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded">Today</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : calorieData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(mealEmojis).map(([meal, emoji]) => (
                  <div key={meal} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{emoji}</span>
                      <span className="capitalize font-medium">{meal}</span>
                    </div>
                    <span className="font-bold">
                      {calorieData[meal as keyof CalorieEntry]} kcal
                    </span>
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
                  <span className="text-muted-foreground">{calorieData.daily_goal} kcal</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min((totalCalories / calorieData.daily_goal) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>
                      {totalCalories < calorieData.daily_goal 
                        ? `${calorieData.daily_goal - totalCalories} kcal remaining`
                        : `${totalCalories - calorieData.daily_goal} kcal over goal`
                      }
                    </span>
                    <span>{Math.round((totalCalories / calorieData.daily_goal) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🍽️</div>
              <p className="text-muted-foreground">No entries for this date</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isToday ? "Start logging your meals for today!" : "No data available for this date"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}