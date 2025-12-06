import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { path } = await req.json();

        if (!path) {
            throw new Error('Path is required');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

        // WARNING: SUPABASE_SERVICE_ROLE_KEY bypasses RLS. Use with caution.
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseServiceKey) {
            throw new Error('Service Role Key is missing!');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        console.log(`[delete-image] Deleting file: ${path}`);

        const { data, error } = await supabase
            .storage
            .from('uploads')
            .remove([path]);

        if (error) {
            console.error('[delete-image] Storage error:', error);
            throw error;
        }

        console.log('[delete-image] Success:', data);

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('[delete-image] Error:', error);
        // Return 200 even on error so the client can read the error message easily
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
});
