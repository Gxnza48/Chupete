"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, AlertTriangle, Zap } from "lucide-react";
import type { DropResult } from "@/types/database";
import { getConditionLabel, RARITIES } from "@/lib/rarities";
import type { RarityKey } from "@/lib/rarities";
import RarityText from "./RarityText";
import Image from "next/image";

export type ToastVariant = "default" | "drop" | "levelup" | "error" | "broke" | "badge";

export interface ToastData {
  id: string;
  variant: ToastVariant;
  message?: string;
  drop?: DropResult;
  level?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<ToastData, "id">) => void;
}

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

function DropToastContent({ drop }: { drop: DropResult }) {
  const condition = getConditionLabel(drop.float_value);
  const rarityConfig = RARITIES[drop.rarity as RarityKey];
  const borderColor = rarityConfig.gradient
    ? rarityConfig.gradient[0]
    : (rarityConfig.color ?? "#efefef");

  return (
    <div
      className="flex items-start gap-3"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        paddingLeft: "12px",
      }}
    >
      <div
        className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        {drop.item.image_url ? (
          <Image
            src={drop.item.image_url}
            alt={drop.item.name}
            width={48}
            height={48}
            className="object-cover w-full h-full" style={{ mixBlendMode: "screen" }}
          />
        ) : (
          <span className="text-2xl">🎁</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs mb-0.5" style={{ color: "#404040" }}>
          ¡Nuevo drop!
        </p>
        <p
          className="font-semibold text-sm truncate"
          style={{ color: "#efefef" }}
        >
          {drop.item.name}
        </p>
        <RarityText
          rarity={drop.rarity as RarityKey}
          className="text-xs font-medium"
        />
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-xs"
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              color: "#404040",
            }}
          >
            {drop.float_value.toFixed(8)}
          </span>
          <span className="text-xs" style={{ color: "#404040" }}>
            · {condition}
          </span>
        </div>
        {drop.isNewRecord && (
          <span
            className="text-xs px-1.5 py-0.5 rounded mt-1 inline-block"
            style={{
              background: "rgba(255,170,0,0.15)",
              color: "#ffaa00",
              border: "1px solid rgba(255,170,0,0.3)",
            }}
          >
            ¡Mejor float!
          </span>
        )}
      </div>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: (id: string) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="relative rounded-xl p-4 cursor-pointer select-none"
      style={{
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        width: "320px",
        maxWidth: "calc(100vw - 32px)",
      }}
      onClick={() => onDismiss(toast.id)}
    >
      {toast.variant === "drop" && toast.drop && (
        <DropToastContent drop={toast.drop} />
      )}
      {toast.variant === "levelup" && (
        <div className="flex items-center gap-3">
          <TrendingUp size={24} className="inline-block" style={{ color: "#efefef" }} />
          <div>
            <p className="font-bold text-sm" style={{ color: "#efefef" }}>
              ¡Subiste de nivel!
            </p>
            <p className="text-xs" style={{ color: "#404040" }}>
              Ahora sos nivel{" "}
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  color: "#efefef",
                }}
              >
                {toast.level}
              </span>
            </p>
          </div>
        </div>
      )}
      {toast.variant === "default" && (
        <p className="text-sm" style={{ color: "#efefef" }}>
          {toast.message}
        </p>
      )}
      {toast.variant === "error" && (
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="inline-block" style={{ color: "#ff6b6b", flexShrink: 0 }} />
          <p className="text-sm" style={{ color: "#ff6b6b" }}>
            {toast.message}
          </p>
        </div>
      )}
      {toast.variant === "badge" && (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: "rgba(255,170,0,0.12)", border: "1px solid rgba(255,170,0,0.3)" }}>
            {toast.message?.split("|")[0] ?? "🏆"}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "#ffaa00" }}>
              ¡Logro desbloqueado!
            </p>
            <p className="font-bold text-sm" style={{ color: "#efefef" }}>
              {toast.message?.split("|")[1] ?? "Badge obtenido"}
            </p>
          </div>
        </div>
      )}
      {toast.variant === "broke" && (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.25)" }}>
            <Zap size={18} style={{ color: "#ff4444" }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "#ff4444" }}>
              {toast.message ? `¡${toast.message} se rompió!` : "¡Tu chupete se rompió!"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#404040" }}>
              Ya no está equipado.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2 pointer-events-none"
        style={{ maxHeight: "90vh", overflowY: "hidden" }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
