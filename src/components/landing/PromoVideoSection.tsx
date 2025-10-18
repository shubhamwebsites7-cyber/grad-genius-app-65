import React from 'react';
import { useCountryDetection } from '@/hooks/useCountryDetection';

export const PromoVideoSection = () => {
  const { isIndia, loading } = useCountryDetection();

  const indiaVideo = `<iframe width='100%' height='315' src='https://www.youtube.com/embed/TdpB3hn3WkM?si=28Ugrl03wqspco5b' title='ExamTrakr India Video' frameborder='0' allow='accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share' referrerpolicy='strict-origin-when-cross-origin' allowfullscreen></iframe>`;
  
  const globalVideo = `<iframe width='100%' height='315' src='https://www.youtube.com/embed/OQqyNGiIXtk?si=eRhPg1GhJ5r0iqLz' title='ExamTrakr Global Video' frameborder='0' allow='accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share' referrerpolicy='strict-origin-when-cross-origin' allowfullscreen></iframe>`;

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            See How ExamTrakr Helps You Study Smarter 🎯
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Track your progress, access the best resources, and stay exam-ready — all in one place. 
            Watch the video to see how ExamTrakr makes exam prep simple and effective for every student.
          </p>
        </div>
        
        <div className="relative w-full max-w-3xl mx-auto">
          {loading ? (
            <div className="aspect-video bg-muted rounded-lg animate-pulse flex items-center justify-center">
              <p className="text-muted-foreground">Loading video...</p>
            </div>
          ) : (
            <div 
              className="aspect-video rounded-lg overflow-hidden shadow-lg"
              dangerouslySetInnerHTML={{ 
                __html: isIndia ? indiaVideo : globalVideo 
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
};
