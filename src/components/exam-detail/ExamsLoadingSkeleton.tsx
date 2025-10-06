import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const ExamsLoadingSkeleton = () => {
  return (
    <main className="flex-1 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <Skeleton className="h-9 w-32 mb-4" />
          
          {/* Search Bar */}
          <Skeleton className="h-12 w-full mb-6" />

          {/* Toolbar */}
          <div className="flex gap-4 mb-8">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-32 ml-auto" />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-3 sm:p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-6 w-20" />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
    </main>
  );
};
