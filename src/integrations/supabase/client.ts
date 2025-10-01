import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Direct Supabase configuration (no environment variables)
const supabaseUrl = 'https://jzindaoigqrryvssgmwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6aW5kYW9pZ3Fycnl2c3NnbXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NzUwMjAsImV4cCI6MjA3MjQ1MTAyMH0.XQvwlJ7jU9dR-qC_lWcJivZS4eVXzsvzmqK2diqUApQ';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'track-my-gain-app'
    }
  }
});