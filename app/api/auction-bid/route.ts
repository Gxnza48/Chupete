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
    const { auction_id, amount } = await request.json() as { auction_id: string; amount: number };

    if (!auction_id || !amount || amount < 1) {
      return NextResponse.json({ error: "Parámetros inválidos." }, { status: 400 });
    }

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
    if (auction.seller_id === user.id) return NextResponse.json({ error: "No podés pujar en tu propia subasta." }, { status: 400 });

    const now = new Date();
    if (new Date(auction.ends_at) <= now) {
      return NextResponse.json({ error: "La subasta ya terminó." }, { status: 400 });
    }

    const minBid = (auction.current_bid ?? auction.starting_bid - 1) + 1;
    if (amount < minBid) {
      return NextResponse.json({ error: `La puja mínima es ${minBid.toLocaleString("es-AR")} cr.` }, { status: 400 });
    }

    // Check bidder has enough credits
    const { data: bidder } = await admin.from("profiles").select("credits").eq("id", user.id).single();
    if (!bidder || bidder.credits < amount) {
      return NextResponse.json({ error: "No tenés suficientes créditos." }, { status: 400 });
    }

    // Refund previous bidder
    if (auction.current_bidder_id && auction.current_bid) {
      const { data: prevBidder } = await admin.from("profiles").select("credits").eq("id", auction.current_bidder_id).single();
      if (prevBidder) {
        await admin.from("profiles").update({ credits: prevBidder.credits + auction.current_bid }).eq("id", auction.current_bidder_id);
      }
    }

    // Deduct credits from new bidder
    await admin.from("profiles").update({ credits: bidder.credits - amount }).eq("id", user.id);

    // Update auction
    await admin.from("auctions").update({ current_bid: amount, current_bidder_id: user.id }).eq("id", auction_id);

    // Log bid
    await admin.from("auction_bids").insert({ auction_id, bidder_id: user.id, amount });

    return NextResponse.json({ success: true, new_bid: amount });
  } catch (err) {
    console.error("auction-bid error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
