"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SessionRefresher() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") {
        router.refresh();
      }
    });
    // Proactively refresh the session on mount
    supabase.auth.getSession();
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return null;
}
