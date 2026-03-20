import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExpandIcon, ShrinkIcon } from 'lucide-react';

interface ExamFiltersProps {
  statusFilter: 'all' | 'completed' | 'pending';
  difficultyFilter: string;
  sortBy: string;
  allExpanded: boolean;
  onStatusFilterChange: (value: 'all' | 'completed' | 'pending') => void;
  onDifficultyFilterChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onToggleAllSections: () => void;
}

export const ExamFilters = ({
  statusFilter,
  difficultyFilter,
  sortBy,
  allExpanded,
  onStatusFilterChange,
  onDifficultyFilterChange,
  onSortByChange,
  onToggleAllSections
}: ExamFiltersProps) => {
  return (
    <Card className="mb-8">
      <CardContent className="p-4 sm:p-6">
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          <div className="text-sm font-semibold text-foreground mb-3">Filters & Sorting</div>
          <div className="space-y-3">
            {/* Status Filter */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-muted-foreground min-w-[60px]">Status</label>
              <div className="flex gap-2 flex-1">
                <Badge 
                  variant={statusFilter === 'all' ? 'default' : 'outline'} 
                  className="text-xs px-2 py-1 cursor-pointer hover:bg-accent"
                  onClick={() => onStatusFilterChange('all')}
                >
                  All
                </Badge>
                <Badge 
                  variant={statusFilter === 'completed' ? 'default' : 'outline'} 
                  className="text-xs px-2 py-1 cursor-pointer hover:bg-accent"
                  onClick={() => onStatusFilterChange('completed')}
                >
                  Completed
                </Badge>
                <Badge 
                  variant={statusFilter === 'pending' ? 'default' : 'outline'} 
                  className="text-xs px-2 py-1 cursor-pointer hover:bg-accent"
                  onClick={() => onStatusFilterChange('pending')}
                >
                  Pending
                </Badge>
              </div>
            </div>
            
            {/* Difficulty Filter */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-muted-foreground min-w-[60px]">Difficulty</label>
              <Select value={difficultyFilter} onValueChange={onDifficultyFilterChange}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Sort By */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-muted-foreground min-w-[60px]">Sort by</label>
              <Select value={sortBy} onValueChange={onSortByChange}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="marks-high">Marks (High to Low)</SelectItem>
                  <SelectItem value="marks-low">Marks (Low to High)</SelectItem>
                  <SelectItem value="difficulty-easy">Easy First</SelectItem>
                  <SelectItem value="difficulty-hard">Hard First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Desktop/Tablet Layout */}
        <div className="hidden sm:block">
          <div className="text-sm font-semibold text-foreground mb-4">Filters & Sorting</div>
          <div className="flex flex-wrap items-center justify-between gap-4 lg:gap-6">
            <div className="flex flex-wrap items-center gap-4 lg:gap-6 flex-1">
              {/* Status Filter */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground min-w-[50px]">Status</label>
                <div className="flex gap-2">
                  <Badge 
                    variant={statusFilter === 'all' ? 'default' : 'outline'} 
                    className="text-sm px-3 py-1 cursor-pointer hover:bg-accent"
                    onClick={() => onStatusFilterChange('all')}
                  >
                    All
                  </Badge>
                  <Badge 
                    variant={statusFilter === 'completed' ? 'default' : 'outline'} 
                    className="text-sm px-3 py-1 cursor-pointer hover:bg-accent"
                    onClick={() => onStatusFilterChange('completed')}
                  >
                    Completed
                  </Badge>
                  <Badge 
                    variant={statusFilter === 'pending' ? 'default' : 'outline'} 
                    className="text-sm px-3 py-1 cursor-pointer hover:bg-accent"
                    onClick={() => onStatusFilterChange('pending')}
                  >
                    Pending
                  </Badge>
                </div>
              </div>
              
              {/* Difficulty Filter */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground min-w-[70px]">Difficulty</label>
                <Select value={difficultyFilter} onValueChange={onDifficultyFilterChange}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Sort By */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground min-w-[50px]">Sort by</label>
                <Select value={sortBy} onValueChange={onSortByChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="marks-high">Marks (High to Low)</SelectItem>
                    <SelectItem value="marks-low">Marks (Low to High)</SelectItem>
                    <SelectItem value="difficulty-easy">Easy First</SelectItem>
                    <SelectItem value="difficulty-hard">Hard First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={onToggleAllSections}
              className="flex items-center gap-2 shrink-0"
            >
              {allExpanded ? (
                <>
                  <ShrinkIcon className="h-4 w-4" />
                  Collapse All
                </>
              ) : (
                <>
                  <ExpandIcon className="h-4 w-4" />
                  Expand All
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
