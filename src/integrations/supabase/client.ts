import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://bjndsotwbzmuqwdikdaq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqbmRzb3R3YnptdXF3ZGlrZGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjcyNjIsImV4cCI6MjA3NTI0MzI2Mn0.RCa2K8tyoTJnbaXmypWQNfP5-rg3dc_5wzDqL5rep5s';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
