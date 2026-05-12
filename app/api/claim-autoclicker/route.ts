import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const MAX_CLAIM_SECONDS = 8 * 3600; // cap at 8h of accumulated clicks
const CREDITS_PER_CLICK = 1;        // each auto-click earns 1 credit

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const admin = adminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("credits, autoclicker_until, autoclicker_last_claimed, autoclicker_rate, total_clicks, xp, level")
      .eq("id", user.id)
      .single();

    if (!profile) return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });

    if (!profile.autoclicker_until || new Date(profile.autoclicker_until) <= new Date(0)) {
      return NextResponse.json({ error: "No tenés autoclicker activo." }, { status: 400 });
    }

    const now = new Date();
    const lastClaimed = profile.autoclicker_last_claimed ? new Date(profile.autoclicker_last_claimed) : now;
    const activeUntil = new Date(profile.autoclicker_until);

    // Only count time within active window
    const claimFrom = lastClaimed;
    const claimTo = now < activeUntil ? now : activeUntil;

    if (claimTo <= claimFrom) {
      return NextResponse.json({ clicks: 0, credits: 0, message: "Nada que reclamar." });
    }

    const elapsedSeconds = Math.min((claimTo.getTime() - claimFrom.getTime()) / 1000, MAX_CLAIM_SECONDS);
    const rate = profile.autoclicker_rate ?? 1;
    const clickCount = Math.floor(elapsedSeconds * rate);

    if (clickCount < 1) {
      return NextResponse.json({ clicks: 0, credits: 0, message: "Nada que reclamar aún." });
    }

    const creditsEarned = clickCount * CREDITS_PER_CLICK;
    const XP_PER_CLICK = 2;
    const newXp = (profile.xp ?? 0) + XP_PER_CLICK * clickCount;
    const newClicks = (profile.total_clicks ?? 0) + clickCount;
    const newCredits = (profile.credits ?? 0) + creditsEarned;

    await admin.from("profiles").update({
      credits: newCredits,
      total_clicks: newClicks,
      xp: newXp,
      autoclicker_last_claimed: now.toISOString(),
    }).eq("id", user.id);

    await admin.from("credit_transactions").insert({
      user_id: user.id,
      amount: creditsEarned,
      reason: "autoclicker_claim",
      ref_id: null,
    });

    return NextResponse.json({ success: true, clicks: clickCount, credits: creditsEarned });
  } catch (err) {
    console.error("claim-autoclicker error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
