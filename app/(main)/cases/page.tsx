"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CASE_LIST, getPercentages, RARITY_COLOR, DAILY_CASE_COOLDOWN_HOURS } from "@/lib/cases";
import { RARITIES } from "@/lib/rarities";
import type { RarityKey } from "@/lib/rarities";
import { useProfile } from "@/hooks/useProfile";
import CaseOpenModal, { type CaseResult } from "@/components/cases/CaseOpenModal";
import RarityText from "@/components/ui/RarityText";

function Countdown({ nextOpenAt }: { nextOpenAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const diff = new Date(nextOpenAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("¡Disponible!"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    }
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [nextOpenAt]);

  return <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>{timeLeft}</span>;
}

export default function CasesPage() {
  const { profile, refetch } = useProfile();
  const [result, setResult] = useState<CaseResult | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [loadingCase, setLoadingCase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dailyAvailable, setDailyAvailable] = useState(false);
  const [dailyNextOpenAt, setDailyNextOpenAt] = useState<string | null>(null);

  const fetchDailyStatus = useCallback(async () => {
    const res = await fetch("/api/daily-case");
    const data = await res.json();
    setDailyAvailable(data.available);
    setDailyNextOpenAt(data.next_open_at ?? null);
  }, []);

  useEffect(() => { fetchDailyStatus(); }, [fetchDailyStatus]);

  async function openCase(caseId: string) {
    setLoadingCase(caseId);
    setError(null);
    const res = await fetch("/api/open-case", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_id: caseId }),
    });
    const data = await res.json();
    setLoadingCase(null);
    if (!res.ok) { setError(data.error ?? "Error al abrir."); return; }
    setActiveCaseId(caseId);
    setResult({ type: "item", item: data.item });
    refetch();
  }

  async function openDailyCase() {
    setLoadingCase("daily");
    setError(null);
    const res = await fetch("/api/daily-case", { method: "POST" });
    const data = await res.json();
    setLoadingCase(null);
    if (!res.ok) { setError(data.error ?? "Error."); return; }
    setActiveCaseId("daily");
    setResult(data.type === "credits"
      ? { type: "credits", credits_won: data.credits_won }
      : { type: "item", item: data.item }
    );
    fetchDailyStatus();
    refetch();
  }

  function handleClose() {
    setResult(null);
    setActiveCaseId(null);
  }

  function handleOpenAnother() {
    if (!activeCaseId || activeCaseId === "daily") return;
    setResult(null);
    setTimeout(() => openCase(activeCaseId), 100);
  }

  const dailyRarities = [
    { rarity: "comun" as RarityKey, weight: 55 },
    { rarity: "poco_comun" as RarityKey, weight: 38 },
    { rarity: "medio_raro" as RarityKey, weight: 5 },
    { rarity: "legendario" as RarityKey, weight: 2 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          Cajas
        </h1>
        <p className="text-sm" style={{ color: "#2a2a2a" }}>
          Abrí cajas para conseguir chupetes coleccionables
        </p>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-6 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(255,50,50,0.08)", color: "#ff6b6b", border: "1px solid rgba(255,50,50,0.2)" }}
        >
          {error}
        </motion.p>
      )}

      {/* Daily case */}
      <div className="mb-10">
        <h2 className="text-xs uppercase tracking-widest mb-4 font-semibold" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          Caja Diaria — Gratis
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6"
          style={{
            background: "#060606",
            border: `1px solid ${dailyAvailable ? "rgba(74,154,74,0.4)" : "rgba(255,255,255,0.06)"}`,
            boxShadow: dailyAvailable ? "0 0 30px rgba(74,154,74,0.08)" : "none",
          }}
        >
          <div className="text-5xl flex-shrink-0">🎁</div>
          <div className="flex-1">
            <p className="font-bold text-base mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
              Caja Diaria
            </p>
            <p className="text-sm mb-3" style={{ color: "#404040" }}>
              Cada {DAILY_CASE_COOLDOWN_HOURS}hs podés abrir una caja gratis. Créditos, items comunes y una chance casi imposible de un legendario.
            </p>
            <div className="flex flex-wrap gap-2 mb-1">
              {getPercentages(dailyRarities).map(({ rarity, pct }) => (
                <span key={rarity} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: RARITY_COLOR(rarity) + "15", color: RARITY_COLOR(rarity), border: `1px solid ${RARITY_COLOR(rarity)}30` }}>
                  {RARITIES[rarity].label} {pct.toFixed(1)}%
                </span>
              ))}
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(74,154,74,0.12)", color: "#4a9a4a", border: "1px solid rgba(74,154,74,0.25)" }}>
                Créditos 65%
              </span>
            </div>
          </div>
          <button
            onClick={openDailyCase}
            disabled={!dailyAvailable || loadingCase === "daily"}
            className="px-6 py-3 rounded-xl font-bold text-sm flex-shrink-0 transition-all"
            style={{
              background: dailyAvailable ? "#4a9a4a" : "rgba(255,255,255,0.04)",
              color: dailyAvailable ? "#ffffff" : "#404040",
              border: `1px solid ${dailyAvailable ? "transparent" : "rgba(255,255,255,0.07)"}`,
              cursor: dailyAvailable ? "pointer" : "not-allowed",
              fontFamily: "var(--font-syne), Syne, sans-serif",
              minWidth: 140,
              textAlign: "center",
            }}
          >
            {loadingCase === "daily" ? "Abriendo..." : dailyAvailable ? "Abrir gratis" : dailyNextOpenAt ? <Countdown nextOpenAt={dailyNextOpenAt} /> : "No disponible"}
          </button>
        </motion.div>
      </div>

      {/* Buyable cases */}
      <h2 className="text-xs uppercase tracking-widest mb-4 font-semibold" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
        Cajas con Créditos
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {CASE_LIST.map((c, i) => {
          const percentages = getPercentages(c.rarities);
          const isLoading = loadingCase === c.id;
          const canAfford = (profile?.credits ?? 0) >= c.price_credits;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "#060606", border: `1px solid ${c.accentColor}25` }}
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4 flex items-center gap-3"
                style={{ borderBottom: `1px solid ${c.accentColor}15` }}>
                <span className="text-3xl">{c.emoji}</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>{c.name}</p>
                  <p className="text-[11px]" style={{ color: "#2a2a2a" }}>{c.description}</p>
                </div>
              </div>

              {/* Rarity chances */}
              <div className="px-5 py-4 flex flex-col gap-2 flex-1">
                {percentages.map(({ rarity, pct }) => {
                  const color = RARITY_COLOR(rarity);
                  return (
                    <div key={rarity} className="flex items-center justify-between gap-2">
                      <RarityText rarity={rarity} className="text-[11px]" />
                      <div className="flex items-center gap-2 flex-1 max-w-[120px]">
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <div style={{ width: `${Math.min(100, pct * 2)}%`, height: "100%", background: color, borderRadius: 99 }} />
                        </div>
                        <span className="text-[10px] flex-shrink-0" style={{ color: "#3a3a3a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Buy button */}
              <div className="px-5 pb-5">
                <button
                  onClick={() => openCase(c.id)}
                  disabled={isLoading || !canAfford}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: isLoading || !canAfford ? "rgba(255,255,255,0.04)" : "#efefef",
                    color: isLoading || !canAfford ? "#404040" : "#000000",
                    cursor: isLoading || !canAfford ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-syne), Syne, sans-serif",
                  }}
                >
                  {isLoading
                    ? "Abriendo..."
                    : !canAfford
                    ? `Necesitás ${c.price_credits.toLocaleString("es-AR")} cr.`
                    : `Abrir — ${c.price_credits.toLocaleString("es-AR")} cr.`}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <CaseOpenModal
        result={result}
        onClose={handleClose}
        onOpenAnother={activeCaseId && activeCaseId !== "daily" ? handleOpenAnother : undefined}
      />
    </div>
  );
}
