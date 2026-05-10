import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subMonths, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';
import { Edit2, Save, X, TrendingUp, TrendingDown, Target, Activity, PlusCircle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CalorieEntry {
  morning: number;
  afternoon: number;
  evening: number;
  dinner: number;
  daily_goal: number;
}

interface CalorieData {
  date: string;
  morning: number;
  afternoon: number;
  evening: number;
  dinner: number;
  daily_goal: number;
  total: number;
}

interface ChartData {
  date: string;
  calories: number;
  goal: number;
  morning: number;
  afternoon: number;
  evening: number;
  dinner: number;
}

export default function CalendarView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calorieData, setCalorieData] = useState<CalorieEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<CalorieEntry | null>(null);
  
  // Progress data
  const [period, setPeriod] = useState<'week' | 'month' | '3months' | '6months' | 'year'>('week');
  const [progressData, setProgressData] = useState<CalorieData[]>([]);
  const [isProgressLoading, setIsProgressLoading] = useState(true);

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

  // Auto-enable editing for today
  useEffect(() => {
    const isTodaySelected = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    if (isTodaySelected && !isLoading) {
      setIsEditing(true);
      setEditedData(calorieData || {
        morning: 0,
        afternoon: 0,
        evening: 0,
        dinner: 0,
        daily_goal: 2400
      });
    } else if (!isTodaySelected) {
      setIsEditing(false);
    }
  }, [selectedDate, calorieData, isLoading]);

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user, period]);

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

  const fetchProgressData = async () => {
    setIsProgressLoading(true);
    try {
      const today = new Date();
      let startDate: Date;
      let aggregateWeekly = false;

      switch (period) {
        case 'week':
          startDate = subDays(today, 6);
          break;
        case 'month':
          startDate = subDays(today, 29);
          break;
        case '3months':
          startDate = subMonths(today, 3);
          aggregateWeekly = true;
          break;
        case '6months':
          startDate = subMonths(today, 6);
          aggregateWeekly = true;
          break;
        case 'year':
          startDate = subMonths(today, 12);
          aggregateWeekly = true;
          break;
      }

      const { data: calorieProgressData } = await supabase
        .from('calories')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(today, 'yyyy-MM-dd'))
        .order('date');

      if (calorieProgressData) {
        const daily = calorieProgressData.map(item => ({
          ...item,
          total: item.morning + item.afternoon + item.evening + item.dinner,
        }));
        if (!aggregateWeekly) {
          setProgressData(daily);
        } else {
          const weeks = eachWeekOfInterval({ start: startDate, end: today });
          const weekly = weeks.map(ws => {
            const we = endOfWeek(ws);
            const wItems = daily.filter(d => {
              const dt = new Date(d.date);
              return dt >= ws && dt <= we;
            });
            const sum = (k: keyof typeof daily[number]) =>
              wItems.reduce((s, it) => s + (Number((it as any)[k]) || 0), 0);
            return {
              date: format(ws, 'yyyy-MM-dd'),
              morning: sum('morning'),
              afternoon: sum('afternoon'),
              evening: sum('evening'),
              dinner: sum('dinner'),
              daily_goal: wItems.length ? Math.round(sum('daily_goal') / wItems.length) : 0,
              total: sum('total'),
            } as CalorieData;
          });
          setProgressData(weekly);
        }
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setIsProgressLoading(false);
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

  const isWeeklyAgg = period === '3months' || period === '6months' || period === 'year';
  const chartData: ChartData[] = progressData.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    calories: item.total,
    goal: item.daily_goal,
    morning: item.morning,
    afternoon: item.afternoon,
    evening: item.evening,
    dinner: item.dinner
  }));

  const hasMeaningfulData = progressData.some(item => item.total > 0);
  const hasAnyData = progressData.length > 0;
  const hasGoalData = progressData.some(item => item.daily_goal > 0);

  const avgCalories = hasMeaningfulData ? Math.round(progressData.reduce((sum, item) => sum + item.total, 0) / progressData.length) : 0;
  const avgGoal = hasGoalData ? Math.round(progressData.reduce((sum, item) => sum + item.daily_goal, 0) / progressData.length) : 0;
  const consistency = hasMeaningfulData && hasGoalData ? Math.round((progressData.filter(item => item.total >= item.daily_goal * 0.8 && item.total <= item.daily_goal * 1.2).length / progressData.length) * 100) : 0;

  const goalVsActual = avgGoal > 0 && avgCalories > 0 ? [
    { name: 'Goal', value: avgGoal, color: '#8884d8' },
    { name: 'Actual', value: avgCalories, color: avgCalories >= avgGoal ? '#82ca9d' : '#ff7300' }
  ] : [];

  return (
    <div className="container mx-auto p-4 pb-20 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Calories Tracker</h1>
        <p className="text-muted-foreground">
          Track your daily calorie intake and view progress over time
        </p>
      </div>

      {/* Daily Entry Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">

        {/* Calendar */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Select Date</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center px-2 sm:px-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date > new Date()}
              className="rounded-md border scale-90 sm:scale-100"
            />
          </CardContent>
        </Card>

        {/* Selected Date Info */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center justify-between text-sm sm:text-lg flex-wrap gap-2">
              <span className="text-sm sm:text-base">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              <div className="flex items-center gap-2 flex-wrap">
                {isToday && <span className="text-xs sm:text-sm bg-primary text-primary-foreground px-2 py-1 rounded">Today</span>}
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={handleSave} className="h-10 px-3 touch-manipulation">
                        <Save className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Save</span>
                      </Button>
                      {!isToday && (
                        <Button size="sm" variant="outline" onClick={handleCancel} className="h-10 px-3 touch-manipulation">
                          <X className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Cancel</span>
                        </Button>
                      )}
                    </>
                  ) : (
                    !isToday && (
                      <Button size="sm" variant="outline" onClick={handleEdit} className="h-10 px-3 touch-manipulation" disabled={isLoading}>
                        <Edit2 className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                    )
                  )}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(mealEmojis).map(([meal, emoji]) => (
                    <div key={meal} className="flex items-center justify-between p-3 rounded-lg bg-muted min-h-[50px]">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{emoji}</span>
                        <span className="capitalize font-medium text-base">{meal}</span>
                      </div>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editedData?.[meal as keyof CalorieEntry] || 0}
                            onChange={(e) => updateMealCalories(meal as keyof CalorieEntry, e.target.value)}
                            className="w-20 h-10 text-right text-base"
                            min="0"
                          />
                          <span className="text-sm font-medium">kcal</span>
                        </div>
                      ) : (
                        <span className="font-bold text-base">
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
                          width: `${Math.min(100, Math.max(0, (totalCalories / (displayData?.daily_goal || 2400)) * 100))}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>
                        {Math.max(0, (displayData?.daily_goal || 2400) - totalCalories)} kcal remaining
                      </span>
                      <span>
                        {Math.round((totalCalories / (displayData?.daily_goal || 2400)) * 100)}%
                      </span>
                    </div>
                  </div>
                  {isEditing && (
                    <div className="mt-4 flex justify-center">
                      <Button onClick={handleSave} size="sm" className="h-10 min-w-[120px] touch-manipulation">
                        <Save className="h-4 w-4 mr-2" />
                        Save Entry
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h2 className="text-xl font-bold">Progress Overview</h2>
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[160px]">
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

        <div className="space-y-6">
            {isProgressLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : hasMeaningfulData ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Daily Calories</p>
                          <p className="text-2xl font-bold">{avgCalories}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-sm text-muted-foreground">Goal Achievement</p>
                          <p className="text-2xl font-bold">
                            {hasGoalData ? `${consistency}%` : 'Set Goal'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        {avgCalories >= avgGoal ? 
                          <TrendingUp className="h-5 w-5 text-success" /> : 
                          <TrendingDown className="h-5 w-5 text-warning" />
                        }
                        <div>
                          <p className="text-sm text-muted-foreground">Trend</p>
                          <p className="text-2xl font-bold">
                            {hasGoalData ? `${avgCalories >= avgGoal ? '+' : ''}${avgCalories - avgGoal}` : '--'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                 {/* Daily Calorie Trend */}
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-base sm:text-lg">Daily Calorie Intake vs Goal</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:px-6">
                    <div className="overflow-x-auto">
                      <div className="min-w-[600px]">
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              fontSize={10}
                              angle={-45}
                              textAnchor="end"
                              height={50}
                              interval={0}
                            />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Legend fontSize={10} />
                            <Line type="monotone" dataKey="calories" stroke="hsl(var(--primary))" strokeWidth={2} name="Actual Calories" />
                            <Line type="monotone" dataKey="goal" stroke="hsl(var(--success))" strokeWidth={2} strokeDasharray="5 5" name="Daily Goal" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Meal Breakdown - Full Width */}
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-base sm:text-lg">Meal-wise Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:px-6">
                    <div className="overflow-x-auto">
                      <div className="min-w-[600px]">
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              fontSize={10}
                              angle={-45}
                              textAnchor="end"
                              height={50}
                              interval={0}
                            />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Legend fontSize={10} />
                            <Bar dataKey="morning" stackId="a" fill="hsl(var(--primary))" name="Morning" />
                            <Bar dataKey="afternoon" stackId="a" fill="hsl(var(--success))" name="Afternoon" />
                            <Bar dataKey="evening" stackId="a" fill="hsl(var(--accent))" name="Evening" />
                            <Bar dataKey="dinner" stackId="a" fill="hsl(var(--warning))" name="Dinner" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Start Tracking Your Progress</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">Begin logging your daily calorie intake to see detailed progress charts, meal breakdowns, and achievement trends.</p>
                    <Button onClick={handleEdit}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Log Today's Calories
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}