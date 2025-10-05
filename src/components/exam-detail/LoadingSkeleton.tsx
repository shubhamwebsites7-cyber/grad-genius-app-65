import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const ExamDetailLoadingSkeleton = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Skeleton className="h-10 w-32 mb-6" />

          {/* Header */}
          <div className="mb-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-6 w-40" />
          </div>

          {/* Progress Card */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>

          {/* Filters Card */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-48" />
              </div>
            </CardContent>
          </Card>

          {/* Subject Cards */}
          {[1, 2, 3].map((i) => (
            <Card key={i} className="mb-6">
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};
