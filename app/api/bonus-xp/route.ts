import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { calculateLevel } from "@/lib/xp";

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const LEGENDARY_RARITIES = ["legendario", "extraterrestre", "en_el_ort"];
const MAX_BONUS_PER_MINUTE = 10;

// Simple in-memory rate limiter (resets on function cold start)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { bonus_xp } = await request.json() as { bonus_xp: number };
    if (!bonus_xp || bonus_xp < 1 || bonus_xp > 13) {
      return NextResponse.json({ error: "Inválido." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    // Rate limit
    const now = Date.now();
    const bucket = rateLimiter.get(user.id) ?? { count: 0, resetAt: now + 60000 };
    if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + 60000; }
    if (bucket.count >= MAX_BONUS_PER_MINUTE) {
      return NextResponse.json({ error: "Rate limit." }, { status: 429 });
    }
    bucket.count++;
    rateLimiter.set(user.id, bucket);

    const admin = adminClient();

    // Verify user actually has a legendary+ equipped
    const { data: profile } = await admin
      .from("profiles")
      .select("xp, equipped_chupete_id")
      .eq("id", user.id)
      .single();

    if (!profile?.equipped_chupete_id) {
      return NextResponse.json({ error: "No tenés un chupete equipado." }, { status: 400 });
    }

    const { data: equipped } = await admin
      .from("inventory")
      .select("item:items(rarity)")
      .eq("id", profile.equipped_chupete_id)
      .single();

    const rarity = (equipped?.item as unknown as { rarity: string } | null)?.rarity ?? "";
    if (!LEGENDARY_RARITIES.includes(rarity)) {
      return NextResponse.json({ error: "El chupete equipado no es legendario+." }, { status: 400 });
    }

    const newXp = (profile.xp ?? 0) + bonus_xp;
    const { level } = calculateLevel(newXp);

    await admin.from("profiles").update({ xp: newXp, level }).eq("id", user.id);

    return NextResponse.json({ xp_gained: bonus_xp, new_xp: newXp, level });
  } catch (err) {
    console.error("bonus-xp error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
