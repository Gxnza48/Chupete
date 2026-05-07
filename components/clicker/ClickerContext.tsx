"use client";

import React, { createContext, useContext } from "react";
import { useClicker } from "@/hooks/useClicker";

const ClickerContext = createContext<ReturnType<typeof useClicker> | null>(null);

export function ClickerProvider({ children }: { children: React.ReactNode }) {
  const clicker = useClicker();
  return (
    <ClickerContext.Provider value={clicker}>
      {children}
    </ClickerContext.Provider>
  );
}

export function useClickerContext() {
  const context = useContext(ClickerContext);
  if (!context) {
    throw new Error("useClickerContext must be used within a ClickerProvider");
  }
  return context;
}
