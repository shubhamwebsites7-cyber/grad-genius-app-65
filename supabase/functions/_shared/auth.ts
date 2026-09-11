import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function serviceClient() {
  return createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
}

export async function authenticatedUser(request: Request) {
  const header = request.headers.get('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  const client = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
  const { data: { user } } = await client.auth.getUser(token);
  return user;
}

export async function isAdmin(userId: string) {
  const { data } = await serviceClient().from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
  return Boolean(data);
}