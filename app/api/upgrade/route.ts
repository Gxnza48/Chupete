import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUpgradeOdds, RARITY_RANK } from "@/lib/upgrade";
import type { RarityKey } from "@/lib/rarities";

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { inventory_id, target_rarity } = await request.json() as {
      inventory_id: string;
      target_rarity: RarityKey;
    };

    if (!inventory_id || !target_rarity) {
      return NextResponse.json({ error: "Parámetros incompletos." }, { status: 400 });
    }
    if (!(target_rarity in RARITY_RANK)) {
      return NextResponse.json({ error: "Rareza inválida." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const admin = adminClient();

    const { data: inv, error: invError } = await admin
      .from("inventory")
      .select("*, item:items(rarity, name)")
      .eq("id", inventory_id)
      .eq("user_id", user.id)
      .single();

    if (invError || !inv) return NextResponse.json({ error: "Item no encontrado." }, { status: 404 });
    if (inv.is_listed) return NextResponse.json({ error: "El item está en el mercado." }, { status: 400 });

    const fromRarity = (inv.item as { rarity: RarityKey }).rarity;
    if (RARITY_RANK[target_rarity] <= RARITY_RANK[fromRarity]) {
      return NextResponse.json({ error: "La rareza objetivo debe ser mayor." }, { status: 400 });
    }

    const odds = getUpgradeOdds(fromRarity, target_rarity);

    // Unequip if needed
    const { data: profile } = await admin.from("profiles").select("equipped_chupete_id").eq("id", user.id).single();
    if (profile?.equipped_chupete_id === inventory_id) {
      await admin.from("profiles").update({ equipped_chupete_id: null }).eq("id", user.id);
    }

    // Always destroy the bet item
    await admin.from("inventory").delete().eq("id", inventory_id);

    const success = Math.random() < odds;

    if (!success) {
      return NextResponse.json({ success: false, from_rarity: fromRarity, target_rarity });
    }

    // Get a random item of target rarity
    const { data: targetItems } = await admin.from("items").select("id, name, rarity, image_url").eq("rarity", target_rarity);
    if (!targetItems || targetItems.length === 0) {
      return NextResponse.json({ error: "No hay items de esa rareza disponibles." }, { status: 500 });
    }

    const targetItem = targetItems[Math.floor(Math.random() * targetItems.length)];
    const floatValue = Math.random();

    const { data: newInv } = await admin
      .from("inventory")
      .insert({ user_id: user.id, item_id: targetItem.id, float_value: floatValue, is_listed: false })
      .select("id")
      .single();

    return NextResponse.json({
      success: true,
      from_rarity: fromRarity,
      target_rarity,
      item: { ...targetItem, float_value: floatValue, inventory_id: newInv?.id },
    });
  } catch (err) {
    console.error("upgrade error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
