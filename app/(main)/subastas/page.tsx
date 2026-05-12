"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useInventory } from "@/hooks/useInventory";
import { useProfile } from "@/hooks/useProfile";
import { RARITIES, getConditionLabel, type RarityKey } from "@/lib/rarities";
import RarityText from "@/components/ui/RarityText";
import ItemSVG from "@/components/ui/ItemSVG";
import type { InventoryItem, Item } from "@/types/database";

type Auction = {
  id: string;
  seller_id: string;
  inventory_id: string;
  starting_bid: number;
  current_bid: number | null;
  current_bidder_id: string | null;
  ends_at: string;
  status: string;
  inventory?: (InventoryItem & { item?: Item }) | null;
  seller?: { id: string; username: string; level: number } | null;
};

function useCountdown(endsAt: string) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    function calc() {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Terminada"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    }
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);
  return remaining;
}

function AuctionCard({ auction, currentUserId, onBid, onClaim }: {
  auction: Auction;
  currentUserId: string | null;
  onBid: (auction: Auction) => void;
  onClaim: (auction: Auction) => void;
}) {
  const countdown = useCountdown(auction.ends_at);
  const isEnded = new Date(auction.ends_at) <= new Date();
  const item = auction.inventory?.item;
  const rarity = item?.rarity as RarityKey;
  const cfg = rarity ? RARITIES[rarity] : null;
  const color = cfg ? (cfg.gradient ? cfg.gradient[0] : (cfg.color ?? "#3a3a3a")) : "#3a3a3a";
  const isWinner = auction.current_bidder_id === currentUserId;
  const isSeller = auction.seller_id === currentUserId;
  const canClaim = isEnded && (isWinner || isSeller);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4"
      style={{ background: "#060606", border: `1px solid ${color}20`, boxShadow: isEnded ? "none" : `0 0 20px ${color}08` }}
    >
      {/* Item info */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
          {item
            ? <ItemSVG name={item.name} rarity={item.rarity} size={56} glow={false} />
            : <span className="text-2xl">🎁</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>{item?.name ?? "Item"}</p>
          {rarity && <RarityText rarity={rarity} className="text-[10px]" />}
          {auction.inventory?.float_value != null && (
            <p className="text-[10px] mt-0.5" style={{ color: "#2a2a2a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
              {getConditionLabel(auction.inventory.float_value)}
            </p>
          )}
        </div>
        {/* Timer */}
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-bold" style={{ color: isEnded ? "#ff6b6b" : "#4a9a4a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
            {countdown}
          </p>
          <p className="text-[9px]" style={{ color: "#2a2a2a" }}>resta</p>
        </div>
      </div>

      {/* Bid info */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px]" style={{ color: "#3a3a3a" }}>
            {auction.current_bid ? "Puja actual" : "Puja inicial"}
          </p>
          <p className="text-sm font-bold" style={{ color: "#efefef", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
            {(auction.current_bid ?? auction.starting_bid).toLocaleString("es-AR")} cr.
          </p>
          {auction.seller && (
            <p className="text-[9px] mt-0.5" style={{ color: "#2a2a2a" }}>por {auction.seller.username}</p>
          )}
        </div>

        {!isEnded && !isSeller && (
          <button
            onClick={() => onBid(auction)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: "rgba(255,255,255,0.08)", color: "#efefef", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "var(--font-syne), Syne, sans-serif" }}
          >
            Pujar
          </button>
        )}
        {canClaim && (
          <button
            onClick={() => onClaim(auction)}
            className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: "rgba(74,154,74,0.12)", color: "#4a9a4a", border: "1px solid rgba(74,154,74,0.3)", fontFamily: "var(--font-syne), Syne, sans-serif" }}
          >
            {isSeller ? "Cerrar" : "Reclamar"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function BidModal({ auction, onClose, onSuccess }: { auction: Auction; onClose: () => void; onSuccess: () => void }) {
  const minBid = (auction.current_bid ?? auction.starting_bid - 1) + 1;
  const [amount, setAmount] = useState(String(minBid));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBid() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auction-bid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auction_id: auction.id, amount: parseInt(amount, 10) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    onSuccess();
    onClose();
  }

  return (
    <>
      <motion.div key="bid-bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.85)" }} />
      <motion.div key="bid-modal" initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl p-6"
        style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 40px rgba(0,0,0,0.8)" }}
      >
        <h2 className="text-base font-bold mb-4" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          Pujar — {auction.inventory?.item?.name}
        </h2>
        <p className="text-xs mb-3" style={{ color: "#3a3a3a" }}>Puja mínima: <span style={{ color: "#efefef" }}>{minBid.toLocaleString("es-AR")} cr.</span></p>
        <input
          type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={minBid}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#efefef", fontFamily: "var(--font-jetbrains-mono), monospace" }}
        />
        {error && <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: "rgba(255,50,50,0.1)", color: "#ff6b6b", border: "1px solid rgba(255,50,50,0.2)" }}>{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", color: "#404040", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Cancelar</button>
          <button onClick={handleBid} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#efefef", color: "#000", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
            {loading ? "..." : "Pujar"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function CreateAuctionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { items } = useInventory();
  const available = items.filter((i) => !i.is_listed);
  const [inventoryId, setInventoryId] = useState("");
  const [startingBid, setStartingBid] = useState("100");
  const [durationHours, setDurationHours] = useState("24");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!inventoryId) { setError("Seleccioná un item."); return; }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auction-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventory_id: inventoryId, starting_bid: parseInt(startingBid, 10), duration_hours: parseInt(durationHours, 10) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    onSuccess();
    onClose();
  }

  const selectedItem = available.find((i) => i.id === inventoryId);

  return (
    <>
      <motion.div key="ca-bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.85)" }} />
      <motion.div key="ca-modal" initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl p-6"
        style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 40px rgba(0,0,0,0.8)" }}
      >
        <h2 className="text-base font-bold mb-5" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Nueva Subasta</h2>

        <label className="block text-xs mb-1.5" style={{ color: "#404040" }}>Item</label>
        <select value={inventoryId} onChange={(e) => setInventoryId(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-xs outline-none mb-4 appearance-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: inventoryId ? "#efefef" : "#404040", fontFamily: "var(--font-syne), Syne, sans-serif" }}
        >
          <option value="">Seleccioná un item...</option>
          {available.map((inv) => (
            <option key={inv.id} value={inv.id}>{inv.item?.name} — {RARITIES[inv.item?.rarity as RarityKey]?.label}</option>
          ))}
        </select>

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs mb-1.5" style={{ color: "#404040" }}>Puja inicial (cr.)</label>
            <input type="number" value={startingBid} onChange={(e) => setStartingBid(e.target.value)} min="1"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#efefef", fontFamily: "var(--font-jetbrains-mono), monospace" }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1.5" style={{ color: "#404040" }}>Duración (horas)</label>
            <select value={durationHours} onChange={(e) => setDurationHours(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#efefef", fontFamily: "var(--font-jetbrains-mono), monospace" }}
            >
              <option value="6">6h</option>
              <option value="12">12h</option>
              <option value="24">24h</option>
              <option value="48">48h</option>
            </select>
          </div>
        </div>

        {error && <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: "rgba(255,50,50,0.1)", color: "#ff6b6b", border: "1px solid rgba(255,50,50,0.2)" }}>{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", color: "#404040", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Cancelar</button>
          <button onClick={handleCreate} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#efefef", color: "#000", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
            {loading ? "..." : "Crear"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

export default function SubastasPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "mine">("active");
  const [bidTarget, setBidTarget] = useState<Auction | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { refetch: refetchInventory } = useInventory();
  const { refetch: refetchProfile } = useProfile();
  const supabase = createClient();

  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("auctions")
      .select("*, inventory:inventory(*, item:items(*)), seller:profiles!auctions_seller_id_fkey(id, username, level)")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    setAuctions((data ?? []) as Auction[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
      await fetchAuctions();
    }
    init();
  }, [supabase, fetchAuctions]);

  async function handleClaim(auction: Auction) {
    await fetch("/api/auction-claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auction_id: auction.id }),
    });
    fetchAuctions();
    refetchInventory();
    refetchProfile();
  }

  const displayedAuctions = tab === "mine"
    ? auctions.filter((a) => a.seller_id === currentUserId || a.current_bidder_id === currentUserId)
    : auctions;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10" style={{ background: "#000000" }}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Subastas</h1>
          <p className="text-sm" style={{ color: "#2a2a2a" }}>Ponés un chupete a subasta, la gente puja, el mayor gana.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-xl text-sm font-bold"
          style={{ background: "#efefef", color: "#000", fontFamily: "var(--font-syne), Syne, sans-serif" }}
        >
          + Nueva
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["active", "mine"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: tab === t ? "rgba(255,255,255,0.09)" : "transparent",
              color: tab === t ? "#efefef" : "#3a3a3a",
              border: tab === t ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
              fontFamily: "var(--font-syne), Syne, sans-serif",
            }}
          >
            {t === "active" ? "Activas" : "Mis subastas"}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-center py-12" style={{ color: "#2a2a2a" }}>Cargando...</p>}
      {!loading && displayedAuctions.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔨</p>
          <p className="text-sm" style={{ color: "#2a2a2a" }}>No hay subastas activas.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {displayedAuctions.map((a) => (
          <AuctionCard key={a.id} auction={a} currentUserId={currentUserId}
            onBid={setBidTarget} onClaim={handleClaim} />
        ))}
      </div>

      <AnimatePresence>
        {bidTarget && (
          <BidModal auction={bidTarget} onClose={() => setBidTarget(null)} onSuccess={fetchAuctions} />
        )}
        {showCreate && (
          <CreateAuctionModal onClose={() => setShowCreate(false)} onSuccess={() => { fetchAuctions(); refetchInventory(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
