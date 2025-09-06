import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartLegend } from '@/components/ui/chart-simple';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subMonths, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';

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

export default function Progress() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('weekly');
  const [data, setData] = useState<CalorieData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user, activeTab]);

  const fetchProgressData = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      let startDate: Date;
      
      switch (activeTab) {
        case 'weekly':
          startDate = startOfWeek(today);
          break;
        case 'monthly':
          startDate = subDays(today, 30);
          break;
        case 'quarter':
          startDate = subMonths(today, 3);
          break;
        default:
          startDate = subDays(today, 7);
      }

      const { data: calorieData } = await supabase
        .from('calories')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(today, 'yyyy-MM-dd'))
        .order('date');

      if (calorieData) {
        const processedData = calorieData.map(item => ({
          ...item,
          total: item.morning + item.afternoon + item.evening + item.dinner
        }));
        setData(processedData);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData: ChartData[] = data.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    calories: item.total,
    goal: item.daily_goal,
    morning: item.morning,
    afternoon: item.afternoon,
    evening: item.evening,
    dinner: item.dinner
  }));

  const mealBreakdown = [
    { name: 'Morning', value: data.reduce((sum, item) => sum + item.morning, 0), color: '#8884d8' },
    { name: 'Afternoon', value: data.reduce((sum, item) => sum + item.afternoon, 0), color: '#82ca9d' },
    { name: 'Evening', value: data.reduce((sum, item) => sum + item.evening, 0), color: '#ffc658' },
    { name: 'Dinner', value: data.reduce((sum, item) => sum + item.dinner, 0), color: '#ff7300' }
  ].filter(item => item.value > 0);

  const avgCalories = data.length ? Math.round(data.reduce((sum, item) => sum + item.total, 0) / data.length) : 0;
  const avgGoal = data.length ? Math.round(data.reduce((sum, item) => sum + item.daily_goal, 0) / data.length) : 0;
  const consistency = data.length ? Math.round((data.filter(item => item.total >= item.daily_goal * 0.8 && item.total <= item.daily_goal * 1.2).length / data.length) * 100) : 0;

  const goalVsActual = avgGoal > 0 && avgCalories > 0 ? [
    { name: 'Goal', value: avgGoal, color: '#8884d8' },
    { name: 'Actual', value: avgCalories, color: avgCalories >= avgGoal ? '#82ca9d' : '#ff7300' }
  ] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-20 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Progress Overview</h1>
        <p className="text-muted-foreground">
          Track your calorie intake trends and meal patterns
        </p>
      </div>

      {/* Time Period Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="quarter">3 Months</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
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
                    <p className="text-2xl font-bold">{consistency}%</p>
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
                      {avgCalories >= avgGoal ? '+' : ''}{avgCalories - avgGoal}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Calorie Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Calorie Intake vs Goal</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="calories" stroke="hsl(var(--primary))" strokeWidth={2} name="Actual Calories" />
                    <Line type="monotone" dataKey="goal" stroke="hsl(var(--success))" strokeWidth={2} strokeDasharray="5 5" name="Daily Goal" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meal Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Meal-wise Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ScrollArea className="h-[250px] w-full">
                    <ResponsiveContainer width={Math.max(600, chartData.length * 60)} height={250}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="morning" stackId="a" fill="hsl(var(--primary))" name="Morning" />
                        <Bar dataKey="afternoon" stackId="a" fill="hsl(var(--success))" name="Afternoon" />
                        <Bar dataKey="evening" stackId="a" fill="hsl(var(--accent))" name="Evening" />
                        <Bar dataKey="dinner" stackId="a" fill="hsl(var(--warning))" name="Dinner" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No meal data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goal vs Actual</CardTitle>
              </CardHeader>
              <CardContent>
                {goalVsActual.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={goalVsActual}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value} kcal`}
                      >
                        {goalVsActual.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "hsl(var(--primary))" : "hsl(var(--success))"} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No goal data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}