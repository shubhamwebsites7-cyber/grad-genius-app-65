import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle } from 'lucide-react';

interface ExamCountdownProps {
  examDate: string;
  isTentative: boolean;
}

export const ExamCountdown = ({ examDate, isTentative }: ExamCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(examDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(examDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [examDate]);

  const formattedDate = new Date(examDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isPast = timeLeft.total <= 0;

  return (
    <div className="space-y-3">
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
        <div className="flex items-center gap-3">
          <TimeBlock value={timeLeft.days} label="d" />
          <TimeBlock value={timeLeft.hours} label="h" />
          <TimeBlock value={timeLeft.minutes} label="m" />
          <TimeBlock value={timeLeft.seconds} label="s" />
        </div>
      )}
    </div>
  );
};

const TimeBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex items-baseline gap-0.5">
    <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
    <span className="text-sm text-muted-foreground">{label}</span>
  </div>
);

function getTimeLeft(examDate: string) {
  const diff = new Date(examDate).getTime() - Date.now();
  if (diff <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { total: diff, days, hours, minutes, seconds };
}
