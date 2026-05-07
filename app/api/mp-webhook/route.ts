import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import crypto from "crypto";

// Create a service-role client (bypasses RLS)
function createAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  // MP sends "ts=...,v1=<hash>"
  const v1 = signature.split(",").find((s) => s.startsWith("v1="));
  if (!v1) return false;
  const hash = v1.replace("v1=", "");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(hash, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");
    const secret = process.env.MP_WEBHOOK_SECRET ?? "";

    // Only verify if a secret is configured
    if (secret && !verifyWebhookSignature(rawBody, signature, secret)) {
      console.warn("MP webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let event: {
      type: string;
      data?: { id?: string };
      action?: string;
    };

    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Only process payment events
    if (event.type !== "payment" || !event.data?.id) {
      return NextResponse.json({ received: true });
    }

    const paymentId = event.data.id;

    // Fetch payment details from MP
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    if (!mpRes.ok) {
      console.error("MP API error:", mpRes.status);
      return NextResponse.json({ error: "MP API error" }, { status: 500 });
    }

    const payment = await mpRes.json();

    // Only process approved payments
    if (payment.status !== "approved") {
      return NextResponse.json({ received: true });
    }

    const listingId = payment.external_reference;
    const buyerId = payment.metadata?.buyer_id;

    if (!listingId || !buyerId) {
      console.error("Missing listing_id or buyer_id in payment metadata");
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch the listing
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("*, inventory:inventory(*)")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      console.error("Listing not found:", listingId);
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Idempotency: skip if already processed
    if (listing.status === "sold") {
      return NextResponse.json({ received: true });
    }

    const sellerId = listing.seller_id;
    const inventoryId = listing.inventory_id;
    const priceArs = listing.price_ars;
    const platformFee = 0; // P2P Marketplace - No fees

    // Transfer inventory item to buyer
    const { error: inventoryError } = await supabase
      .from("inventory")
      .update({
        user_id: buyerId,
        is_listed: false,
      })
      .eq("id", inventoryId);

    if (inventoryError) {
      console.error("Inventory transfer error:", inventoryError);
      return NextResponse.json(
        { error: "Inventory transfer failed" },
        { status: 500 }
      );
    }

    // Mark listing as sold
    await supabase
      .from("listings")
      .update({
        status: "sold",
        sold_at: new Date().toISOString(),
      })
      .eq("id", listingId);

    // Create transaction record
    await supabase.from("transactions").insert({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: sellerId,
      price_ars: priceArs,
      platform_fee: platformFee,
      mp_payment_id: String(paymentId),
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("MP webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
