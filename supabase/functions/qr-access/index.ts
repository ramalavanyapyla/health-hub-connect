import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token || token.length < 16) {
      return new Response(JSON.stringify({ error: "Invalid or missing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from("qr_access_tokens")
      .select("*, patients(id, patient_uid, user_id)")
      .eq("token", token)
      .eq("is_active", true)
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Token not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiration
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Token has expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update usage stats
    await supabase
      .from("qr_access_tokens")
      .update({ last_used_at: new Date().toISOString(), use_count: tokenData.use_count + 1 })
      .eq("id", tokenData.id);

    const patientUserId = tokenData.patients?.user_id;
    const patientId = tokenData.patients?.id;

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, blood_group, gender, date_of_birth, emergency_contact_name, emergency_contact_phone, phone, address")
      .eq("user_id", patientUserId)
      .single();

    if (tokenData.access_level === "emergency") {
      // Emergency: only critical info
      return new Response(JSON.stringify({
        access_level: "emergency",
        patient_uid: tokenData.patients?.patient_uid,
        name: profile?.full_name,
        blood_group: profile?.blood_group,
        gender: profile?.gender,
        date_of_birth: profile?.date_of_birth,
        emergency_contact: {
          name: profile?.emergency_contact_name,
          phone: profile?.emergency_contact_phone,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Full access: include medical records
    const { data: records } = await supabase
      .from("medical_records")
      .select("title, record_type, diagnosis, prescription, record_date, notes")
      .eq("patient_id", patientId)
      .order("record_date", { ascending: false })
      .limit(20);

    return new Response(JSON.stringify({
      access_level: "full",
      patient_uid: tokenData.patients?.patient_uid,
      name: profile?.full_name,
      blood_group: profile?.blood_group,
      gender: profile?.gender,
      date_of_birth: profile?.date_of_birth,
      phone: profile?.phone,
      address: profile?.address,
      emergency_contact: {
        name: profile?.emergency_contact_name,
        phone: profile?.emergency_contact_phone,
      },
      medical_records: records || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("QR access error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
