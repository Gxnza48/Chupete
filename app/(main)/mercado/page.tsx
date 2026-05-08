"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Listing } from "@/types/database";
import ListingCard from "@/components/marketplace/ListingCard";
import BuyModal from "@/components/marketplace/BuyModal";
import { ToastProvider } from "@/components/ui/Toast";

function MercadoContent() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        *,
        inventory:inventory(
          *,
          item:items(*)
        ),
        seller:profiles!listings_seller_id_fkey(id, username, level)
      `
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setListings(data as Listing[]);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
      await fetchListings();
    }
    init();
  }, [supabase, fetchListings]);

  // Realtime subscription for new listings
  useEffect(() => {
    const channel = supabase
      .channel("marketplace-listings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "listings",
        },
        () => {
          fetchListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchListings]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              color: "#efefef",
              fontFamily: "var(--font-syne), Syne, sans-serif",
            }}
          >
            Mercado
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#2a2a2a" }}>
            {isLoading
              ? "Cargando..."
              : `${listings.length} publicación${listings.length !== 1 ? "es" : ""} activa${listings.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <a
          href="/inventario"
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "#efefef",
            color: "#000000",
            textDecoration: "none",
            fontFamily: "var(--font-syne), Syne, sans-serif",
          }}
        >
          + Vender
        </a>
      </div>

      <div
        style={{
          height: "1px",
          background: "rgba(255,255,255,0.05)",
          marginBottom: "2rem",
        }}
      />

      {/* Listings grid */}
      {isLoading ? (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl animate-pulse"
              style={{
                height: 290,
                background: "#060606",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <div
            className="text-6xl"
            style={{ filter: "grayscale(1) opacity(0.3)" }}
          >
            🏪
          </div>
          <div className="text-center">
            <p
              className="text-base font-semibold mb-1"
              style={{ color: "#efefef" }}
            >
              El mercado está vacío
            </p>
            <p className="text-sm" style={{ color: "#404040" }}>
              ¡Sé el primero en publicar un item!
            </p>
          </div>
          <a
            href="/inventario"
            className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: "#efefef",
              color: "#000000",
              fontFamily: "var(--font-syne), Syne, sans-serif",
              textDecoration: "none",
            }}
          >
            Ir al inventario
          </a>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          }}
        >
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04 }}
            >
              <ListingCard
                listing={listing}
                onBuy={setSelectedListing}
                currentUserId={currentUserId ?? undefined}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <BuyModal
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onSuccess={fetchListings}
      />
    </div>
  );
}

export default function MercadoPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <MercadoContent />
    </motion.div>
  );
}
