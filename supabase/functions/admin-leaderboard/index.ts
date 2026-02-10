import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch ALL progress data using service role (bypasses RLS)
    const allProgress: any[] = []
    const batchSize = 1000
    let offset = 0

    while (true) {
      const { data, error } = await adminClient
        .from('user_exam_progress')
        .select('user_id, completed_topics, total_topics, progress_percentage, exam_id')
        .range(offset, offset + batchSize - 1)

      if (error) throw error
      if (!data || data.length === 0) break
      allProgress.push(...data)
      if (data.length < batchSize) break
      offset += batchSize
    }

    // Fetch all users
    const userIds = [...new Set(allProgress.map(r => r.user_id))]
    const allUsers: any[] = []
    // Batch user fetches in chunks of 100
    for (let i = 0; i < userIds.length; i += 100) {
      const chunk = userIds.slice(i, i + 100)
      const { data: usersData, error: usersError } = await adminClient
        .from('users')
        .select('id, full_name, email')
        .in('id', chunk)

      if (usersError) throw usersError
      if (usersData) allUsers.push(...usersData)
    }

    // Aggregate per user
    const userMap = new Map<string, {
      total_completed: number
      total_topics: number
      progress_sum: number
      exam_count: number
    }>()

    allProgress.forEach((row) => {
      const existing = userMap.get(row.user_id) || {
        total_completed: 0, total_topics: 0, progress_sum: 0, exam_count: 0,
      }
      existing.total_completed += row.completed_topics || 0
      existing.total_topics += row.total_topics || 0
      existing.progress_sum += Number(row.progress_percentage) || 0
      existing.exam_count += 1
      userMap.set(row.user_id, existing)
    })

    const usersMap = new Map(allUsers.map(u => [u.id, u]))

    const entries = Array.from(userMap.entries()).map(([userId, stats]) => {
      const userInfo = usersMap.get(userId)
      return {
        user_id: userId,
        full_name: userInfo?.full_name || 'Unknown',
        email: userInfo?.email || '',
        total_completed_topics: stats.total_completed,
        total_topics: stats.total_topics,
        avg_progress: stats.exam_count > 0 ? stats.progress_sum / stats.exam_count : 0,
        exams_enrolled: stats.exam_count,
      }
    })

    entries.sort((a, b) => {
      if (b.total_completed_topics !== a.total_completed_topics) {
        return b.total_completed_topics - a.total_completed_topics
      }
      return b.avg_progress - a.avg_progress
    })

    return new Response(JSON.stringify(entries), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
