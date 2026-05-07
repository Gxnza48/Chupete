import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { listing_id } = await request.json() as { listing_id: string };
    if (!listing_id) return NextResponse.json({ error: "listing_id requerido." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const admin = adminClient();

    // Fetch listing
    const { data: listing, error: listingError } = await admin
      .from("listings")
      .select("*, inventory:inventory(*, item:items(name))")
      .eq("id", listing_id)
      .eq("status", "active")
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Publicación no encontrada o no disponible." }, { status: 404 });
    }
    if (listing.seller_id === user.id) {
      return NextResponse.json({ error: "No podés comprar tu propio item." }, { status: 400 });
    }

    const price = listing.price_credits as number;

    // Fetch buyer credits
    const { data: buyer } = await admin
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!buyer || (buyer.credits ?? 0) < price) {
      return NextResponse.json({ error: "No tenés suficientes créditos." }, { status: 400 });
    }

    const fee = Math.ceil(price * 0.05);
    const sellerReceives = price - fee;

    // Atomic operations
    // 1. Deduct buyer credits
    const { error: buyerError } = await admin
      .from("profiles")
      .update({ credits: buyer.credits - price })
      .eq("id", user.id);
    if (buyerError) throw buyerError;

    // 2. Add seller credits
    const { data: seller } = await admin.from("profiles").select("credits").eq("id", listing.seller_id).single();
    await admin.from("profiles").update({ credits: (seller?.credits ?? 0) + sellerReceives }).eq("id", listing.seller_id);

    // 3. Transfer inventory to buyer
    await admin.from("inventory").update({ user_id: user.id, is_listed: false }).eq("id", listing.inventory_id);

    // 4. Mark listing sold
    await admin.from("listings").update({ status: "sold", sold_at: new Date().toISOString() }).eq("id", listing_id);

    // 5. Log credit transactions
    await admin.from("credit_transactions").insert([
      { user_id: user.id,          amount: -price,          reason: "purchase", ref_id: listing_id },
      { user_id: listing.seller_id, amount: sellerReceives, reason: "sale",     ref_id: listing_id },
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("market-buy error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
