import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const code = String(body.code ?? "").trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "Ingresá un código." }, { status: 400 });
  }

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tenés que estar logueado." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: promoCode } = await admin
    .from("promo_codes")
    .select("id, code, credits")
    .eq("code", code)
    .eq("active", true)
    .maybeSingle();

  if (!promoCode) {
    return NextResponse.json({ error: "Código inválido o expirado." }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("promo_redemptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("code_id", promoCode.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Ya canjeaste este código." }, { status: 400 });
  }

  const { error: redemptionError } = await admin
    .from("promo_redemptions")
    .insert({ user_id: user.id, code_id: promoCode.id });

  if (redemptionError) {
    if (redemptionError.code === "23505") {
      return NextResponse.json({ error: "Ya canjeaste este código." }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al canjear. Intentá de nuevo." }, { status: 500 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  await admin
    .from("profiles")
    .update({ credits: (profile?.credits ?? 0) + promoCode.credits })
    .eq("id", user.id);

  return NextResponse.json({
    success: true,
    credits: promoCode.credits,
    code: promoCode.code,
  });
}
