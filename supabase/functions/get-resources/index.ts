import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check auth (optional - anonymous users can browse but won't see URLs)
    let userId: string | null = null;
    let isPremium = false;

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;

        // Check premium status
        const { data: sub } = await supabase
          .from('user_subscriptions')
          .select('status, expires_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('expires_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sub && sub.status === 'active' && new Date(sub.expires_at) > new Date()) {
          isPremium = true;
        }
      }
    }

    const { topicIds, includeUserPending } = await req.json();

    if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
      return new Response(JSON.stringify({ error: 'topicIds required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch approved resources
    const { data: approvedData, error: approvedError } = await supabase
      .from('topic_resources')
      .select(`
        id, title, description, resource_type, url, is_premium,
        admin_approved, created_at, contributed_by_user_id, topic_id,
        contributor:users!topic_resources_contributed_by_user_id_fkey(id, full_name)
      `)
      .eq('is_active', true)
      .eq('admin_approved', true)
      .in('topic_id', topicIds);

    if (approvedError) throw approvedError;

    let resourcesData = approvedData || [];

    // Fetch user's pending resources if logged in
    if (userId && includeUserPending) {
      const { data: pendingData } = await supabase
        .from('topic_resources')
        .select(`
          id, title, description, resource_type, url, is_premium,
          admin_approved, created_at, contributed_by_user_id, topic_id,
          contributor:users!topic_resources_contributed_by_user_id_fkey(id, full_name)
        `)
        .eq('is_active', true)
        .eq('admin_approved', false)
        .eq('contributed_by_user_id', userId)
        .in('topic_id', topicIds);

      if (pendingData) {
        resourcesData = [...resourcesData, ...pendingData];
      }
    }

    // Strip URLs for non-premium users
    const sanitized = resourcesData.map((r: any) => ({
      ...r,
      url: isPremium ? r.url : null,
    }));

    // Fetch vote counts
    const resourceIds = sanitized.map((r: any) => r.id);
    let voteCounts: Record<string, number> = {};
    let userVotes: string[] = [];
    let userBookmarks: string[] = [];

    if (resourceIds.length > 0) {
      const { data: votes } = await supabase
        .from('resource_votes')
        .select('resource_id')
        .in('resource_id', resourceIds);

      if (votes) {
        for (const v of votes as any[]) {
          voteCounts[v.resource_id] = (voteCounts[v.resource_id] || 0) + 1;
        }
      }

      if (userId) {
        const { data: uv } = await supabase
          .from('resource_votes')
          .select('resource_id')
          .eq('user_id', userId)
          .in('resource_id', resourceIds);

        if (uv) userVotes = (uv as any[]).map((v: any) => v.resource_id);

        const { data: bm } = await supabase
          .from('user_resource_bookmarks')
          .select('resource_id')
          .eq('user_id', userId)
          .in('resource_id', resourceIds);

        if (bm) userBookmarks = (bm as any[]).map((b: any) => b.resource_id);
      }
    }

    return new Response(JSON.stringify({
      resources: sanitized,
      voteCounts,
      userVotes,
      userBookmarks,
      isPremium,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('get-resources error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
