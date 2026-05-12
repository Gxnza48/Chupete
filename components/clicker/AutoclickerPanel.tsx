"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { AUTOCLICKER_PLANS } from "@/lib/autoclicker";

type PlanKey = keyof typeof AUTOCLICKER_PLANS;

function useCountdown(until: string | null) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!until) { setLabel(""); return; }
    function calc() {
      const diff = new Date(until!).getTime() - Date.now();
      if (diff <= 0) { setLabel("Expirado"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setLabel(h > 0 ? `${h}h ${m}m` : `${m}m`);
    }
    calc();
    const t = setInterval(calc, 10000);
    return () => clearInterval(t);
  }, [until]);
  return label;
}

export default function AutoclickerPanel() {
  const { profile, refetch } = useProfile();
  const [buying, setBuying] = useState<PlanKey | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState<{ clicks: number; xp_gained: number } | null>(null);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  const [autoclickerUntil, setAutoclickerUntil] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAC() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("autoclicker_until").eq("id", user.id).single();
      setAutoclickerUntil(data?.autoclicker_until ?? null);
    }
    fetchAC();
  }, [supabase, profile?.credits]);

  const countdown = useCountdown(autoclickerUntil);
  const isActive = autoclickerUntil && new Date(autoclickerUntil) > new Date();

  async function handleBuy(plan: PlanKey) {
    setBuying(plan);
    const res = await fetch("/api/buy-autoclicker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setBuying(null);
    if (res.ok) {
      setAutoclickerUntil(data.autoclicker_until);
      refetch();
    }
  }

  async function handleClaim() {
    setClaiming(true);
    setClaimed(null);
    const res = await fetch("/api/claim-autoclicker", { method: "POST" });
    const data = await res.json();
    setClaiming(false);
    if (res.ok && data.clicks > 0) {
      setClaimed({ clicks: data.clicks, xp_gained: data.xp_gained ?? 0 });
      refetch();
      setTimeout(() => setClaimed(null), 5000);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-2.5 rounded-2xl transition-all"
        style={{
          background: isActive ? "rgba(74,154,74,0.08)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${isActive ? "rgba(74,154,74,0.25)" : "rgba(255,255,255,0.07)"}`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🤖</span>
          <span className="text-xs font-medium" style={{ color: isActive ? "#4a9a4a" : "#404040", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
            Autoclicker {isActive ? `— activo (${countdown})` : "— inactivo"}
          </span>
        </div>
        <span className="text-xs" style={{ color: "#2a2a2a" }}>{open ? "▲" : "▼"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 flex flex-col gap-2">
              {/* Plans */}
              {(Object.entries(AUTOCLICKER_PLANS) as [PlanKey, typeof AUTOCLICKER_PLANS[PlanKey]][]).map(([key, plan]) => (
                <button
                  key={key}
                  onClick={() => handleBuy(key)}
                  disabled={!!buying || (profile?.credits ?? 0) < plan.price}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl transition-all"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    opacity: (profile?.credits ?? 0) < plan.price ? 0.4 : 1,
                    cursor: (profile?.credits ?? 0) < plan.price ? "not-allowed" : "pointer",
                  }}
                >
                  <div className="text-left">
                    <p className="text-xs font-semibold" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                      {plan.hours}h de autoclicker
                    </p>
                    <p className="text-[10px]" style={{ color: "#3a3a3a" }}>1 click/seg — funciona offline</p>
                  </div>
                  <span className="text-xs font-bold" style={{ color: "#4a9a4a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                    {buying === key ? "..." : `${plan.price.toLocaleString("es-AR")} cr.`}
                  </span>
                </button>
              ))}

              {/* Claim button */}
              {isActive && (
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: "rgba(74,154,74,0.1)", border: "1px solid rgba(74,154,74,0.25)", color: "#4a9a4a", fontFamily: "var(--font-syne), Syne, sans-serif" }}
                >
                  {claiming ? "Reclamando..." : "Reclamar clicks acumulados"}
                </button>
              )}

              {/* Claimed notification */}
              <AnimatePresence>
                {claimed && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-4 py-2 rounded-xl text-center"
                    style={{ background: "rgba(74,154,74,0.08)", border: "1px solid rgba(74,154,74,0.2)" }}
                  >
                    <p className="text-xs font-semibold" style={{ color: "#4a9a4a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                      +{claimed.clicks.toLocaleString("es-AR")} clicks
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#4a9a4a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                      +{claimed.xp_gained.toLocaleString("es-AR")} XP
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
