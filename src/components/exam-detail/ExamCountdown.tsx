import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

interface ExamCountdownProps {
  examDate: string;
  isTentative: boolean;
}

export const ExamCountdown = ({ examDate, isTentative }: ExamCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(examDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(examDate));
    }, 60000); // update every minute
    return () => clearInterval(timer);
  }, [examDate]);

  const formattedDate = new Date(examDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isPast = timeLeft.total <= 0;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm text-foreground">{formattedDate}</span>
        </div>
        <Badge
          variant="outline"
          className={isTentative
            ? 'border-warning text-warning bg-warning/10'
            : 'border-success text-success bg-success/10'
          }
        >
          {isTentative ? 'Expected Date' : 'Official Date'}
        </Badge>
      </div>

      {isPast ? (
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold">Exam Completed</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-3 text-sm">
            {timeLeft.days > 0 && (
              <span className="font-semibold text-foreground">
                {timeLeft.days}<span className="text-muted-foreground font-normal ml-0.5">d</span>
              </span>
            )}
            <span className="font-semibold text-foreground">
              {timeLeft.hours}<span className="text-muted-foreground font-normal ml-0.5">h</span>
            </span>
            <span className="font-semibold text-foreground">
              {timeLeft.minutes}<span className="text-muted-foreground font-normal ml-0.5">m</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

function getTimeLeft(examDate: string) {
  const diff = new Date(examDate).getTime() - Date.now();
  if (diff <= 0) return { total: 0, days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return { total: diff, days, hours, minutes };
}
