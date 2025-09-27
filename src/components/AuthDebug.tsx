import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      setDebugInfo({
        hasSession: !!session,
        userEmail: session?.user?.email,
        error: error?.message,
        url: window.location.href,
        hash: window.location.hash,
        search: window.location.search
      });
    };

    checkAuth();
  }, []);

  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed top-4 left-4 bg-black text-white p-2 rounded text-xs max-w-sm">
        <div className="font-bold mb-2">Auth Debug</div>
        <div>Session: {debugInfo.hasSession ? '✅' : '❌'}</div>
        <div>User: {debugInfo.userEmail || 'None'}</div>
        <div>Error: {debugInfo.error || 'None'}</div>
        <div>URL: {debugInfo.url}</div>
        {debugInfo.hash && <div>Hash: {debugInfo.hash}</div>}
        {debugInfo.search && <div>Search: {debugInfo.search}</div>}
      </div>
    );
  }

  return null;
}
