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
    const { inventory_id } = await request.json() as { inventory_id: string | null };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const admin = adminClient();

    // If equipping (not unequipping), verify ownership
    if (inventory_id) {
      const { data: item } = await admin
        .from("inventory")
        .select("user_id")
        .eq("id", inventory_id)
        .single();

      if (!item || item.user_id !== user.id) {
        return NextResponse.json({ error: "Item no encontrado." }, { status: 403 });
      }
    }

    await admin
      .from("profiles")
      .update({ equipped_chupete_id: inventory_id })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("equip-chupete error:", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
