"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Tab = "login" | "register";

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function translateError(msg: string): string {
    if (msg.includes("Invalid login credentials"))
      return "Email o contraseña incorrectos.";
    if (msg.includes("Email not confirmed"))
      return "Confirmá tu email antes de iniciar sesión.";
    if (msg.includes("User already registered"))
      return "Ya existe una cuenta con ese email.";
    if (msg.includes("Password should be at least"))
      return "La contraseña debe tener al menos 6 caracteres.";
    if (msg.includes("rate limit"))
      return "Demasiados intentos. Esperá un momento.";
    return msg;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(translateError(error.message));
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (username.trim().length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim() },
      },
    });
    setLoading(false);
    if (error) {
      setError(translateError(error.message));
      return;
    }
    setSuccess(
      "¡Cuenta creada! Revisá tu email para confirmar tu cuenta. Luego iniciá sesión."
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#000000" }}
    >
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-3">🍬</div>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{
            fontFamily: "var(--font-syne), Syne, sans-serif",
            color: "#efefef",
          }}
        >
          ChupeteClicker
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "#404040", fontFamily: "var(--font-syne)" }}
        >
          Coleccionables Argentinos
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{
          background: "#060606",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Tabs */}
        <div
          className="flex mb-6 rounded-lg p-1"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError(null);
                setSuccess(null);
              }}
              className="flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200"
              style={{
                fontFamily: "var(--font-syne)",
                background: tab === t ? "#efefef" : "transparent",
                color: tab === t ? "#000000" : "#404040",
              }}
            >
              {t === "login" ? "Iniciar Sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="mb-3 flex justify-center"><CheckCircle size={32} style={{ color: "#4a9a4a" }} /></div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#efefef" }}
              >
                {success}
              </p>
              <button
                onClick={() => {
                  setTab("login");
                  setSuccess(null);
                }}
                className="mt-4 text-sm underline"
                style={{ color: "#404040" }}
              >
                Ir a Iniciar Sesión
              </button>
            </motion.div>
          ) : (
            <motion.form
              key={tab}
              initial={{ opacity: 0, x: tab === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === "login" ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={tab === "login" ? handleLogin : handleRegister}
              className="flex flex-col gap-4"
            >
              {tab === "register" && (
                <div className="flex flex-col gap-1">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "#404040" }}
                  >
                    Nombre de usuario
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="tuchoargento"
                    required
                    minLength={3}
                    maxLength={24}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#efefef",
                      fontFamily: "var(--font-syne)",
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: "#404040" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vos@ejemplo.com"
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#efefef",
                    fontFamily: "var(--font-syne)",
                  }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: "#404040" }}
                >
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#efefef",
                    fontFamily: "var(--font-syne)",
                  }}
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs px-3 py-2 rounded-lg"
                  style={{
                    background: "rgba(255,50,50,0.1)",
                    border: "1px solid rgba(255,50,50,0.2)",
                    color: "#ff6b6b",
                  }}
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 mt-1"
                style={{
                  background: loading ? "rgba(239,239,239,0.5)" : "#efefef",
                  color: "#000000",
                  fontFamily: "var(--font-syne)",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading
                  ? "Cargando..."
                  : tab === "login"
                  ? "Entrar"
                  : "Crear cuenta"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-6 text-xs" style={{ color: "#2a2a2a" }}>
        © {new Date().getFullYear()} ChupeteClicker
      </p>
    </div>
  );
}
