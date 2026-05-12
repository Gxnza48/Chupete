import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { QUICK_SELL_PRICES } from "@/lib/quickSell";

export { QUICK_SELL_PRICES };

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { inventory_id } = await request.json() as { inventory_id: string };
    if (!inventory_id) return NextResponse.json({ error: "inventory_id requerido." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const admin = adminClient();

    const { data: inv, error: invError } = await admin
      .from("inventory")
      .select("*, item:items(rarity)")
      .eq("id", inventory_id)
      .eq("user_id", user.id)
      .single();

    if (invError || !inv) return NextResponse.json({ error: "Item no encontrado." }, { status: 404 });
    if (inv.is_listed) return NextResponse.json({ error: "No podés vender un item publicado en el mercado." }, { status: 400 });

    const rarity = (inv.item as { rarity: string }).rarity;
    const price = QUICK_SELL_PRICES[rarity] ?? 30;

    const { data: profile } = await admin.from("profiles").select("credits, equipped_chupete_id").eq("id", user.id).single();
    if (!profile) return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });

    if (profile.equipped_chupete_id === inventory_id) {
      await admin.from("profiles").update({ equipped_chupete_id: null }).eq("id", user.id);
    }

    await admin.from("inventory").delete().eq("id", inventory_id);

    const newCredits = (profile.credits ?? 0) + price;
    await admin.from("profiles").update({ credits: newCredits }).eq("id", user.id);

    await admin.from("credit_transactions").insert({
      user_id: user.id,
      amount: price,
      reason: "quick_sell",
      ref_id: inventory_id,
    });

    return NextResponse.json({ success: true, credits_earned: price, credits_total: newCredits });
  } catch (err) {
    console.error("quick-sell error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
