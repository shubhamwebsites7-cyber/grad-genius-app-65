import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch ALL user_exam_progress using service role (bypasses RLS)
    const allProgress: any[] = [];
    const batchSize = 1000;
    let offset = 0;

    while (true) {
      const { data, error } = await supabase
        .from("user_exam_progress")
        .select("user_id, completed_topics, total_topics, progress_percentage, exam_id")
        .range(offset, offset + batchSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;
      allProgress.push(...data);
      if (data.length < batchSize) break;
      offset += batchSize;
    }

    // Aggregate per user
    const userMap = new Map<string, {
      total_completed: number;
      total_topics: number;
      progress_sum: number;
      exam_count: number;
    }>();

    allProgress.forEach((row: any) => {
      const existing = userMap.get(row.user_id) || {
        total_completed: 0, total_topics: 0, progress_sum: 0, exam_count: 0,
      };
      existing.total_completed += row.completed_topics || 0;
      existing.total_topics += row.total_topics || 0;
      existing.progress_sum += Number(row.progress_percentage) || 0;
      existing.exam_count += 1;
      userMap.set(row.user_id, existing);
    });

    // Fetch user names using service role
    const userIds = Array.from(userMap.keys());
    let usersData: any[] = [];
    if (userIds.length > 0) {
      // Batch fetch users in chunks to avoid query limits
      for (let i = 0; i < userIds.length; i += 100) {
        const chunk = userIds.slice(i, i + 100);
        const { data } = await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", chunk);
        if (data) usersData.push(...data);
      }
    }

    const usersMap = new Map<string, { full_name: string; email: string }>();
    usersData.forEach((u: any) => {
      usersMap.set(u.id, { full_name: u.full_name, email: u.email });
    });

    // Build leaderboard
    const entries: any[] = [];
    userMap.forEach((stats, userId) => {
      const userInfo = usersMap.get(userId);
      entries.push({
        user_id: userId,
        full_name: userInfo?.full_name || "Unknown",
        email: userInfo?.email || "",
        total_completed_topics: stats.total_completed,
        total_topics: stats.total_topics,
        avg_progress: stats.exam_count > 0 ? stats.progress_sum / stats.exam_count : 0,
        exams_enrolled: stats.exam_count,
      });
    });

    // Sort by completed topics desc, then avg progress
    entries.sort((a: any, b: any) => {
      if (b.total_completed_topics !== a.total_completed_topics) {
        return b.total_completed_topics - a.total_completed_topics;
      }
      return b.avg_progress - a.avg_progress;
    });

    return new Response(JSON.stringify({ leaderboard: entries }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
