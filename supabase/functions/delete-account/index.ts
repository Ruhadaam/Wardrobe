import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing environment variables')
        }

        // Create Supabase client with Service Role Key (to have admin privileges)
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // 1. Get User ID from JWT
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('No authorization header')

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        const userId = user.id
        console.log(`[DeleteAccount] Starting full wipe for user: ${userId}`)

        // 2. Delete from Storage (uploads/{userId}/*)
        // List all files in the user's folder
        const { data: files, error: listError } = await supabaseAdmin.storage
            .from('uploads')
            .list(userId, { limit: 1000 })

        if (listError) {
            console.error('[DeleteAccount] Error listing files:', listError)
        } else if (files && files.length > 0) {
            const pathsToDelete = files.map(file => `${userId}/${file.name}`)
            const { error: removeError } = await supabaseAdmin.storage
                .from('uploads')
                .remove(pathsToDelete)

            if (removeError) {
                console.error('[DeleteAccount] Error removing files:', removeError)
            } else {
                console.log(`[DeleteAccount] Deleted ${pathsToDelete.length} files from storage`)
            }
        }

        // 3. Delete from DB Tables (Cascading handles some, but we'll be explicit)
        // Clothes
        const { error: clothesError } = await supabaseAdmin
            .from('clothes')
            .delete()
            .eq('user_id', userId)
        if (clothesError) console.error('[DeleteAccount] Error deleting clothes:', clothesError)

        // Outfits
        const { error: outfitsError } = await supabaseAdmin
            .from('outfits')
            .delete()
            .eq('user_id', userId)
        if (outfitsError) console.error('[DeleteAccount] Error deleting outfits:', outfitsError)

        // Users (Public Profile)
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId)
        if (profileError) console.error('[DeleteAccount] Error deleting profile:', profileError)

        // 4. Delete from Auth.Users (CRITICAL)
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (authDeleteError) {
            console.error('[DeleteAccount] Error deleting from auth.users:', authDeleteError)
            throw authDeleteError
        }

        console.log(`[DeleteAccount] Successfully deleted user: ${userId}`)

        return new Response(
            JSON.stringify({ success: true, message: 'Account and all data deleted successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('[DeleteAccount] Error:', error.message)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
