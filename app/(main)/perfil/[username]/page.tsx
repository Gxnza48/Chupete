export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileHeader, { getBannerStyle } from "@/components/profile/ProfileHeader";
import BadgeRow from "@/components/profile/BadgeRow";
import PublicInventoryGrid from "@/components/profile/PublicInventoryGrid";
import ProfileParticlesWrapper from "@/components/profile/ProfileParticlesWrapper";
import type { Profile, InventoryItem, UserBadge } from "@/types/database";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = await params;
  return {
    title: `${username} — ChupeteClicker`,
    description: `Perfil de ${username} en ChupeteClicker.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const [{ data: profile, error }, { data: { user } }] = await Promise.all([
    supabase.from("profiles").select("*").eq("username", username).single(),
    supabase.auth.getUser(),
  ]);

  if (error || !profile) {
    notFound();
  }

  const typedProfile = profile as Profile;
  const isOwner = user?.id === typedProfile.id;

  // Fetch inventory (only non-listed items)
  const { data: inventoryData } = await supabase
    .from("inventory")
    .select("*, item:items(*)")
    .eq("user_id", typedProfile.id)
    .eq("show_in_profile", true)
    .order("obtained_at", { ascending: false });

  const inventoryItems = (inventoryData ?? []) as InventoryItem[];

  // Fetch badges
  const { data: badgesData } = await supabase
    .from("user_badges")
    .select("*, badge:badges(*)")
    .eq("user_id", typedProfile.id)
    .order("earned_at", { ascending: false });

  const badges = (badgesData ?? []) as UserBadge[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" style={{ background: "#000000" }}>
      {/* Profile header with particles */}
      <div
        className="relative rounded-2xl px-6 mb-8 overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.05)", ...getBannerStyle(typedProfile) }}
      >
        <ProfileParticlesWrapper userId={typedProfile.id} />
        <div className="relative z-10">
          <ProfileHeader profile={typedProfile} itemCount={inventoryItems.length} isOwner={isOwner} />
        </div>
      </div>

      {/* Badges section */}
      {badges.length > 0 && (
        <div className="mb-8">
          <h2
            className="text-sm font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#404040" }}
          >
            Badges
          </h2>
          <div
            className="rounded-2xl p-5"
            style={{
              background: "#060606",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <BadgeRow badges={badges} />
          </div>
        </div>
      )}

      {/* Public inventory */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: "#404040" }}
          >
            Inventario público
          </h2>
          <span
            className="text-xs"
            style={{
              color: "#2a2a2a",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            {inventoryItems.length} items
          </span>
        </div>
        <PublicInventoryGrid items={inventoryItems} />
      </div>
    </div>
  );
}
