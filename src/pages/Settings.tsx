import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import {
  DEFAULT_SETTINGS,
  loadLocalSettings,
  saveLocalSettings,
  ensurePermission,
  type NotificationSettings,
} from '@/lib/notifications/scheduler';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(() => loadLocalSettings());
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name,email')
        .eq('user_id', user.id)
        .maybeSingle();
      setProfileName(data?.name ?? '');
      setProfileEmail(data?.email ?? user.email ?? '');
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .upsert(
        { user_id: user.id, name: profileName.trim(), email: profileEmail.trim() },
        { onConflict: 'user_id' }
      );
    setSavingProfile(false);
    if (error) {
      toast({ title: 'Error', description: 'Could not save profile', variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
    }
  };

  // Load remote settings
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        const remote: NotificationSettings = {
          enable_all: data.enable_all,
          morning: data.morning,
          todo: data.todo,
          pomodoro: data.pomodoro,
          motivational: data.motivational,
        };
        setSettings(remote);
        saveLocalSettings(remote);
      }
    })();
  }, [user]);

  const persist = async (next: NotificationSettings) => {
    setSettings(next);
    saveLocalSettings(next);
    if (!user) return;
    const { error } = await (supabase as any)
      .from('notification_settings')
      .upsert({ user_id: user.id, ...next }, { onConflict: 'user_id' });
    if (error) {
      toast({ title: 'Error', description: 'Could not save settings', variant: 'destructive' });
    }
  };

  const update = (key: keyof NotificationSettings, value: boolean) => {
    persist({ ...settings, [key]: value });
  };

  const requestPerm = async () => {
    const ok = await ensurePermission();
    setPermission(Notification.permission);
    toast({
      title: ok ? 'Notifications enabled' : 'Permission denied',
      description: ok ? "You'll receive smart reminders." : 'Enable notifications in your browser settings.',
      variant: ok ? 'default' : 'destructive',
    });
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 max-w-3xl mx-auto pb-20">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your profile and notification preferences</p>
      </div>

      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle>
          <CardDescription>Update your display name and email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              placeholder="Your name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              placeholder="you@example.com"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Changing this updates your profile only — your login email is managed by your auth provider.
            </p>
          </div>
          <Button onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? 'Saving…' : 'Save profile'}
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Browser permission</CardTitle>
          <CardDescription>
            Notifications are sent locally by your browser. Status: <strong>{permission}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={requestPerm} disabled={permission === 'granted'}>
            {permission === 'granted' ? 'Allowed' : 'Enable notifications'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>Each can be toggled independently</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'enable_all', label: 'Enable all notifications', desc: 'Master switch' },
            { key: 'morning', label: 'Morning reminder', desc: 'Plan your day' },
            { key: 'todo', label: 'Todo reminders', desc: 'Empty list & inactivity' },
            { key: 'pomodoro', label: 'Pomodoro messages', desc: 'When a focus session ends' },
            { key: 'motivational', label: 'Motivational messages', desc: 'Progress & encouragement' },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
              <div className="min-w-0">
                <div className="text-sm font-medium">{row.label}</div>
                <div className="text-xs text-muted-foreground">{row.desc}</div>
              </div>
              <Switch
                checked={settings[row.key as keyof NotificationSettings]}
                onCheckedChange={(v) => update(row.key as keyof NotificationSettings, v)}
                disabled={row.key !== 'enable_all' && !settings.enable_all}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}