import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeletionRequest {
  name: string;
  email: string;
  phone?: string;
  reason?: string;
  confirmed: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the request body
    const requestData: DeletionRequest = await req.json();
    
    console.log('Received deletion request for email:', requestData.email);

    // Validate required fields
    if (!requestData.name || !requestData.email || !requestData.confirmed) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: name, email, and confirmation are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user ID if the user is authenticated
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        userId = user.id;
        console.log('Request from authenticated user:', userId);
      }
    }

    // Check if there's already a pending request for this email
    const { data: existingRequest, error: checkError } = await supabase
      .from('account_deletion_requests')
      .select('id, status')
      .eq('email', requestData.email)
      .in('status', ['pending', 'processing'])
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing requests:', checkError);
      throw checkError;
    }

    if (existingRequest) {
      return new Response(
        JSON.stringify({ 
          error: 'A deletion request for this email is already pending',
          requestId: existingRequest.id 
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert the deletion request
    const { data: deletionRequest, error: insertError } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: userId,
        name: requestData.name,
        email: requestData.email.toLowerCase(),
        phone: requestData.phone || null,
        reason: requestData.reason || null,
        confirmed: requestData.confirmed,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting deletion request:', insertError);
      throw insertError;
    }

    console.log('Deletion request created successfully:', deletionRequest.id);

    // TODO: Send confirmation email to user
    // TODO: Notify admin team about new deletion request

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Your account deletion request has been submitted successfully. We will process it within 7 business days.',
        requestId: deletionRequest.id,
        requestedAt: deletionRequest.requested_at
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing deletion request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to submit deletion request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
