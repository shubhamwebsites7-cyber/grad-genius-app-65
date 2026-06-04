import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

type IntervalMin = 25 | 45 | 60;
const STORAGE_KEY = 'goalgrip.focusCheck';

interface Settings {
  enabled: boolean;
  interval: IntervalMin;
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, interval: 25 };
}

export function FocusAccountability({ running }: { running: boolean }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(7);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Schedule reminders only while focus is running and enabled
  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!running || !settings.enabled) {
      startRef.current = null;
      return;
    }
    startRef.current = Date.now();
    const ms = settings.interval * 60 * 1000;
    timerRef.current = window.setInterval(() => {
      setRating(7);
      setOpen(true);
    }, ms);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [running, settings.enabled, settings.interval]);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    const suggestedBreak = rating < 6;
    try {
      await (supabase as any).from('focus_ratings').insert([
        {
          user_id: user.id,
          rating,
          interval_minutes: settings.interval,
          suggested_break: suggestedBreak,
        },
      ]);
      toast({
        title: suggestedBreak ? 'Take a short break' : 'Keep going!',
        description: suggestedBreak
          ? 'Your focus is low — step away for a few minutes.'
          : 'Great focus. Stay on task.',
      });
    } catch (e) {
      toast({ title: 'Error', description: 'Could not save rating', variant: 'destructive' });
    } finally {
      setSubmitting(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Card className="mt-4 sm:mt-6">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Focus Accountability</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              checked={settings.enabled}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, enabled: v }))}
              id="focus-check"
            />
            <label htmlFor="focus-check" className="text-sm font-medium">
              Enable focus check reminders
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Every</span>
            <Select
              value={String(settings.interval)}
              onValueChange={(v) => setSettings((s) => ({ ...s, interval: Number(v) as IntervalMin }))}
              disabled={!settings.enabled}
            >
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you actually focused?</DialogTitle>
            <DialogDescription>
              Rate your current focus from 1 to 10. Scores below 6 will suggest a short break.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="text-center text-4xl font-bold">{rating}</div>
            <Slider
              value={[rating]}
              min={1}
              max={10}
              step={1}
              onValueChange={(v) => setRating(v[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Distracted</span>
              <span>In the zone</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Dismiss</Button>
            <Button onClick={submit} disabled={submitting}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}