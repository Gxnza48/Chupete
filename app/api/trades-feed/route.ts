import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const admin = adminClient();

  const { data: listings } = await admin
    .from("listings")
    .select("id, price_credits, sold_at, inventory_id, seller_id")
    .eq("status", "sold")
    .not("sold_at", "is", null)
    .order("sold_at", { ascending: false })
    .limit(100);

  if (!listings || listings.length === 0) return NextResponse.json({ trades: [] });

  const inventoryIds = listings.map((l) => l.inventory_id).filter(Boolean);
  const sellerIds = [...new Set(listings.map((l) => l.seller_id).filter(Boolean))];

  const [{ data: inventories }, { data: sellers }] = await Promise.all([
    admin
      .from("inventory")
      .select("id, float_value, user_id, item:items(name, rarity)")
      .in("id", inventoryIds),
    admin
      .from("profiles")
      .select("id, username")
      .in("id", sellerIds),
  ]);

  const invMap: Record<string, { float_value: number; user_id: string; item: { name: string; rarity: string } }> = {};
  for (const inv of inventories ?? []) invMap[inv.id] = inv as unknown as typeof invMap[string];

  const sellerMap: Record<string, string> = {};
  for (const s of sellers ?? []) sellerMap[s.id] = s.username;

  const buyerIds = [...new Set(Object.values(invMap).map((inv) => inv.user_id).filter(Boolean))];
  const { data: buyers } = buyerIds.length
    ? await admin.from("profiles").select("id, username").in("id", buyerIds)
    : { data: [] };
  const buyerMap: Record<string, string> = {};
  for (const b of buyers ?? []) buyerMap[b.id] = b.username;

  const trades = listings.map((l) => {
    const inv = invMap[l.inventory_id];
    return {
      id: l.id,
      price_credits: l.price_credits,
      sold_at: l.sold_at,
      float_value: inv?.float_value ?? 0,
      item: inv?.item ?? { name: "Item", rarity: "comun" },
      seller: sellerMap[l.seller_id] ?? "?",
      buyer: buyerMap[inv?.user_id ?? ""] ?? "?",
    };
  });

  return NextResponse.json({ trades });
}
