"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Check } from "lucide-react";

interface Props {
  onSuccess?: () => void;
}

export default function PromoCode({ onSuccess }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ credits: number; code: string } | null>(null);

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al canjear.");
      return;
    }

    setSuccess({ credits: data.credits, code: data.code });
    setCode("");
    onSuccess?.();
    setTimeout(() => setSuccess(null), 6000);
  }

  return (
    <div>
      <p
        className="text-[11px] uppercase tracking-widest mb-3 font-semibold"
        style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}
      >
        Código Promocional
      </p>

      <div
        className="rounded-2xl p-5"
        style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Ticket size={14} style={{ color: "#404040" }} />
          <p
            className="text-sm font-semibold"
            style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}
          >
            Canjear código
          </p>
        </div>
        <p
          className="text-xs mb-4"
          style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}
        >
          Ingresá un código y obtené créditos gratis. Cada código se puede canjear solo una vez.
        </p>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{
                background: "rgba(74,154,74,0.08)",
                border: "1px solid rgba(74,154,74,0.2)",
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(74,154,74,0.12)" }}
              >
                <Check size={18} style={{ color: "#4ade80" }} />
              </div>
              <div>
                <p
                  className="text-sm font-bold"
                  style={{ color: "#4ade80", fontFamily: "var(--font-syne), Syne, sans-serif" }}
                >
                  ¡{success.code} canjeado!
                </p>
                <p
                  className="text-xs"
                  style={{ color: "#404040", fontFamily: "var(--font-syne), Syne, sans-serif" }}
                >
                  +{success.credits.toLocaleString("es-AR")} créditos añadidos
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleRedeem}
              className="flex gap-2"
            >
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="INGRESÁ TU CÓDIGO"
                maxLength={32}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "#efefef",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  letterSpacing: "0.05em",
                }}
              />
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex-shrink-0"
                style={{
                  background:
                    loading || !code.trim()
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(74,154,74,0.15)",
                  color: loading || !code.trim() ? "#404040" : "#4ade80",
                  border: `1px solid ${
                    loading || !code.trim()
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(74,154,74,0.25)"
                  }`,
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                  cursor: loading || !code.trim() ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "..." : "Canjear"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 text-xs px-3 py-2 rounded-xl"
              style={{
                background: "rgba(255,50,50,0.08)",
                border: "1px solid rgba(255,50,50,0.2)",
                color: "#ff6b6b",
                fontFamily: "var(--font-syne), Syne, sans-serif",
              }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
