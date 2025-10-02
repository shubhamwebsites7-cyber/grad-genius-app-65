import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, Play, Pause, RotateCcw, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

type WorkoutType = "upper" | "lower";

interface Exercise {
  name: string;
  completed: boolean;
}

interface ExerciseCompletion {
  date: string;
  completion_status: "green" | "blue" | "grey";
}

const upperBodyExercises = [
  "Push-ups",
  "Shoulder Press (band)",
  "Bicep Curls (band)",
  "Chair Dips",
];

const lowerBodyExercises = [
  "Squats",
  "Lunges",
  "Glute Bridges",
  "Leg Raises",
];

export default function Exercise() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workoutType, setWorkoutType] = useState<WorkoutType>("upper");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [isBreak, setIsBreak] = useState(false);
  const [exerciseTime, setExerciseTime] = useState(90);
  const [completions, setCompletions] = useState<ExerciseCompletion[]>([]);
  const [isManualOverride, setIsManualOverride] = useState(false);

  // Get user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // Determine workout type based on day
  useEffect(() => {
    if (!isManualOverride) {
      const dayOfMonth = selectedDate.getDate();
      setWorkoutType(dayOfMonth % 2 === 0 ? "upper" : "lower");
    }
  }, [selectedDate, isManualOverride]);

  // Initialize exercises based on workout type
  useEffect(() => {
    const exerciseList = workoutType === "upper" ? upperBodyExercises : lowerBodyExercises;
    setExercises(exerciseList.map(name => ({ name, completed: false })));
    setCurrentExerciseIndex(0);
    setIsTimerRunning(false);
    setTimeRemaining(exerciseTime);
    setIsBreak(false);
  }, [workoutType, exerciseTime]);

  // Fetch completions for the current month
  useEffect(() => {
    if (!userId) return;
    
    const fetchCompletions = async () => {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      
      const { data, error } = await supabase
        .from("exercise_completions")
        .select("*")
        .eq("user_id", userId)
        .gte("date", format(start, "yyyy-MM-dd"))
        .lte("date", format(end, "yyyy-MM-dd"));

      if (error) {
        console.error("Error fetching completions:", error);
        return;
      }

      setCompletions((data as ExerciseCompletion[]) || []);
    };

    fetchCompletions();
  }, [userId, selectedDate]);

  // Timer logic
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (isBreak) {
            // Break ended, move to next exercise
            const nextIndex = currentExerciseIndex + 1;
            if (nextIndex < exercises.length) {
              setCurrentExerciseIndex(nextIndex);
              setIsBreak(false);
              return exerciseTime;
            } else {
              // All exercises completed
              completeWorkout();
              setIsTimerRunning(false);
              return 0;
            }
          } else {
            // Exercise ended, start break
            markExerciseComplete(currentExerciseIndex);
            setIsBreak(true);
            return 10;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, isBreak, currentExerciseIndex, exercises, exerciseTime]);

  const markExerciseComplete = (index: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, completed: true } : ex))
    );
  };

  const completeWorkout = async () => {
    if (!userId) return;

    const dayOfMonth = selectedDate.getDate();
    const status = dayOfMonth % 2 === 0 ? "green" : "blue";

    const { error } = await supabase
      .from("exercise_completions")
      .upsert({
        user_id: userId,
        date: format(selectedDate, "yyyy-MM-dd"),
        completion_status: status,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save workout completion",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Workout Complete! 🎉",
      description: "Great job finishing today's exercises!",
    });

    // Refresh completions
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const { data } = await supabase
      .from("exercise_completions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", format(start, "yyyy-MM-dd"))
      .lte("date", format(end, "yyyy-MM-dd"));

    if (data) setCompletions(data as ExerciseCompletion[]);
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeRemaining(exerciseTime);
    setIsBreak(false);
    setCurrentExerciseIndex(0);
    setExercises((prev) => prev.map((ex) => ({ ...ex, completed: false })));
  };

  const handleWorkoutTypeChange = (type: WorkoutType) => {
    setWorkoutType(type);
    setIsManualOverride(true);
  };

  // Generate calendar days
  const monthDays = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate),
  });

  const getCompletionStatus = (date: Date) => {
    const completion = completions.find((c) => isSameDay(new Date(c.date), date));
    return completion?.completion_status || "grey";
  };

  const getDotColor = (status: string) => {
    switch (status) {
      case "green":
        return "bg-green-500";
      case "blue":
        return "bg-blue-500";
      default:
        return "bg-muted";
    }
  };

  const progressPercentage = isBreak
    ? ((10 - timeRemaining) / 10) * 100
    : ((exerciseTime - timeRemaining) / exerciseTime) * 100;

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Exercise Tracker</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Track your daily workouts with automatic timers
        </p>
      </div>

      {/* Workout Type Selection */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Today's Workout</CardTitle>
          <CardDescription>
            {format(selectedDate, "MMMM d, yyyy")} - Day {selectedDate.getDate()}{" "}
            {!isManualOverride && "(Auto-selected)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={workoutType === "upper" ? "default" : "outline"}
              onClick={() => handleWorkoutTypeChange("upper")}
              className="flex-1"
            >
              <Dumbbell className="mr-2 h-4 w-4" />
              Upper Body
            </Button>
            <Button
              variant={workoutType === "lower" ? "default" : "outline"}
              onClick={() => handleWorkoutTypeChange("lower")}
              className="flex-1"
            >
              <Dumbbell className="mr-2 h-4 w-4" />
              Lower Body + Core
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timer Card */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            {isBreak ? "Break Time" : exercises[currentExerciseIndex]?.name || "Ready"}
          </CardTitle>
          <CardDescription>
            {isBreak
              ? "Rest and prepare for next exercise"
              : `Exercise ${currentExerciseIndex + 1} of ${exercises.length}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">
              {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
            </div>
            <Badge variant={isBreak ? "secondary" : "default"}>
              {isBreak ? "Break" : "Exercise"}
            </Badge>
          </div>

          <Progress value={progressPercentage} className="h-2" />

          <div className="flex gap-2">
            <Button onClick={toggleTimer} className="flex-1">
              {isTimerRunning ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </>
              )}
            </Button>
            <Button onClick={resetTimer} variant="outline">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exercise List */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Exercise List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {exercises.map((exercise, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  index === currentExerciseIndex && !isBreak
                    ? "bg-primary/10 border-primary"
                    : "bg-card"
                }`}
              >
                <span className="font-medium">{exercise.name}</span>
                {exercise.completed && (
                  <Check className="h-5 w-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Progress</CardTitle>
          <CardDescription>{format(selectedDate, "MMMM yyyy")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day) => {
              const status = getCompletionStatus(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className="flex flex-col items-center"
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {format(day, "d")}
                  </div>
                  <div
                    className={`w-8 h-8 rounded-full ${getDotColor(status)} ${
                      isToday ? "ring-2 ring-primary" : ""
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex gap-4 text-sm justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span>Upper Body (Even Days)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <span>Lower Body (Odd Days)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-muted" />
              <span>Not Done</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
