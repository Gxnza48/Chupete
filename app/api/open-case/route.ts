import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { CASES, rollRarity } from "@/lib/cases";

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { case_id } = await request.json() as { case_id: string };

    const caseDef = CASES[case_id];
    if (!caseDef) {
      return NextResponse.json({ error: "Caja no encontrada." }, { status: 404 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const admin = adminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.credits ?? 0) < caseDef.price_credits) {
      return NextResponse.json({ error: "No tenés suficientes créditos." }, { status: 400 });
    }

    // Deduct credits
    await admin
      .from("profiles")
      .update({ credits: profile.credits - caseDef.price_credits })
      .eq("id", user.id);

    // Roll rarity
    const rarity = rollRarity(caseDef.rarities);

    // Pick random item of that rarity (cases only + availability window)
    const now = new Date().toISOString();
    const { data: items } = await admin
      .from("items")
      .select("id, name, rarity, image_url")
      .eq("rarity", rarity)
      .eq("case_drop", true)
      .or(`available_from.is.null,available_from.lte.${now}`)
      .or(`available_until.is.null,available_until.gte.${now}`);

    if (!items || items.length === 0) {
      // Fallback: refund and error
      await admin.from("profiles").update({ credits: profile.credits }).eq("id", user.id);
      return NextResponse.json({ error: "No hay items disponibles para esa rareza." }, { status: 500 });
    }

    const item = items[Math.floor(Math.random() * items.length)];
    const floatValue = Math.random();

    function getMaxDurability(fv: number): number {
      if (fv < 0.07)  return 5000;
      if (fv < 0.15)  return 3000;
      if (fv < 0.38)  return 1500;
      if (fv < 0.45)  return 800;
      return 300;
    }
    const maxDur = getMaxDurability(floatValue);

    const { data: inventoryEntry, error: invError } = await admin
      .from("inventory")
      .insert({
        user_id: user.id,
        item_id: item.id,
        float_value: floatValue,
        is_listed: false,
        show_in_profile: false,
        durability: maxDur,
        max_durability: maxDur,
      })
      .select("id")
      .single();

    if (invError || !inventoryEntry) {
      await admin.from("profiles").update({ credits: profile.credits }).eq("id", user.id);
      return NextResponse.json({ error: "Error al guardar el item." }, { status: 500 });
    }

    await admin.from("credit_transactions").insert({
      user_id: user.id,
      amount: -caseDef.price_credits,
      reason: "open_case",
      ref_id: caseDef.id,
    });

    return NextResponse.json({
      item: { ...item, float_value: floatValue, inventory_id: inventoryEntry.id },
      credits_spent: caseDef.price_credits,
      credits_remaining: profile.credits - caseDef.price_credits,
    });
  } catch (err) {
    console.error("open-case error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
