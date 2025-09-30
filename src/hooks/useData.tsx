import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type Calories = Tables['calories']['Row'];
type CaloriesInsert = Tables['calories']['Insert'];
type CaloriesUpdate = Tables['calories']['Update'];

type Weight = Tables['weights']['Row'];
type WeightInsert = Tables['weights']['Insert'];
type WeightUpdate = Tables['weights']['Update'];

type Task = Tables['tasks']['Row'];
type TaskInsert = Tables['tasks']['Insert'];
type TaskUpdate = Tables['tasks']['Update'];

// General Goals (goals page)
type Goal = Tables['goal']['Row'];
type GoalInsert = Tables['goal']['Insert'];
type GoalUpdate = Tables['goal']['Update'];

// Weight Goals (weight page)
type WeightGoal = Tables['goals']['Row'];
type WeightGoalInsert = Tables['goals']['Insert'];
type WeightGoalUpdate = Tables['goals']['Update'];

type Streak = Tables['streaks']['Row'];
type StreakInsert = Tables['streaks']['Insert'];
type StreakUpdate = Tables['streaks']['Update'];

type Tip = Tables['tips']['Row'];
type TipInsert = Tables['tips']['Insert'];
type TipUpdate = Tables['tips']['Update'];

// Calories Management
export function useCalories() {
  const { user } = useAuth();
  const [calories, setCalories] = useState<Calories[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalories = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('calories')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setCalories(data || []);
    } catch (error) {
      console.error('Error fetching calories:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCalories = async (caloriesData: Omit<CaloriesInsert, 'user_id'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('calories')
        .insert({ ...caloriesData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setCalories(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      console.error('Error adding calories:', error);
      return { data: null, error };
    }
  };

  const updateCalories = async (id: string, updates: CaloriesUpdate) => {
    try {
      const { data, error } = await supabase
        .from('calories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setCalories(prev => prev.map(item => item.id === id ? data : item));
      return { data, error: null };
    } catch (error) {
      console.error('Error updating calories:', error);
      return { data: null, error };
    }
  };

  const deleteCalories = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCalories(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error deleting calories:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchCalories();
  }, [user]);

  return {
    calories,
    loading,
    addCalories,
    updateCalories,
    deleteCalories,
    refetch: fetchCalories
  };
}

// Weight Management
export function useWeights() {
  const { user } = useAuth();
  const [weights, setWeights] = useState<Weight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWeights = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('weights')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setWeights(data || []);
    } catch (error) {
      console.error('Error fetching weights:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWeight = async (weightData: Omit<WeightInsert, 'user_id'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('weights')
        .insert({ ...weightData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setWeights(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      console.error('Error adding weight:', error);
      return { data: null, error };
    }
  };

  const updateWeight = async (id: string, updates: WeightUpdate) => {
    try {
      const { data, error } = await supabase
        .from('weights')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setWeights(prev => prev.map(item => item.id === id ? data : item));
      return { data, error: null };
    } catch (error) {
      console.error('Error updating weight:', error);
      return { data: null, error };
    }
  };

  const deleteWeight = async (id: string) => {
    try {
      const { error } = await supabase
        .from('weights')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setWeights(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error deleting weight:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchWeights();
  }, [user]);

  return {
    weights,
    loading,
    addWeight,
    updateWeight,
    deleteWeight,
    refetch: fetchWeights
  };
}

// Tasks Management
export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData: Omit<TaskInsert, 'user_id'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...taskData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      console.error('Error adding task:', error);
      return { data: null, error };
    }
  };

  const updateTask = async (id: string, updates: TaskUpdate) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => prev.map(item => item.id === id ? data : item));
      return { data, error: null };
    } catch (error) {
      console.error('Error updating task:', error);
      return { data: null, error };
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTasks(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks
  };
}

// General Goals Management (for Goals page)
export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('goal')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goalData: Omit<GoalInsert, 'user_id'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('goal')
        .insert({ ...goalData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setGoals(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      console.error('Error adding goal:', error);
      return { data: null, error };
    }
  };

  const updateGoal = async (id: string, updates: GoalUpdate) => {
    try {
      const { data, error } = await supabase
        .from('goal')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setGoals(prev => prev.map(item => item.id === id ? data : item));
      return { data, error: null };
    } catch (error) {
      console.error('Error updating goal:', error);
      return { data: null, error };
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('goal')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setGoals(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error deleting goal:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals
  };
}

// Weight Goals Management (for Weight page)
export function useWeightGoals() {
  const { user } = useAuth();
  const [weightGoals, setWeightGoals] = useState<WeightGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWeightGoals = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWeightGoals(data || []);
    } catch (error) {
      console.error('Error fetching weight goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWeightGoal = async (goalData: Omit<WeightGoalInsert, 'user_id'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({ ...goalData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setWeightGoals(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      console.error('Error adding weight goal:', error);
      return { data: null, error };
    }
  };

  const updateWeightGoal = async (id: string, updates: WeightGoalUpdate) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setWeightGoals(prev => prev.map(item => item.id === id ? data : item));
      return { data, error: null };
    } catch (error) {
      console.error('Error updating weight goal:', error);
      return { data: null, error };
    }
  };

  const deleteWeightGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setWeightGoals(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error deleting weight goal:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchWeightGoals();
  }, [user]);

  return {
    weightGoals,
    loading,
    addWeightGoal,
    updateWeightGoal,
    deleteWeightGoal,
    refetch: fetchWeightGoals
  };
}

// Streaks Management
export function useStreaks() {
  const { user } = useAuth();
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStreaks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStreaks(data || []);
    } catch (error) {
      console.error('Error fetching streaks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStreak = async (streakData: Omit<StreakInsert, 'user_id'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('streaks')
        .insert({ ...streakData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setStreaks(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      console.error('Error adding streak:', error);
      return { data: null, error };
    }
  };

  const updateStreak = async (id: string, updates: StreakUpdate) => {
    try {
      const { data, error } = await supabase
        .from('streaks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setStreaks(prev => prev.map(item => item.id === id ? data : item));
      return { data, error: null };
    } catch (error) {
      console.error('Error updating streak:', error);
      return { data: null, error };
    }
  };

  useEffect(() => {
    fetchStreaks();
  }, [user]);

  return {
    streaks,
    loading,
    addStreak,
    updateStreak,
    refetch: fetchStreaks
  };
}

// Tips Management
export function useTips() {
  const { user } = useAuth();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTips = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTips(data || []);
    } catch (error) {
      console.error('Error fetching tips:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTip = async (tipData: Omit<TipInsert, 'user_id'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('tips')
        .insert({ ...tipData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setTips(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      console.error('Error adding tip:', error);
      return { data: null, error };
    }
  };

  const updateTip = async (id: string, updates: TipUpdate) => {
    try {
      const { data, error } = await supabase
        .from('tips')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTips(prev => prev.map(item => item.id === id ? data : item));
      return { data, error: null };
    } catch (error) {
      console.error('Error updating tip:', error);
      return { data: null, error };
    }
  };

  const deleteTip = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tips')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTips(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error deleting tip:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchTips();
  }, [user]);

  return {
    tips,
    loading,
    addTip,
    updateTip,
    deleteTip,
    refetch: fetchTips
  };
}
