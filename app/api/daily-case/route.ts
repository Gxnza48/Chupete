import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { rollRarity, DAILY_CASE_COOLDOWN_HOURS } from "@/lib/cases";
import type { RarityKey } from "@/lib/rarities";

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const DAILY_RARITIES = [
  { rarity: "comun" as RarityKey, weight: 55 },
  { rarity: "poco_comun" as RarityKey, weight: 38 },
  { rarity: "medio_raro" as RarityKey, weight: 5 },
  { rarity: "legendario" as RarityKey, weight: 2 },
];

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const admin = adminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("credits, last_daily_case_at")
      .eq("id", user.id)
      .single();

    if (!profile) return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });

    // Check cooldown
    if (profile.last_daily_case_at) {
      const lastOpened = new Date(profile.last_daily_case_at).getTime();
      const hoursAgo = (Date.now() - lastOpened) / (1000 * 60 * 60);
      if (hoursAgo < DAILY_CASE_COOLDOWN_HOURS) {
        const nextOpenAt = new Date(lastOpened + DAILY_CASE_COOLDOWN_HOURS * 60 * 60 * 1000);
        return NextResponse.json({
          error: "Ya abriste tu caja diaria.",
          next_open_at: nextOpenAt.toISOString(),
        }, { status: 429 });
      }
    }

    // 65% chance of credits, 35% chance of item
    const giveItem = Math.random() < 0.35;
    const now = new Date().toISOString();

    if (!giveItem) {
      const credits = Math.floor(Math.random() * 251) + 50; // 50–300 cr.
      await admin.from("profiles").update({
        credits: (profile.credits ?? 0) + credits,
        last_daily_case_at: now,
      }).eq("id", user.id);
      await admin.from("credit_transactions").insert({
        user_id: user.id, amount: credits, reason: "daily_case", ref_id: "daily",
      });
      return NextResponse.json({ type: "credits", credits_won: credits });
    }

    // Roll item
    const rarity = rollRarity(DAILY_RARITIES);
    const { data: items } = await admin.from("items").select("id, name, rarity, image_url").eq("rarity", rarity);

    if (!items || items.length === 0) {
      // Fallback to credits
      const credits = Math.floor(Math.random() * 201) + 50;
      await admin.from("profiles").update({ credits: (profile.credits ?? 0) + credits, last_daily_case_at: now }).eq("id", user.id);
      return NextResponse.json({ type: "credits", credits_won: credits });
    }

    const item = items[Math.floor(Math.random() * items.length)];
    const floatValue = Math.random();

    const { data: inventoryEntry } = await admin
      .from("inventory")
      .insert({ user_id: user.id, item_id: item.id, float_value: floatValue, is_listed: false, show_in_profile: false })
      .select("id")
      .single();

    await admin.from("profiles").update({ last_daily_case_at: now }).eq("id", user.id);
    await admin.from("credit_transactions").insert({
      user_id: user.id, amount: 0, reason: "daily_case", ref_id: "daily_item",
    });

    return NextResponse.json({
      type: "item",
      item: { ...item, float_value: floatValue, inventory_id: inventoryEntry?.id },
    });
  } catch (err) {
    console.error("daily-case error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ available: false });

    const admin = adminClient();
    const { data: profile } = await admin.from("profiles").select("last_daily_case_at").eq("id", user.id).single();

    if (!profile?.last_daily_case_at) return NextResponse.json({ available: true });

    const hoursAgo = (Date.now() - new Date(profile.last_daily_case_at).getTime()) / (1000 * 60 * 60);
    const available = hoursAgo >= DAILY_CASE_COOLDOWN_HOURS;
    const nextOpenAt = available ? null : new Date(new Date(profile.last_daily_case_at).getTime() + DAILY_CASE_COOLDOWN_HOURS * 3600000).toISOString();

    return NextResponse.json({ available, next_open_at: nextOpenAt });
  } catch {
    return NextResponse.json({ available: false });
  }
}
