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
    const { inventory_id, starting_bid, duration_hours = 24 } = await request.json() as {
      inventory_id: string;
      starting_bid: number;
      duration_hours?: number;
    };

    if (!inventory_id || !starting_bid || starting_bid < 1) {
      return NextResponse.json({ error: "Parámetros inválidos." }, { status: 400 });
    }
    if (duration_hours < 1 || duration_hours > 72) {
      return NextResponse.json({ error: "Duración debe ser entre 1 y 72 horas." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const admin = adminClient();

    const { data: inv, error } = await admin
      .from("inventory")
      .select("id, user_id, is_listed")
      .eq("id", inventory_id)
      .eq("user_id", user.id)
      .single();

    if (error || !inv) return NextResponse.json({ error: "Item no encontrado." }, { status: 404 });
    if (inv.is_listed) return NextResponse.json({ error: "El item ya está publicado." }, { status: 400 });

    // Check no active auction for this item
    const { data: existing } = await admin
      .from("auctions")
      .select("id")
      .eq("inventory_id", inventory_id)
      .eq("status", "active")
      .maybeSingle();

    if (existing) return NextResponse.json({ error: "Ya hay una subasta activa para este item." }, { status: 400 });

    const endsAt = new Date(Date.now() + duration_hours * 3600 * 1000).toISOString();

    const { data: auction, error: auctionError } = await admin
      .from("auctions")
      .insert({ seller_id: user.id, inventory_id, starting_bid, ends_at: endsAt })
      .select("id")
      .single();

    if (auctionError || !auction) {
      return NextResponse.json({ error: "Error al crear la subasta." }, { status: 500 });
    }

    // Mark item as listed so it can't be moved
    await admin.from("inventory").update({ is_listed: true }).eq("id", inventory_id);

    return NextResponse.json({ success: true, auction_id: auction.id });
  } catch (err) {
    console.error("auction-create error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
