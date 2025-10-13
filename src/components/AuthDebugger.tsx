import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AuthDebuggerProps {
  enabled?: boolean;
}

export const AuthDebugger: React.FC<AuthDebuggerProps> = ({ enabled = false }) => {
  const { user, session, loading } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const addLog = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
    };

    addLog(`Auth state - User: ${user?.id || 'null'}, Loading: ${loading}`);

    // Monitor auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Auth event: ${event}, Session: ${session?.user?.id || 'null'}`);
    });

    return () => subscription.unsubscribe();
  }, [user, session, loading, enabled]);

  if (!enabled || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <div className="font-bold mb-2">Auth Debug</div>
      <div className="space-y-1">
        <div>User: {user?.email || 'Not logged in'}</div>
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>Session: {session ? 'Active' : 'None'}</div>
      </div>
      <div className="mt-2 border-t border-gray-600 pt-2">
        <div className="font-semibold mb-1">Recent Events:</div>
        {logs.map((log, index) => (
          <div key={index} className="text-gray-300">{log}</div>
        ))}
      </div>
    </div>
  );
};
