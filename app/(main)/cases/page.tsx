"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CASE_LIST, getPercentages, RARITY_COLOR, DAILY_CASE_COOLDOWN_HOURS, type CaseDefinition } from "@/lib/cases";
import { RARITIES } from "@/lib/rarities";
import type { RarityKey } from "@/lib/rarities";
import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import CaseOpenModal, { type CaseResult, type ItemsByRarity } from "@/components/cases/CaseOpenModal";
import RarityText from "@/components/ui/RarityText";

function Countdown({ nextOpenAt }: { nextOpenAt: string }) {
  const [t, setT] = useState("");
  useEffect(() => {
    function tick() {
      const diff = new Date(nextOpenAt).getTime() - Date.now();
      if (diff <= 0) { setT("Disponible"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setT(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextOpenAt]);
  return <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>{t}</span>;
}

function CaseArt({ accentColor, size = 120 }: { accentColor: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <rect x="10" y="30" width="100" height="76" rx="8"
        fill={accentColor + "12"} stroke={accentColor + "40"} strokeWidth="1.5" />
      <rect x="10" y="30" width="100" height="18" rx="8"
        fill={accentColor + "20"} stroke={accentColor + "40"} strokeWidth="1.5" />
      <rect x="44" y="22" width="32" height="14" rx="4"
        fill={accentColor + "18"} stroke={accentColor + "35"} strokeWidth="1.5" />
      <rect x="48" y="57" width="24" height="3" rx="1.5"
        fill={accentColor + "60"} />
      <rect x="52" y="64" width="16" height="3" rx="1.5"
        fill={accentColor + "40"} />
      <circle cx="60" cy="75" r="6"
        fill={accentColor + "15"} stroke={accentColor + "50"} strokeWidth="1.5" />
      <circle cx="60" cy="75" r="2.5" fill={accentColor + "80"} />
    </svg>
  );
}

function DailyCaseArt({ available }: { available: boolean }) {
  const color = available ? "#4a9a4a" : "#404040";
  return (
    <svg width={56} height={56} viewBox="0 0 120 120" fill="none">
      <rect x="10" y="30" width="100" height="76" rx="8"
        fill={color + "12"} stroke={color + "40"} strokeWidth="1.5" />
      <rect x="10" y="30" width="100" height="18" rx="8"
        fill={color + "20"} stroke={color + "40"} strokeWidth="1.5" />
      <rect x="44" y="22" width="32" height="14" rx="4"
        fill={color + "18"} stroke={color + "35"} strokeWidth="1.5" />
      <path d="M50 67 L60 57 L70 67 L60 77 Z" fill={color + "50"} stroke={color + "70"} strokeWidth="1" />
    </svg>
  );
}

export default function CasesPage() {
  const { profile, refetch } = useProfile();
  const [result, setResult] = useState<CaseResult | null>(null);
  const [activeCaseDef, setActiveCaseDef] = useState<CaseDefinition | null>(null);
  const [loadingCase, setLoadingCase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dailyAvailable, setDailyAvailable] = useState(false);
  const [dailyNextOpenAt, setDailyNextOpenAt] = useState<string | null>(null);
  const [itemsByRarity, setItemsByRarity] = useState<ItemsByRarity>({});

  // Fetch all items for strip population
  useEffect(() => {
    const supabase = createClient();
    supabase.from("items").select("id, name, rarity, image_url").then(({ data }) => {
      if (!data) return;
      const grouped: ItemsByRarity = {};
      for (const item of data) {
        if (!grouped[item.rarity]) grouped[item.rarity] = [];
        grouped[item.rarity].push(item);
      }
      setItemsByRarity(grouped);
    });
  }, []);

  const fetchDailyStatus = useCallback(async () => {
    const res = await fetch("/api/daily-case");
    const data = await res.json();
    setDailyAvailable(data.available);
    setDailyNextOpenAt(data.next_open_at ?? null);
  }, []);

  useEffect(() => { fetchDailyStatus(); }, [fetchDailyStatus]);

  async function openCase(caseDef: CaseDefinition) {
    setLoadingCase(caseDef.id);
    setError(null);
    const res = await fetch("/api/open-case", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_id: caseDef.id }),
    });
    const data = await res.json();
    setLoadingCase(null);
    if (!res.ok) { setError(data.error ?? "Error al abrir."); return; }
    setActiveCaseDef(caseDef);
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
    setActiveCaseDef(null);
    setResult(data.type === "credits"
      ? { type: "credits", credits_won: data.credits_won }
      : { type: "item", item: data.item });
    fetchDailyStatus();
    refetch();
  }

  function handleClose() { setResult(null); setActiveCaseDef(null); }

  function handleOpenAnother() {
    if (!activeCaseDef) return;
    const def = activeCaseDef;
    setResult(null);
    setTimeout(() => openCase(def), 200);
  }

  const dailyRarities = [
    { rarity: "comun" as RarityKey, weight: 55 },
    { rarity: "poco_comun" as RarityKey, weight: 38 },
    { rarity: "medio_raro" as RarityKey, weight: 5 },
    { rarity: "legendario" as RarityKey, weight: 2 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          Cajas
        </h1>
        <p className="text-sm" style={{ color: "#2a2a2a" }}>
          Abrí cajas para conseguir chupetes coleccionables
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-6 px-4 py-3 rounded-xl text-sm"
            style={{ background: "rgba(255,50,50,0.08)", color: "#ff6b6b", border: "1px solid rgba(255,50,50,0.2)" }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily case */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest mb-3 font-semibold" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          Caja Diaria
        </p>
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 flex items-center gap-5"
          style={{
            background: "#060606",
            border: `1px solid ${dailyAvailable ? "rgba(74,154,74,0.35)" : "rgba(255,255,255,0.05)"}`,
          }}
        >
          <div className="flex-shrink-0">
            <DailyCaseArt available={dailyAvailable} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm mb-0.5" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
              Caja Diaria — Gratis
            </p>
            <p className="text-xs mb-3" style={{ color: "#404040" }}>
              Abrí gratis cada {DAILY_CASE_COOLDOWN_HOURS}hs. Principalmente créditos (50–300), con chance de items y rarísima chance de legendario.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(74,154,74,0.1)", color: "#4a9a4a", border: "1px solid rgba(74,154,74,0.2)" }}>
                Créditos 65%
              </span>
              {getPercentages(dailyRarities).map(({ rarity, pct }) => (
                <span key={rarity} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: RARITY_COLOR(rarity) + "12", color: RARITY_COLOR(rarity), border: `1px solid ${RARITY_COLOR(rarity)}25` }}>
                  {RARITIES[rarity].label} {pct.toFixed(1)}%
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={openDailyCase}
            disabled={!dailyAvailable || loadingCase === "daily"}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: dailyAvailable ? "#4a9a4a" : "rgba(255,255,255,0.04)",
              color: dailyAvailable ? "#fff" : "#404040",
              cursor: dailyAvailable ? "pointer" : "not-allowed",
              fontFamily: "var(--font-syne), Syne, sans-serif",
              minWidth: 130,
              textAlign: "center",
              border: "none",
            }}
          >
            {loadingCase === "daily"
              ? "Abriendo..."
              : dailyAvailable
              ? "Abrir gratis"
              : dailyNextOpenAt ? <Countdown nextOpenAt={dailyNextOpenAt} /> : "—"}
          </button>
        </motion.div>
      </div>

      {/* Paid cases */}
      <p className="text-[11px] uppercase tracking-widest mb-3 font-semibold" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
        Colecciones
      </p>
      <div className="grid gap-5 sm:grid-cols-3">
        {CASE_LIST.map((c, i) => {
          const percentages = getPercentages(c.rarities);
          const isLoading = loadingCase === c.id;
          const canAfford = (profile?.credits ?? 0) >= c.price_credits;

          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "#060606", border: `1px solid ${c.accentColor}20` }}
            >
              {/* Case art */}
              <div
                className="relative flex flex-col items-center justify-center py-8 gap-2"
                style={{ background: `linear-gradient(145deg, ${c.accentColor}10 0%, transparent 80%)` }}
              >
                <CaseArt accentColor={c.accentColor} size={100} />
                <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: c.accentColor + "aa", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                  {c.description}
                </p>
              </div>

              <div className="px-5 py-4 flex flex-col gap-4 flex-1">
                {/* Name */}
                <div>
                  <p className="font-bold text-sm" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                    {c.name}
                  </p>
                </div>

                {/* Rarity chances */}
                <div className="flex flex-col gap-2">
                  {percentages.map(({ rarity, pct }) => {
                    const color = RARITY_COLOR(rarity);
                    return (
                      <div key={rarity} className="flex items-center gap-2">
                        <RarityText rarity={rarity} className="text-[10px] w-24 flex-shrink-0" />
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <div style={{ width: `${Math.max(2, Math.min(100, pct * 3))}%`, height: "100%", background: color, borderRadius: 99 }} />
                          </div>
                          <span className="text-[10px] flex-shrink-0 w-10 text-right" style={{ color: "#3a3a3a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                            {pct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Price + button */}
                <div className="mt-auto pt-2">
                  <p className="text-xs mb-2" style={{ color: "#2a2a2a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                    {c.price_credits.toLocaleString("es-AR")} cr. por apertura
                  </p>
                  <button
                    onClick={() => openCase(c)}
                    disabled={isLoading || !canAfford}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                    style={{
                      background: isLoading || !canAfford ? "rgba(255,255,255,0.03)" : `linear-gradient(135deg, ${c.accentColor}cc, ${c.accentColor}88)`,
                      color: isLoading || !canAfford ? "#404040" : "#fff",
                      cursor: isLoading || !canAfford ? "not-allowed" : "pointer",
                      fontFamily: "var(--font-syne), Syne, sans-serif",
                      border: `1px solid ${isLoading || !canAfford ? "rgba(255,255,255,0.05)" : c.accentColor + "40"}`,
                    }}
                  >
                    {isLoading
                      ? "Abriendo..."
                      : !canAfford
                      ? `Faltan ${(c.price_credits - (profile?.credits ?? 0)).toLocaleString("es-AR")} cr.`
                      : "Abrir caja"}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      {result && (
        <CaseOpenModal
          result={result}
          caseRarities={activeCaseDef?.rarities ?? dailyRarities}
          itemsByRarity={itemsByRarity}
          onClose={handleClose}
          onOpenAnother={activeCaseDef ? handleOpenAnother : undefined}
        />
      )}
    </div>
  );
}
