import { useEffect, useState } from 'react';

export function EnvCheck() {
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean;
    supabaseKey: boolean;
  }>({ supabaseUrl: false, supabaseKey: false });

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    setEnvStatus({
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey
    });

    console.log('Environment check:', {
      supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
      supabaseKey: supabaseKey ? 'Set' : 'Missing',
      url: supabaseUrl
    });
  }, []);

  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs">
        <div>Supabase URL: {envStatus.supabaseUrl ? '✅' : '❌'}</div>
        <div>Supabase Key: {envStatus.supabaseKey ? '✅' : '❌'}</div>
      </div>
    );
  }

  return null;
}
