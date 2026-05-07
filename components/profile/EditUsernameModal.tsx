"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface EditUsernameModalProps {
  currentUsername: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditUsernameModal({
  currentUsername,
  isOpen,
  onClose,
}: EditUsernameModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSave() {
    const trimmed = username.trim();
    setError(null);

    if (trimmed.length < 3 || trimmed.length > 24) {
      setError("El nombre debe tener entre 3 y 24 caracteres.");
      return;
    }
    if (!/^[a-zA-Z0-9_\-]+$/.test(trimmed)) {
      setError("Solo letras, números, _ y -");
      return;
    }
    if (trimmed === currentUsername) {
      onClose();
      return;
    }

    setLoading(true);

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", trimmed)
      .maybeSingle();

    if (existing) {
      setError("Ese nombre ya está en uso.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("No autenticado.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: trimmed })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Update localStorage cache
    try {
      const raw = localStorage.getItem("chupete_profile");
      if (raw) {
        localStorage.setItem(
          "chupete_profile",
          JSON.stringify({ ...JSON.parse(raw), username: trimmed })
        );
      }
    } catch {}

    router.push(`/perfil/${trimmed}`);
    router.refresh();
    onClose();
    setLoading(false);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="eu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.8)" }}
          />
          <motion.div
            key="eu-modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xs rounded-2xl p-6"
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-sm"
              style={{ background: "rgba(255,255,255,0.05)", color: "#404040" }}
            >
              <X size={14} className="inline-block" />
            </button>

            <h2
              className="text-base font-bold mb-4"
              style={{
                color: "#efefef",
                fontFamily: "var(--font-syne), Syne, sans-serif",
              }}
            >
              Cambiar usuario
            </h2>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={24}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none mb-1"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#efefef",
                fontFamily: "var(--font-syne), Syne, sans-serif",
              }}
            />
            <p className="text-[10px] mb-3" style={{ color: "#2a2a2a" }}>
              3–24 caracteres. Letras, números, _ y -
            </p>

            {error && (
              <p
                className="text-xs mb-3 px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(255,50,50,0.1)",
                  color: "#ff6b6b",
                  border: "1px solid rgba(255,50,50,0.2)",
                }}
              >
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg text-sm"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "#404040",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-2 rounded-lg text-sm font-bold"
                style={{
                  background: loading ? "rgba(239,239,239,0.3)" : "#efefef",
                  color: "#000",
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
