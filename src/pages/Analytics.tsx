import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import journeyVideo from '@/assets/avatar-journey.mp4.asset.json';

const TOTAL_SECONDS = 10;

export default function Analytics() {
  const { user } = useAuth();
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    supabase
      .from('tasks')
      .select('completed')
      .eq('user_id', user.id)
      .eq('date', today)
      .then(({ data }) => {
        const rows = data || [];
        setTotal(rows.length);
        setCompleted(rows.filter((t: any) => t.completed).length);
      });
  }, [user]);

  // Loop video from 0 → completed seconds
  const playableSeconds = Math.min(TOTAL_SECONDS, Math.max(0, completed));

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playableSeconds <= 0) {
      v.pause();
      v.currentTime = 0;
      return;
    }
    const onTime = () => {
      if (v.currentTime >= playableSeconds) {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
    };
    v.currentTime = 0;
    v.play().catch(() => {});
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, [playableSeconds]);

  const pct = Math.round((completed / TOTAL_SECONDS) * 100);

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 max-w-3xl mx-auto pb-20">
      <div className="mb-4 sm:mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">My Journey</h1>
        <p className="text-muted-foreground text-sm">Complete tasks to unlock your full power.</p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6 flex flex-col items-center gap-4">
          <div className="relative w-full max-w-sm aspect-[9/16] rounded-xl overflow-hidden bg-muted">
            <video
              ref={videoRef}
              src={journeyVideo.url}
              className="w-full h-full object-cover"
              muted
              playsInline
              autoPlay
              loop={false}
              controls={false}
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
            />
            {playableSeconds === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-center p-4">
                <p className="text-sm text-muted-foreground">Complete a task to unlock your journey</p>
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{completed} / {TOTAL_SECONDS} seconds unlocked</div>
            <div className="text-sm text-muted-foreground mt-1">
              {completed} task{completed === 1 ? '' : 's'} completed today
            </div>
          </div>
          <div className="w-full max-w-md">
            <div className="relative w-full h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground text-center mt-2">
              {pct}% of today's reel — keep going!
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}