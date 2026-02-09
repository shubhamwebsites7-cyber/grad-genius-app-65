import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface FeedbackDayTrackerProps {
  completedDays: number[];
  currentDay: number;
  totalDays?: number;
  onDayClick?: (day: number) => void;
}

const FeedbackDayTracker: React.FC<FeedbackDayTrackerProps> = ({
  completedDays,
  currentDay,
  totalDays = 14,
  onDayClick,
}) => {
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Testing Progress</h3>
        <span className="text-xs text-muted-foreground">
          {completedDays.length}/{totalDays} days completed
        </span>
      </div>
      
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const isCompleted = completedDays.includes(day);
          const isCurrent = day === currentDay;
          const isFuture = day > currentDay;
          
          return (
            <div
              key={day}
              className={cn(
                "aspect-square rounded-sm flex items-center justify-center text-xs font-medium transition-all relative",
                "border-2",
                isCompleted && "bg-success border-success text-success-foreground",
                isCurrent && !isCompleted && "bg-primary/20 border-primary text-primary animate-pulse",
                !isCompleted && !isCurrent && !isFuture && "bg-muted border-muted-foreground/20 text-muted-foreground",
                isFuture && "bg-muted/50 border-muted-foreground/10 text-muted-foreground/50"
              )}
              title={
                isCompleted ? `Day ${day} - Completed ✓` :
                isCurrent ? `Day ${day} - Today (Submit now!)` :
                isFuture ? `Day ${day} - Coming soon` :
                `Day ${day} - Missed`
              }
            >
              {isCompleted ? (
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <span className="text-[10px] sm:text-xs">{day}</span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-success border border-success" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary/20 border-2 border-primary" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-muted border border-muted-foreground/20" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDayTracker;
