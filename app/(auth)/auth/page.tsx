"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

type Tab = "login" | "register";

const BG_ORBS = [
  { size: 400, x: "-5%", y: "5%", delay: 0, color: "rgba(124,58,237,0.07)" },
  { size: 250, x: "75%", y: "60%", delay: 2.5, color: "rgba(167,139,250,0.06)" },
  { size: 180, x: "65%", y: "5%", delay: 4.5, color: "rgba(244,63,94,0.05)" },
  { size: 200, x: "30%", y: "80%", delay: 1.5, color: "rgba(124,58,237,0.05)" },
];

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [googleHover, setGoogleHover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const inputStyle = (name: string) => ({
    background: "rgba(255,255,255,0.03)",
    border:
      focusedField === name
        ? "1px solid rgba(124,58,237,0.55)"
        : "1px solid rgba(255,255,255,0.07)",
    boxShadow:
      focusedField === name ? "0 0 0 3px rgba(124,58,237,0.12)" : "none",
    color: "#E2E8F0",
    fontFamily: "var(--font-syne), Syne, sans-serif",
    transition: "border 0.2s, box-shadow 0.2s",
  });

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(translateError(error.message)); return; }
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
      options: { data: { username: username.trim() } },
    });
    setLoading(false);
    if (error) { setError(translateError(error.message)); return; }
    setSuccess("¡Cuenta creada! Revisá tu email para confirmar tu cuenta. Luego iniciá sesión.");
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(translateError(error.message));
      setGoogleLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#0D0D1F" }}
    >
      {/* Background orbs */}
      {BG_ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(50px)",
          }}
          animate={{ y: [0, -18, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 7, delay: orb.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Logo */}
      <motion.div
        className="mb-8 text-center relative z-10"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <motion.div
          className="text-5xl mb-3 inline-block select-none"
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          🍬
        </motion.div>
        <h1
          className="text-4xl font-extrabold tracking-tight leading-none"
          style={{
            fontFamily: "var(--font-syne), Syne, sans-serif",
            color: "#E2E8F0",
            textShadow:
              "0 0 24px rgba(124,58,237,0.6), 0 0 60px rgba(124,58,237,0.25)",
          }}
        >
          ChupeteClicker
        </h1>
        <p
          className="text-[10px] mt-2 font-bold tracking-[0.2em] uppercase"
          style={{ color: "#7C3AED", fontFamily: "var(--font-syne)" }}
        >
          Coleccionables Argentinos
        </p>
      </motion.div>

      {/* Card */}
      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
      >
        {/* Neon top line */}
        <div
          className="absolute top-0 left-8 right-8 h-px rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.8), rgba(167,139,250,0.8), transparent)",
            filter: "blur(0.5px)",
          }}
        />

        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(13,11,35,0.85)",
            border: "1px solid rgba(124,58,237,0.22)",
            backdropFilter: "blur(24px)",
            boxShadow:
              "0 0 50px rgba(124,58,237,0.12), 0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Tabs */}
          <div
            className="flex mb-6 rounded-xl p-1"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-250 cursor-pointer"
                style={{
                  fontFamily: "var(--font-syne)",
                  background:
                    tab === t
                      ? "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)"
                      : "transparent",
                  color: tab === t ? "#ffffff" : "rgba(255,255,255,0.28)",
                  boxShadow:
                    tab === t ? "0 0 18px rgba(124,58,237,0.45)" : "none",
                  letterSpacing: "0.02em",
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
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="text-center py-6"
              >
                <motion.div
                  className="mb-4 flex justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(74,154,74,0.1)",
                      border: "1px solid rgba(74,154,74,0.3)",
                      boxShadow: "0 0 24px rgba(74,154,74,0.25)",
                    }}
                  >
                    <CheckCircle size={28} style={{ color: "#4ade80" }} />
                  </div>
                </motion.div>
                <p
                  className="text-sm leading-relaxed font-medium"
                  style={{ color: "#E2E8F0", fontFamily: "var(--font-syne)" }}
                >
                  {success}
                </p>
                <button
                  onClick={() => { setTab("login"); setSuccess(null); }}
                  className="mt-5 text-sm font-semibold transition-all duration-200 cursor-pointer"
                  style={{ color: "#A78BFA" }}
                >
                  Ir a Iniciar Sesión →
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: tab === "login" ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tab === "login" ? 16 : -16 }}
                transition={{ duration: 0.22 }}
              >
                {/* Google button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  onMouseEnter={() => setGoogleHover(true)}
                  onMouseLeave={() => setGoogleHover(false)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer"
                  style={{
                    background: googleHover
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(255,255,255,0.04)",
                    border: googleHover
                      ? "1px solid rgba(255,255,255,0.16)"
                      : "1px solid rgba(255,255,255,0.09)",
                    color: "#E2E8F0",
                    fontFamily: "var(--font-syne)",
                  }}
                >
                  {googleLoading ? (
                    <div
                      className="w-4 h-4 rounded-full border-2 animate-spin"
                      style={{
                        borderColor: "rgba(255,255,255,0.25)",
                        borderTopColor: "#fff",
                      }}
                    />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continuar con Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                  <span
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-syne)" }}
                  >
                    o
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                </div>

                <form
                  onSubmit={tab === "login" ? handleLogin : handleRegister}
                  className="flex flex-col gap-4"
                >
                  {tab === "register" && (
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[11px] font-bold tracking-[0.12em] uppercase"
                        style={{ color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-syne)" }}
                      >
                        Nombre de usuario
                      </label>
                      <div className="relative">
                        <User
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: "rgba(255,255,255,0.22)" }}
                        />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="tuchoargento"
                          required
                          minLength={3}
                          maxLength={24}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                          style={inputStyle("username")}
                          onFocus={() => setFocusedField("username")}
                          onBlur={() => setFocusedField(null)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-[11px] font-bold tracking-[0.12em] uppercase"
                      style={{ color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-syne)" }}
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "rgba(255,255,255,0.22)" }}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vos@ejemplo.com"
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                        style={inputStyle("email")}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-[11px] font-bold tracking-[0.12em] uppercase"
                      style={{ color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-syne)" }}
                    >
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "rgba(255,255,255,0.22)" }}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none"
                        style={inputStyle("password")}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors duration-200"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs px-3 py-2.5 rounded-xl leading-relaxed"
                      style={{
                        background: "rgba(244,63,94,0.08)",
                        border: "1px solid rgba(244,63,94,0.2)",
                        color: "#fb7185",
                        fontFamily: "var(--font-syne)",
                      }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 mt-1 cursor-pointer"
                    style={{
                      background: loading
                        ? "rgba(124,58,237,0.35)"
                        : "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 50%, #A78BFA 100%)",
                      color: "#ffffff",
                      fontFamily: "var(--font-syne)",
                      letterSpacing: "0.07em",
                      boxShadow: loading
                        ? "none"
                        : "0 0 24px rgba(124,58,237,0.45), 0 4px 16px rgba(0,0,0,0.3)",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border-2 animate-spin"
                          style={{
                            borderColor: "rgba(255,255,255,0.3)",
                            borderTopColor: "#fff",
                          }}
                        />
                        Cargando...
                      </span>
                    ) : tab === "login" ? (
                      "ENTRAR"
                    ) : (
                      "CREAR CUENTA"
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.p
        className="mt-6 text-xs relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ color: "rgba(255,255,255,0.1)", fontFamily: "var(--font-syne)" }}
      >
        © {new Date().getFullYear()} ChupeteClicker
      </motion.p>
    </div>
  );
}
