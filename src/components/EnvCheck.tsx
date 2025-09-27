import { useEffect, useState } from 'react';

export function EnvCheck() {
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean;
    supabaseKey: boolean;
    details: any;
  }>({ supabaseUrl: false, supabaseKey: false, details: {} });

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const details = {
      supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
      supabaseKey: supabaseKey ? 'Set' : 'Missing',
      url: supabaseUrl,
      keyLength: supabaseKey ? supabaseKey.length : 0,
      env: import.meta.env
    };
    
    setEnvStatus({
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      details
    });

    console.log('Environment check:', details);
  }, []);

  // Show in both development and production for debugging
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs max-w-xs">
      <div>Supabase URL: {envStatus.supabaseUrl ? '✅' : '❌'}</div>
      <div>Supabase Key: {envStatus.supabaseKey ? '✅' : '❌'}</div>
      {envStatus.details.url && (
        <div className="text-xs opacity-75 mt-1">
          URL: {envStatus.details.url.substring(0, 30)}...
        </div>
      )}
      {envStatus.details.keyLength > 0 && (
        <div className="text-xs opacity-75">
          Key Length: {envStatus.details.keyLength}
        </div>
      )}
    </div>
  );
}
