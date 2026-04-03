interface CircularProgressProps {
  progress: number;
  completedTopics: number;
  totalTopics: number;
  isEnrolled: boolean;
}

export const CircularProgress = ({ progress, completedTopics, totalTopics, isEnrolled }: CircularProgressProps) => {
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress >= 61) return 'hsl(var(--success))';
    if (progress >= 31) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isEnrolled ? getColor() : 'hsl(var(--muted))'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isEnrolled ? offset : circumference}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-foreground">
            {isEnrolled ? `${progress}%` : '0%'}
          </span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Overall Progress</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isEnrolled ? completedTopics : 0} of {totalTopics} topics completed
        </p>
      </div>
    </div>
  );
};
