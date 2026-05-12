import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCraftOutcome, rollCraft } from "@/lib/craft";

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { inventory_ids } = await request.json() as { inventory_ids: string[] };

    if (!Array.isArray(inventory_ids) || inventory_ids.length < 2 || inventory_ids.length > 5) {
      return NextResponse.json({ error: "Necesitás entre 2 y 5 items." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const admin = adminClient();

    // Fetch all selected inventory items
    const { data: items, error: itemsError } = await admin
      .from("inventory")
      .select("id, user_id, is_listed, item:items(base_price_ars, rarity)")
      .in("id", inventory_ids);

    if (itemsError || !items || items.length !== inventory_ids.length) {
      return NextResponse.json({ error: "Uno o más items no encontrados." }, { status: 404 });
    }

    for (const inv of items) {
      if (inv.user_id !== user.id) return NextResponse.json({ error: "Un item no te pertenece." }, { status: 403 });
      if (inv.is_listed) return NextResponse.json({ error: "Un item está en el mercado." }, { status: 400 });
    }

    // Unequip any of these items if equipped
    const { data: profile } = await admin.from("profiles").select("equipped_chupete_id").eq("id", user.id).single();
    if (profile?.equipped_chupete_id && inventory_ids.includes(profile.equipped_chupete_id)) {
      await admin.from("profiles").update({ equipped_chupete_id: null }).eq("id", user.id);
    }

    // Calculate combined value
    const totalValue = items.reduce((sum, inv) => {
      const item = inv.item as unknown as { base_price_ars: number };
      return sum + (item?.base_price_ars ?? 0);
    }, 0);

    // Destroy all input items
    await admin.from("inventory").delete().in("id", inventory_ids);

    // Roll outcome
    const outcome = getCraftOutcome(totalValue);
    const resultRarity = rollCraft(outcome);

    // Get a random item of result rarity
    const { data: targetItems } = await admin.from("items").select("id, name, rarity").eq("rarity", resultRarity);
    if (!targetItems || targetItems.length === 0) {
      return NextResponse.json({ error: "No hay items de esa rareza." }, { status: 500 });
    }

    const targetItem = targetItems[Math.floor(Math.random() * targetItems.length)];
    const floatValue = Math.random();

    const { data: newInv } = await admin
      .from("inventory")
      .insert({ user_id: user.id, item_id: targetItem.id, float_value: floatValue, is_listed: false })
      .select("id")
      .single();

    const isSuccess = resultRarity === outcome.targetRarity;

    return NextResponse.json({
      success: isSuccess,
      result_rarity: resultRarity,
      outcome,
      total_value: totalValue,
      item: { ...targetItem, float_value: floatValue, inventory_id: newInv?.id },
    });
  } catch (err) {
    console.error("craft error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
