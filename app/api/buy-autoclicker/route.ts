import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { AUTOCLICKER_PLANS } from "@/lib/autoclicker";

export { AUTOCLICKER_PLANS };

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json() as { plan: string };
    const planDef = AUTOCLICKER_PLANS[plan];
    if (!planDef) return NextResponse.json({ error: "Plan inválido." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const admin = adminClient();

    const { data: profile } = await admin.from("profiles").select("credits, autoclicker_until").eq("id", user.id).single();
    if (!profile) return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });

    if (profile.credits < planDef.price) {
      return NextResponse.json({ error: "No tenés suficientes créditos." }, { status: 400 });
    }

    // Extend from current expiry or from now
    const base = profile.autoclicker_until && new Date(profile.autoclicker_until) > new Date()
      ? new Date(profile.autoclicker_until)
      : new Date();
    const newUntil = new Date(base.getTime() + planDef.hours * 3600 * 1000).toISOString();
    const now = new Date().toISOString();

    await admin.from("profiles").update({
      credits: profile.credits - planDef.price,
      autoclicker_until: newUntil,
      autoclicker_last_claimed: now,
      autoclicker_rate: planDef.rate,
    }).eq("id", user.id);

    await admin.from("credit_transactions").insert({
      user_id: user.id,
      amount: -planDef.price,
      reason: "autoclicker",
      ref_id: plan,
    });

    return NextResponse.json({ success: true, autoclicker_until: newUntil });
  } catch (err) {
    console.error("buy-autoclicker error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
