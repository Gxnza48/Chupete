"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Palette, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

const BANNER_COLORS = [
  "#1a1a1a", "#1a2a1a", "#1a1a2a", "#2a1a1a",
  "#2d1a40", "#402a1a", "#1a2d40", "#2a1a2a",
];

const USERNAME_COLORS = [
  { color: "#efefef", label: "Blanco" },
  { color: "#4a9a4a", label: "Verde" },
  { color: "#8050d0", label: "Violeta" },
  { color: "#902060", label: "Magenta" },
  { color: "#1a8a8a", label: "Cian" },
];

interface ProfileCustomizerProps {
  profile: Profile;
}

export default function ProfileCustomizer({ profile }: ProfileCustomizerProps) {
  const [uploading, setUploading] = useState(false);
  const [savingColor, setSavingColor] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const level = profile.level ?? 1;
  const canBanner = level >= 5;
  const canUsernameColor = level >= 10;
  const canAvatar = level >= 25;

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id);
      router.refresh();
    }
    setUploading(false);
  }

  async function setBannerColor(color: string) {
    setSavingColor(true);
    await supabase.from("profiles").update({ banner_color: color }).eq("id", profile.id);
    setSavingColor(false);
    router.refresh();
  }

  async function setUsernameColor(color: string) {
    setSavingColor(true);
    await supabase.from("profiles").update({ username_color: color }).eq("id", profile.id);
    setSavingColor(false);
    router.refresh();
  }

  return (
    <div className="mt-4 border-t pt-6" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <p className="text-[10px] uppercase tracking-widest mb-4 text-center" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
        Personalización
      </p>

      <div className="flex flex-col gap-4">
        {/* Avatar */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Camera size={12} style={{ color: canAvatar ? "#404040" : "#2a2a2a" }} />
            <span className="text-xs" style={{ color: canAvatar ? "#404040" : "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
              Avatar
            </span>
            {!canAvatar && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: "#2a2a2a" }}>
                <Lock size={10} /> Nivel 25
              </span>
            )}
          </div>
          {canAvatar ? (
            <>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.05)", color: "#404040", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "var(--font-syne), Syne, sans-serif" }}
              >
                {uploading ? "Subiendo..." : "Cambiar foto"}
              </button>
            </>
          ) : (
            <div className="h-8 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.05)" }} />
          )}
        </div>

        {/* Banner color */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Palette size={12} style={{ color: canBanner ? "#404040" : "#2a2a2a" }} />
            <span className="text-xs" style={{ color: canBanner ? "#404040" : "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
              Color de perfil
            </span>
            {!canBanner && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: "#2a2a2a" }}>
                <Lock size={10} /> Nivel 5
              </span>
            )}
          </div>
          {canBanner ? (
            <div className="flex gap-2 flex-wrap">
              {BANNER_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setBannerColor(color)}
                  disabled={savingColor}
                  className="w-6 h-6 rounded-lg transition-all"
                  style={{
                    background: color,
                    border: profile.banner_color === color ? "2px solid #efefef" : "2px solid transparent",
                    outline: profile.banner_color === color ? "1px solid rgba(255,255,255,0.3)" : "none",
                  }}
                />
              ))}
              <button
                onClick={() => setBannerColor("")}
                disabled={savingColor}
                className="w-6 h-6 rounded-lg text-[9px] flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.05)", color: "#404040", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="h-8 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.05)" }} />
          )}
        </div>

        {/* Username color */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Palette size={12} style={{ color: canUsernameColor ? "#404040" : "#2a2a2a" }} />
            <span className="text-xs" style={{ color: canUsernameColor ? "#404040" : "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
              Color de nombre
            </span>
            {!canUsernameColor && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: "#2a2a2a" }}>
                <Lock size={10} /> Nivel 10
              </span>
            )}
          </div>
          {canUsernameColor ? (
            <div className="flex gap-2 flex-wrap">
              {USERNAME_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  onClick={() => setUsernameColor(color)}
                  disabled={savingColor}
                  className="px-2 py-0.5 rounded text-[10px] font-bold transition-all"
                  style={{
                    color,
                    background: profile.username_color === color ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${profile.username_color === color ? color + "60" : "rgba(255,255,255,0.07)"}`,
                    fontFamily: "var(--font-syne), Syne, sans-serif",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="h-8 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.05)" }} />
          )}
        </div>
      </div>
    </div>
  );
}
