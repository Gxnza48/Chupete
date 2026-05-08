import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ sold: [], bought: [], credits: [] });

  const admin = adminClient();

  const [{ data: sold }, { data: creditMovements }] = await Promise.all([
    // Items I sold
    admin
      .from("listings")
      .select("id, price_credits, sold_at, inventory_id")
      .eq("seller_id", user.id)
      .eq("status", "sold")
      .order("sold_at", { ascending: false })
      .limit(50),

    // Credit transactions (cases, shop)
    admin
      .from("credit_transactions")
      .select("id, amount, reason, ref_id, created_at")
      .eq("user_id", user.id)
      .not("reason", "in", '("purchase","sale")')
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // Resolve item names for sold listings
  const soldInvIds = (sold ?? []).map((s) => s.inventory_id).filter(Boolean);
  const { data: soldInventories } = soldInvIds.length
    ? await admin.from("inventory").select("id, item:items(name, rarity)").in("id", soldInvIds)
    : { data: [] };
  const soldInvMap: Record<string, { name: string; rarity: string }> = {};
  for (const inv of soldInventories ?? []) {
    soldInvMap[inv.id] = (inv.item as unknown as { name: string; rarity: string });
  }

  // Items I bought: inventory now belongs to me, listing is sold
  const { data: myInventory } = await admin
    .from("inventory")
    .select("id")
    .eq("user_id", user.id);
  const myInvIds = (myInventory ?? []).map((i) => i.id);

  const { data: bought } = myInvIds.length
    ? await admin
        .from("listings")
        .select("id, price_credits, sold_at, inventory_id, seller_id")
        .eq("status", "sold")
        .neq("seller_id", user.id)
        .in("inventory_id", myInvIds)
        .order("sold_at", { ascending: false })
        .limit(50)
    : { data: [] };

  const boughtInvIds = (bought ?? []).map((b) => b.inventory_id).filter(Boolean);
  const { data: boughtInventories } = boughtInvIds.length
    ? await admin.from("inventory").select("id, item:items(name, rarity)").in("id", boughtInvIds)
    : { data: [] };
  const boughtInvMap: Record<string, { name: string; rarity: string }> = {};
  for (const inv of boughtInventories ?? []) {
    boughtInvMap[inv.id] = (inv.item as unknown as { name: string; rarity: string });
  }

  // Resolve case names from ref_id
  const CASE_NAMES: Record<string, string> = {
    basica: "Caja Albiceleste", premium: "Caja Bonaerense", exclusiva: "Caja Obelisco",
    daily: "Caja Diaria (créditos)", daily_item: "Caja Diaria (item)",
  };

  return NextResponse.json({
    sold: (sold ?? []).map((s) => ({
      id: s.id,
      price_credits: s.price_credits,
      date: s.sold_at,
      item: soldInvMap[s.inventory_id] ?? { name: "Item", rarity: "comun" },
    })),
    bought: (bought ?? []).map((b) => ({
      id: b.id,
      price_credits: b.price_credits,
      date: b.sold_at,
      item: boughtInvMap[b.inventory_id] ?? { name: "Item", rarity: "comun" },
    })),
    credits: (creditMovements ?? []).map((c) => ({
      ...c,
      display_name: c.reason === "open_case"
        ? `Abriste ${CASE_NAMES[c.ref_id] ?? "una caja"}`
        : c.reason === "daily_case"
        ? `${CASE_NAMES[c.ref_id] ?? "Caja Diaria"}`
        : c.reason === "shop_purchase"
        ? "Compra en tienda"
        : "Movimiento de créditos",
    })),
  });
}
