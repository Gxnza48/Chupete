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
    const { auction_id } = await request.json() as { auction_id: string };
    if (!auction_id) return NextResponse.json({ error: "auction_id requerido." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const admin = adminClient();

    const { data: auction, error } = await admin
      .from("auctions")
      .select("*")
      .eq("id", auction_id)
      .eq("status", "active")
      .single();

    if (error || !auction) return NextResponse.json({ error: "Subasta no encontrada." }, { status: 404 });

    const now = new Date();
    if (new Date(auction.ends_at) > now) {
      return NextResponse.json({ error: "La subasta aún no terminó." }, { status: 400 });
    }

    // Only seller or winner can settle
    if (user.id !== auction.seller_id && user.id !== auction.current_bidder_id) {
      return NextResponse.json({ error: "No tenés permiso para cerrar esta subasta." }, { status: 403 });
    }

    // Mark ended
    await admin.from("auctions").update({ status: "ended" }).eq("id", auction_id);

    if (auction.current_bidder_id && auction.current_bid) {
      // Transfer item to winner
      await admin.from("inventory").update({ user_id: auction.current_bidder_id, is_listed: false }).eq("id", auction.inventory_id);

      // Credits go to seller (credits were already deducted from winner on bid)
      const { data: seller } = await admin.from("profiles").select("credits").eq("id", auction.seller_id).single();
      if (seller) {
        const fee = Math.ceil(auction.current_bid * 0.05);
        const sellerReceives = auction.current_bid - fee;
        await admin.from("profiles").update({ credits: seller.credits + sellerReceives }).eq("id", auction.seller_id);
        await admin.from("credit_transactions").insert([
          { user_id: auction.seller_id, amount: sellerReceives, reason: "sale", ref_id: auction_id },
        ]);
      }

      return NextResponse.json({ success: true, outcome: "sold", winner_id: auction.current_bidder_id, amount: auction.current_bid });
    } else {
      // No bids — return item to seller
      await admin.from("inventory").update({ is_listed: false }).eq("id", auction.inventory_id);
      return NextResponse.json({ success: true, outcome: "no_bids" });
    }
  } catch (err) {
    console.error("auction-claim error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
