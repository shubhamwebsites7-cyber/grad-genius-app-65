export type NotificationCategory = 'morning' | 'todo' | 'pomodoro' | 'motivational';

export interface SmartContext {
  name: string;
  todosTotal: number;
  todosCompleted: number;
  goalsPending: number;
  hour: number; // 0-23
}

export interface SmartMessage {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
}

/** Pure rule engine — returns the most relevant message for the given context. */
export function pickSmartMessage(ctx: SmartContext): SmartMessage | null {
  const name = ctx.name || 'there';

  // Morning planning window (5–10am)
  if (ctx.hour >= 5 && ctx.hour < 10 && ctx.todosTotal === 0) {
    return {
      id: 'morning-plan',
      category: 'morning',
      title: `Good morning, ${name}`,
      body: "You haven't planned your day yet. Add a few tasks to get started.",
    };
  }

  // Empty todo list any time of day
  if (ctx.todosTotal === 0) {
    return {
      id: 'todo-empty',
      category: 'todo',
      title: 'Your task list is empty',
      body: 'Add your first task today.',
    };
  }

  // All complete
  if (ctx.todosTotal > 0 && ctx.todosCompleted === ctx.todosTotal) {
    return {
      id: 'todo-all-done',
      category: 'motivational',
      title: 'All tasks complete',
      body: `You completed all planned tasks today, ${name}. Excellent work.`,
    };
  }

  // None started yet
  if (ctx.todosTotal > 0 && ctx.todosCompleted === 0) {
    return {
      id: 'todo-inactive',
      category: 'todo',
      title: 'Get the first one done',
      body: `You planned ${ctx.todosTotal} task${ctx.todosTotal === 1 ? '' : 's'} today and none are completed yet. Let's finish the first one.`,
    };
  }

  // Partial progress
  if (ctx.todosCompleted > 0 && ctx.todosCompleted < ctx.todosTotal) {
    return {
      id: 'todo-progress',
      category: 'motivational',
      title: 'Great progress',
      body: `You completed ${ctx.todosCompleted} of ${ctx.todosTotal} tasks today. Keep going.`,
    };
  }

  // Goal reminder fallback
  if (ctx.goalsPending > 0) {
    return {
      id: 'goal-reminder',
      category: 'motivational',
      title: 'Keep going',
      body: 'Small daily progress creates big results.',
    };
  }

  return null;
}

export const POMODORO_COMPLETE_MESSAGE: SmartMessage = {
  id: 'pomodoro-complete',
  category: 'pomodoro',
  title: 'Pomodoro complete',
  body: 'Take a short break and continue when ready.',
};