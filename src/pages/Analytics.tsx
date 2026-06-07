import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import avatar1 from '@/assets/avatar-1.jpg';
import avatar2 from '@/assets/avatar-2.jpg';
import avatar3 from '@/assets/avatar-3.jpg';
import avatar4 from '@/assets/avatar-4.jpg';
import avatar5 from '@/assets/avatar-5.jpg';
import avatar6 from '@/assets/avatar-6.jpg';
import avatar7 from '@/assets/avatar-7.jpg';
import avatar8 from '@/assets/avatar-8.jpg';
import avatar9 from '@/assets/avatar-9.jpg';
import avatar10 from '@/assets/avatar-10.jpg';

const AVATARS = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7, avatar8, avatar9, avatar10];
const STAGE_LABELS = [
  'Rusty Beginner',
  'Waking Up',
  'Shedding Rust',
  'Half Human',
  'Almost There',
  'Real Student',
  'Confident Learner',
  'Sharp Achiever',
  'Top Performer',
  'Graduation Champion',
];

export default function Analytics() {
  const { user } = useAuth();
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);

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

  const stage = Math.min(9, completed);
  const avatar = AVATARS[stage];
  const label = STAGE_LABELS[stage];
  const pct = Math.round((completed / 10) * 100);

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 max-w-3xl mx-auto pb-20">
      <div className="mb-4 sm:mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">My Avatar Journey</h1>
        <p className="text-muted-foreground text-sm">Complete tasks to evolve your student avatar</p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6 flex flex-col items-center gap-4">
          <div className="relative w-full max-w-md aspect-square rounded-xl overflow-hidden bg-muted">
            <img
              key={stage}
              src={avatar}
              alt={`Student avatar stage ${stage + 1}: ${label}`}
              width={1024}
              height={1024}
              className="w-full h-full object-cover animate-fade-in"
              loading="lazy"
            />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{label}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {completed} / 10 tasks completed today · Stage {stage + 1} of 10
            </div>
          </div>
          <div className="w-full max-w-md">
            <div className="relative w-full h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-green-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground text-center mt-2">
              {pct}% to peak form — keep going!
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}