import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const MAX_CLAIM_SECONDS = 8 * 3600;

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function xpForNextLevel(level: number): number {
  if (level <= 100) return 150 + (level - 1) * 50;
  return Math.floor(5100 * Math.pow(1.08, level - 100));
}

function calculateLevelFromXp(totalXp: number): number {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level++;
    if (level > 9999) break;
  }
  return level;
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

    const claimFrom = lastClaimed;
    const claimTo = now < activeUntil ? now : activeUntil;

    if (claimTo <= claimFrom) {
      return NextResponse.json({ clicks: 0, xp_gained: 0, message: "Nada que reclamar." });
    }

    const elapsedSeconds = Math.min((claimTo.getTime() - claimFrom.getTime()) / 1000, MAX_CLAIM_SECONDS);
    const rate = profile.autoclicker_rate ?? 1;
    const clickCount = Math.floor(elapsedSeconds * rate);

    if (clickCount < 1) {
      return NextResponse.json({ clicks: 0, xp_gained: 0, message: "Nada que reclamar aún." });
    }

    const XP_PER_CLICK = 2;
    const xpGained = XP_PER_CLICK * clickCount;
    const newXp = (profile.xp ?? 0) + xpGained;
    const newClicks = (profile.total_clicks ?? 0) + clickCount;
    const newLevel = calculateLevelFromXp(newXp);

    await admin.from("profiles").update({
      total_clicks: newClicks,
      xp: newXp,
      level: newLevel,
      autoclicker_last_claimed: now.toISOString(),
    }).eq("id", user.id);

    return NextResponse.json({ success: true, clicks: clickCount, xp_gained: xpGained });
  } catch (err) {
    console.error("claim-autoclicker error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
