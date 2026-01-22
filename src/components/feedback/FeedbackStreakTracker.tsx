import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackStreakTrackerProps {
  completedDays: number[];
  totalDays?: number;
}

const FeedbackStreakTracker: React.FC<FeedbackStreakTrackerProps> = ({
  completedDays,
  totalDays = 14,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">14-Day Feedback Challenge</h3>
        <span className="text-xs text-muted-foreground">
          {completedDays.length}/{totalDays} days
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({ length: totalDays }, (_, i) => {
          const dayNumber = i + 1;
          const isCompleted = completedDays.includes(dayNumber);
          
          return (
            <div
              key={dayNumber}
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all",
                isCompleted
                  ? "bg-success text-success-foreground shadow-sm"
                  : "bg-muted text-muted-foreground"
              )}
              title={`Day ${dayNumber}${isCompleted ? ' - Completed' : ' - Pending'}`}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                dayNumber
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-success" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
};

export default FeedbackStreakTracker;
