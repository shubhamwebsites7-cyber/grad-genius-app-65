import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const DashboardLoadingSkeleton = () => {
  return (
    <main className="flex-1 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col lg:flex-row lg:justify-between">
            <div>
              <Skeleton className="h-9 w-32 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            <div className="mt-4 lg:mt-0 space-y-4">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
              <Skeleton className="h-4 w-64" />
            </div>
          </div>

          {/* Overall Progress Card */}
          <Card className="mb-8">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Enrolled Exams */}
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <div className="space-y-3">
                    {[1, 2].map((j) => (
                      <div key={j} className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-1.5 w-full" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
    </main>
  );
};
