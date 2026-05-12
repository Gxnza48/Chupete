"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CASE_LIST, getPercentages, RARITY_COLOR, DAILY_CASE_COOLDOWN_HOURS, type CaseDefinition, type CaseRarityEntry } from "@/lib/cases";
import { RARITIES } from "@/lib/rarities";
import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import CaseOpenModal, { type CaseResult, type ItemsByRarity } from "@/components/cases/CaseOpenModal";
import RarityText from "@/components/ui/RarityText";
import ItemSVG from "@/components/ui/ItemSVG";
import PromoCode from "@/components/ui/PromoCode";

/* ─── Countdown ─────────────────────────────────────────────────────────── */
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

const DAILY_IMAGE = "https://wudlmpexpazsvuxfdkcl.supabase.co/storage/v1/object/public/item-assets/daily.png";

/* ─── Drops preview section ──────────────────────────────────────────────── */
function DropsPreview({ rarities, itemsByRarity }: { rarities: CaseRarityEntry[]; itemsByRarity: ItemsByRarity }) {
  const percentages = getPercentages(rarities);
  return (
    <div className="flex flex-col gap-4 pt-2">
      {percentages.map(({ rarity, pct }) => {
        const color = RARITY_COLOR(rarity);
        const items = itemsByRarity[rarity] ?? [];
        return (
          <div key={rarity}>
            <div className="flex items-center gap-2 mb-2">
              <RarityText rarity={rarity} className="text-[11px] font-bold" />
              <span className="text-[10px]" style={{ color: "#2a2a2a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                {pct.toFixed(2)}%
              </span>
            </div>
            {items.length === 0 ? (
              <p className="text-[10px]" style={{ color: "#2a2a2a" }}>Sin items cargados</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col items-center gap-1 rounded-lg p-1.5"
                    style={{ background: color + "0c", border: `1px solid ${color}25`, width: 64 }}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <ItemSVG name={item.name} rarity={rarity} size={40} glow={false} />
                    </div>
                    <p className="text-[8px] text-center leading-tight line-clamp-2" style={{ color: "#404040" }}>
                      {item.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Confirm dialog ─────────────────────────────────────────────────────── */
function ConfirmDialog({
  caseDef,
  credits,
  onConfirm,
  onCancel,
}: {
  caseDef: CaseDefinition;
  credits: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const remaining = credits - caseDef.price_credits;
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.7)" }}
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xs rounded-2xl p-6"
        style={{ background: "#0a0a0a", border: `1px solid ${caseDef.accentColor}30` }}
      >
        <p className="font-bold text-base mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          ¿Confirmar apertura?
        </p>
        <p className="text-xs mb-5" style={{ color: "#404040" }}>
          {caseDef.name} · {caseDef.description}
        </p>
        <div className="rounded-xl p-4 mb-5 flex flex-col gap-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: "#404040" }}>Costo</span>
            <span style={{ color: "#efefef", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
              {caseDef.price_credits.toLocaleString("es-AR")} cr.
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "#404040" }}>Tus créditos</span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "#efefef" }}>
              {credits.toLocaleString("es-AR")} cr.
            </span>
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
          <div className="flex justify-between text-sm font-bold">
            <span style={{ color: "#404040" }}>Después</span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: remaining >= 0 ? "#efefef" : "#ff6b6b" }}>
              {remaining.toLocaleString("es-AR")} cr.
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.04)", color: "#404040", border: "1px solid rgba(255,255,255,0.07)", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: `linear-gradient(135deg, ${caseDef.accentColor}cc, ${caseDef.accentColor}88)`, color: "#fff", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
            Abrir
          </button>
        </div>
      </motion.div>
    </>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function CasesPage() {
  const { profile, isLoading: profileLoading, refetch } = useProfile();
  const credits = Number(profile?.credits ?? 0);

  const [result, setResult] = useState<CaseResult | null>(null);
  const [activeCaseDef, setActiveCaseDef] = useState<CaseDefinition | null>(null);
  const [loadingCase, setLoadingCase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dailyAvailable, setDailyAvailable] = useState(false);
  const [dailyNextOpenAt, setDailyNextOpenAt] = useState<string | null>(null);
  const [itemsByRarity, setItemsByRarity] = useState<ItemsByRarity>({});
  const [confirmCase, setConfirmCase] = useState<CaseDefinition | null>(null);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  // Fetch all items
  useEffect(() => {
    const supabase = createClient();
    supabase.from("items").select("id, name, rarity").then(({ data }) => {
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
    setConfirmCase(null);
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

  const dailyRarities: CaseRarityEntry[] = [
    { rarity: "comun", weight: 55 },
    { rarity: "poco_comun", weight: 38 },
    { rarity: "medio_raro", weight: 5 },
    { rarity: "legendario", weight: 2 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Cajas</h1>
        <p className="text-sm" style={{ color: "#2a2a2a" }}>Abrí cajas para conseguir chupetes coleccionables</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mb-6 px-4 py-3 rounded-xl text-sm"
            style={{ background: "rgba(255,50,50,0.08)", color: "#ff6b6b", border: "1px solid rgba(255,50,50,0.2)" }}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily case */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest mb-3 font-semibold" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Caja Diaria</p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "#060606", border: `1px solid ${dailyAvailable ? "rgba(74,154,74,0.35)" : "rgba(255,255,255,0.05)"}` }}>
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <div className="flex-shrink-0 self-start sm:self-auto">
              <Image
                src={DAILY_IMAGE}
                alt="Caja Diaria"
                width={88}
                height={88}
                className="object-contain"
                style={{ opacity: dailyAvailable ? 1 : 0.35 }}
              />
            </div>
            <div className="flex-1 w-full min-w-0">
              <p className="font-bold text-sm mb-0.5" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                Caja Diaria — Gratis
              </p>
              <p className="text-xs mb-3" style={{ color: "#404040" }}>
                Cada {DAILY_CASE_COOLDOWN_HOURS}hs. Principalmente créditos (50–300) con chance de items y rarísima chance de legendario.
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
            <button onClick={openDailyCase} disabled={!dailyAvailable || loadingCase === "daily"}
              className="w-full sm:w-auto sm:flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{
                background: dailyAvailable ? "#4a9a4a" : "rgba(255,255,255,0.04)",
                color: dailyAvailable ? "#fff" : "#404040",
                cursor: dailyAvailable ? "pointer" : "not-allowed",
                fontFamily: "var(--font-syne), Syne, sans-serif",
                minWidth: 130,
                textAlign: "center", border: "none",
              }}>
              {loadingCase === "daily" ? "Abriendo..." : dailyAvailable ? "Abrir gratis" : dailyNextOpenAt ? <Countdown nextOpenAt={dailyNextOpenAt} /> : "—"}
            </button>
          </div>

          {/* Daily drops preview */}
          <div>
            <button
              onClick={() => setExpandedCase(expandedCase === "daily" ? null : "daily")}
              className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium transition-colors"
              style={{ color: "#2a2a2a", borderTop: "1px solid rgba(255,255,255,0.04)", fontFamily: "var(--font-syne), Syne, sans-serif" }}
            >
              Ver posibles drops
              {expandedCase === "daily" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {expandedCase === "daily" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <DropsPreview rarities={dailyRarities} itemsByRarity={itemsByRarity} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Paid cases */}
      <p className="text-[11px] uppercase tracking-widest mb-3 font-semibold" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Colecciones</p>
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-3" style={{ alignItems: "start" }}>
        {CASE_LIST.map((c, i) => {
          const percentages = getPercentages(c.rarities);
          const isLoading = loadingCase === c.id;
          const canAfford = !profileLoading && credits >= c.price_credits;
          const isExpanded = expandedCase === c.id;

          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "#060606", border: `1px solid ${c.accentColor}20` }}>

              {/* Case art */}
              <div className="relative flex flex-col items-center justify-center py-8 gap-2"
                style={{ background: `linear-gradient(145deg, ${c.accentColor}10 0%, transparent 80%)` }}>
                <Image
                  src={c.imageUrl}
                  alt={c.name}
                  width={160}
                  height={160}
                  className="object-contain"
                />
                <p className="text-[10px] uppercase tracking-widest font-semibold"
                  style={{ color: c.accentColor + "aa", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                  {c.description}
                </p>
              </div>

              <div className="px-5 py-4 flex flex-col gap-4 flex-1">
                <p className="font-bold text-sm" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>{c.name}</p>

                {/* Rarity bars */}
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
                          <span className="text-[10px] w-10 text-right flex-shrink-0"
                            style={{ color: "#3a3a3a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
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
                    onClick={() => setConfirmCase(c)}
                    disabled={isLoading || profileLoading || !canAfford}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                    style={{
                      background: isLoading || profileLoading || !canAfford ? "rgba(255,255,255,0.03)" : `linear-gradient(135deg, ${c.accentColor}cc, ${c.accentColor}88)`,
                      color: isLoading || profileLoading || !canAfford ? "#404040" : "#fff",
                      cursor: isLoading || profileLoading || !canAfford ? "not-allowed" : "pointer",
                      fontFamily: "var(--font-syne), Syne, sans-serif",
                      border: `1px solid ${isLoading || profileLoading || !canAfford ? "rgba(255,255,255,0.05)" : c.accentColor + "40"}`,
                    }}>
                    {isLoading ? "Abriendo..."
                      : profileLoading ? "Cargando..."
                      : !canAfford ? `Faltan ${(c.price_credits - credits).toLocaleString("es-AR")} cr.`
                      : "Abrir caja"}
                  </button>
                </div>
              </div>

              {/* Drops preview toggle */}
              <button
                onClick={() => setExpandedCase(isExpanded ? null : c.id)}
                className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium transition-colors"
                style={{ color: "#2a2a2a", borderTop: `1px solid ${c.accentColor}15`, fontFamily: "var(--font-syne), Syne, sans-serif" }}
              >
                Ver posibles drops
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5" style={{ borderTop: `1px solid ${c.accentColor}15` }}>
                      <DropsPreview rarities={c.rarities} itemsByRarity={itemsByRarity} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Promo codes */}
      <div className="mt-10">
        <PromoCode onSuccess={refetch} />
      </div>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmCase && (
          <ConfirmDialog
            caseDef={confirmCase}
            credits={credits}
            onConfirm={() => openCase(confirmCase)}
            onCancel={() => setConfirmCase(null)}
          />
        )}
      </AnimatePresence>

      {/* Opening modal */}
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
