import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Target } from 'lucide-react';

interface ExamProgressProps {
  progress: number;
  completedTopics: number;
  totalTopics: number;
  enrolledStudents: string;
  subjectsCount: number;
}

const getProgressVariant = (progress: number) => {
  if (progress >= 61) return 'success';
  if (progress >= 31) return 'warning';
  return 'destructive';
};

export const ExamProgress = ({ 
  progress, 
  completedTopics, 
  totalTopics,
  enrolledStudents,
  subjectsCount
}: ExamProgressProps) => {
  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
              <span className="text-2xl font-bold text-primary">{progress}%</span>
            </div>
            <Progress 
              value={progress} 
              variant={getProgressVariant(progress)}
              className="h-3" 
            />
            <p className="text-sm text-muted-foreground mt-2">
              {completedTopics} of {totalTopics} topics completed
            </p>
            
            {/* Mobile Stats */}
            <div className="flex sm:hidden flex-wrap gap-2 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-1 text-success text-sm">
                <Users className="h-4 w-4" />
                <span className="font-medium">{enrolledStudents} students</span>
              </div>
              <Badge className="bg-primary/10 text-primary text-xs">
                <BookOpen className="h-3 w-3 mr-1" />
                {subjectsCount} Subjects
              </Badge>
              <Badge className="bg-secondary/10 text-secondary text-xs">
                <Target className="h-3 w-3 mr-1" />
                {totalTopics} Topics
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
