import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Target } from 'lucide-react';

interface ExamHeaderProps {
  name: string;
  type: string;
  enrolledStudents: string;
  subjectsCount: number;
  totalTopics: number;
  totalMarks?: number;
}

export const ExamHeader = ({ name, type, enrolledStudents, subjectsCount, totalTopics, totalMarks }: ExamHeaderProps) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{name}</h1>
        <p className="text-muted-foreground text-lg">{type}</p>
      </div>
      
      {/* Desktop Stats */}
      <div className="hidden sm:flex flex-wrap gap-4">
        <div className="flex items-center gap-2 text-success">
          <Users className="h-5 w-5" />
          <span className="font-medium">{enrolledStudents} students</span>
        </div>
        <Badge className="bg-primary/10 text-primary pointer-events-none">
          <BookOpen className="h-3 w-3 mr-1" />
          {subjectsCount} Subjects
        </Badge>
        <Badge className="bg-secondary/10 text-secondary pointer-events-none">
          <Target className="h-3 w-3 mr-1" />
          {totalTopics} Topics
        </Badge>
        {totalMarks && (
          <Badge variant="outline" className="text-sm px-3 py-1 pointer-events-none">
            Total: {totalMarks} marks
          </Badge>
        )}
      </div>
    </div>
  );
};
