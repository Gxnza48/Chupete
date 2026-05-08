"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const STORAGE_KEY = "chupete_welcomed_v1";

const STEPS = [
  {
    emoji: "🍬",
    title: "¡Bienvenido a ChupeteClicker!",
    description:
      "El juego de coleccionables argentinos. Clickeá, abrí cajas y conseguí items únicos con rarezas exclusivas.",
  },
  {
    emoji: "💰",
    title: "Clickeá para ganar créditos",
    description:
      "Cada click al chupete te da créditos. Cuanto más clickeás, más créditos acumulás. También hay una caja diaria gratis.",
  },
  {
    emoji: "📦",
    title: "Abrí cajas y coleccioná items",
    description:
      "Con los créditos podés abrir cajas y conseguir chupetes con diferentes rarezas: desde Común hasta En el Ort.",
  },
  {
    emoji: "🛒",
    title: "Vendé en el mercado",
    description:
      "Los items que conseguís se pueden vender a otros jugadores en el mercado interno. ¡Los más raros valen más!",
  },
];

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  }

  const current = STEPS[step];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm px-4"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "#0D0D1F",
                border: "1px solid rgba(124,58,237,0.28)",
                boxShadow: "0 0 50px rgba(124,58,237,0.15), 0 24px 64px rgba(0,0,0,0.7)",
              }}
            >
              {/* Neon top line */}
              <div
                style={{
                  height: 2,
                  background:
                    "linear-gradient(90deg, transparent, #7C3AED, #A78BFA, transparent)",
                }}
              />

              <div className="p-6">
                {/* Close */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 cursor-pointer transition-opacity duration-200"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  <X size={18} />
                </button>

                {/* Step content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className="text-center"
                  >
                    <div className="text-5xl mb-5">{current.emoji}</div>
                    <h2
                      className="text-lg font-extrabold mb-3 leading-tight"
                      style={{
                        color: "#E2E8F0",
                        fontFamily: "var(--font-syne), Syne, sans-serif",
                      }}
                    >
                      {current.title}
                    </h2>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "var(--font-syne), Syne, sans-serif",
                      }}
                    >
                      {current.description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 mt-6 mb-5">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className="rounded-full transition-all duration-200 cursor-pointer"
                      style={{
                        width: i === step ? 20 : 6,
                        height: 6,
                        background:
                          i === step
                            ? "linear-gradient(90deg, #7C3AED, #A78BFA)"
                            : "rgba(255,255,255,0.12)",
                      }}
                    />
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={handleNext}
                  className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 50%, #A78BFA 100%)",
                    color: "#fff",
                    fontFamily: "var(--font-syne), Syne, sans-serif",
                    letterSpacing: "0.05em",
                    boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                  }}
                >
                  {step < STEPS.length - 1 ? "Siguiente →" : "¡Empezar a clickear!"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
