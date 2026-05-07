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
    const { inventory_id, price_credits } = await request.json() as {
      inventory_id: string;
      price_credits: number;
    };

    if (!inventory_id || !price_credits || price_credits < 1) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const admin = adminClient();

    const { data: item, error: itemError } = await admin
      .from("inventory")
      .select("id, user_id, is_listed")
      .eq("id", inventory_id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Item no encontrado." }, { status: 404 });
    }
    if (item.user_id !== user.id) {
      return NextResponse.json({ error: "Este item no te pertenece." }, { status: 403 });
    }
    if (item.is_listed) {
      return NextResponse.json({ error: "El item ya está publicado." }, { status: 400 });
    }

    const { error: listingError } = await admin.from("listings").insert({
      seller_id: user.id,
      inventory_id,
      price_ars: price_credits,
      price_credits,
      status: "active",
    });

    if (listingError) {
      return NextResponse.json({ error: listingError.message }, { status: 500 });
    }

    await admin.from("inventory").update({ is_listed: true }).eq("id", inventory_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("create-listing error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
