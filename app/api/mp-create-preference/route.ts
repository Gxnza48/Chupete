import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listing_id } = body as { listing_id: string };

    if (!listing_id) {
      return NextResponse.json({ error: "listing_id requerido." }, { status: 400 });
    }

    // Verify auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    // Fetch listing with item info
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select(
        `
        *,
        inventory:inventory(
          *,
          item:items(*)
        )
      `
      )
      .eq("id", listing_id)
      .eq("status", "active")
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: "Publicación no encontrada o no disponible." },
        { status: 404 }
      );
    }

    // Prevent buying own item
    if (listing.seller_id === user.id) {
      return NextResponse.json(
        { error: "No podés comprar tu propio item." },
        { status: 400 }
      );
    }

    const item = listing.inventory?.item;
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://chupeteclicker.app";

    // Configure MP client
    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });

    const preferenceClient = new Preference(mpClient);

    const preferenceData = await preferenceClient.create({
      body: {
        items: [
          {
            id: listing_id,
            title: item?.name ?? "Item de ChupeteClicker",
            quantity: 1,
            unit_price: listing.price_ars,
            currency_id: "ARS",
            description: item
              ? `Float: ${listing.inventory?.float_value?.toFixed(8)} | Rareza: ${item.rarity}`
              : undefined,
          },
        ],
        payer: {
          email: user.email,
        },
        back_urls: {
          success: `${appUrl}/mercado?payment=success`,
          failure: `${appUrl}/mercado?payment=failure`,
          pending: `${appUrl}/mercado?payment=pending`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/mp-webhook`,
        external_reference: listing_id,
        metadata: {
          listing_id,
          buyer_id: user.id,
          seller_id: listing.seller_id,
        },
      },
    });

    // Store preference_id in listing
    await supabase
      .from("listings")
      .update({ mp_preference_id: preferenceData.id })
      .eq("id", listing_id);

    return NextResponse.json({
      preference_id: preferenceData.id,
      init_point: preferenceData.init_point,
    });
  } catch (error) {
    console.error("MP create preference error:", error);
    return NextResponse.json(
      { error: "Error al crear preferencia de pago." },
      { status: 500 }
    );
  }
}
