// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 0.1% drop chance per click — average ~1000 clicks per drop
const DROP_CHANCE_PER_CLICK = 0.001;
const MAX_CLICKS_PER_BATCH = 100;

const WEIGHTS: Record<string, number> = {
  comun:          0.35000,
  poco_comun:     0.28000,
  medio_raro:     0.18000,
  raro:           0.10000,
  ultra_raro:     0.05500,
  legendario:     0.02000,
  extraterrestre: 0.00490,
  en_el_ort:      0.00010,
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function rollRarity(): string {
  const rand = Math.random();
  let cumulative = 0;
  for (const [rarity, weight] of Object.entries(WEIGHTS)) {
    cumulative += weight;
    if (rand < cumulative) return rarity;
  }
  return "comun";
}

function generateFloat(): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / 4294967296;
}

// Max durability per condition (float_value)
function getMaxDurability(floatValue: number): number {
  if (floatValue < 0.07)  return 5000;
  if (floatValue < 0.15)  return 3000;
  if (floatValue < 0.38)  return 1500;
  if (floatValue < 0.45)  return 800;
  return 300;
}

const XP_PER_CLICK = 2;
const XP_RARITY_BONUS: Record<string, number> = {
  comun:          0,
  poco_comun:     5,
  medio_raro:     15,
  raro:           35,
  ultra_raro:     80,
  legendario:     200,
  extraterrestre: 500,
  en_el_ort:      2000,
};

// Credits earned on drop by rarity
const CREDITS_RARITY_BONUS: Record<string, number> = {
  comun:          0,
  poco_comun:     5,
  medio_raro:     15,
  raro:           50,
  ultra_raro:     150,
  legendario:     500,
  extraterrestre: 2000,
  en_el_ort:      10000,
};

// Credits awarded on level up: level * 75
function creditsForLevel(level: number): number {
  return level * 75;
}

// Click milestone credits (harder economy — these are rare bonuses)
const CLICK_MILESTONE_CREDITS: Record<number, number> = {
  100:    25,
  1000:   100,
  10000:  500,
  50000:  2000,
  100000: 5000,
};

function xpForNextLevel(level: number): number {
  if (level <= 100) return 150 + (level - 1) * 50;
  return Math.floor(5100 * Math.pow(1.08, level - 100));
}

function calculateLevelFromXp(totalXp: number): number {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level++;
    if (level > 9999) break;
  }
  return level;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Parse click count from body, capped at MAX
  let clickCount = 1;
  try {
    const body = await req.json();
    clickCount = Math.min(Math.max(1, parseInt(body.click_count ?? 1, 10)), MAX_CLICKS_PER_BATCH);
  } catch { /* default to 1 */ }

  // Fetch current profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("total_clicks, xp, level, credits, equipped_chupete_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: "Profile not found" }), {
      status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // Click multiplier by equipped item rarity
  const CLICK_MULTIPLIER: Record<string, number> = {
    en_el_ort:      20,
    extraterrestre: 12,
    legendario:     5,
  };

  // Fetch equipped item durability + rarity (for wear system and multiplier)
  let equippedDurability: number | null = null;
  let equippedRarity: string | null = null;
  const equippedId = profile.equipped_chupete_id;

  if (equippedId) {
    const { data: equippedInv } = await supabase
      .from("inventory")
      .select("id, durability, max_durability, item:items(rarity)")
      .eq("id", equippedId)
      .maybeSingle();

    if (equippedInv) {
      equippedDurability = equippedInv.durability ?? null;
      equippedRarity = (equippedInv.item as any)?.rarity ?? null;
    }
  }

  const clickMultiplier = CLICK_MULTIPLIER[equippedRarity ?? ""] ?? 1;
  const effectiveClicks = clickCount * clickMultiplier;

  // Roll for drop: P(at least one drop in N clicks) = 1 - (1 - p)^N
  const dropProbability = 1 - Math.pow(1 - DROP_CHANCE_PER_CLICK, clickCount);
  const isDropped = Math.random() < dropProbability;

  let rarityBonus = 0;
  let rarity: string | null = null;
  let item: Record<string, unknown> | null = null;
  let floatValue: number | null = null;
  let isNewRecord = false;
  let inventoryId: string | null = null;

  if (isDropped) {
    rarity = rollRarity();

    const { data: items, error: itemsError } = await supabase
      .from("items").select("*").eq("rarity", rarity);

    let pool = (!itemsError && items?.length) ? items : [];
    if (pool.length === 0) {
      const { data: fallback } = await supabase.from("items").select("*").eq("rarity", "comun");
      pool = fallback ?? [];
    }
    if (pool.length === 0) {
      return new Response(JSON.stringify({ error: "No items available" }), {
        status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    item = pool[Math.floor(Math.random() * pool.length)];
    floatValue = generateFloat();
    rarityBonus = XP_RARITY_BONUS[rarity] ?? 0;

    const { data: existingBest } = await supabase
      .from("inventory").select("float_value")
      .eq("user_id", user.id).eq("item_id", item.id)
      .order("float_value", { ascending: true }).limit(1).maybeSingle();
    isNewRecord = !existingBest || floatValue < existingBest.float_value;

    await supabase.from("drops").insert({
      user_id: user.id, item_id: item.id,
      float_value: floatValue, rarity, dropped_at: new Date().toISOString(),
    });

    const maxDur = getMaxDurability(floatValue);
    const { data: invInsert, error: invError } = await supabase
      .from("inventory")
      .insert({ user_id: user.id, item_id: item.id, float_value: floatValue, is_listed: false, durability: maxDur, max_durability: maxDur })
      .select("id").single();

    if (invError || !invInsert) {
      return new Response(JSON.stringify({ error: "Failed to save item" }), {
        status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    inventoryId = invInsert.id;
  }

  // Update profile: physical clicks for counter, effective clicks for XP
  const newXp = (profile.xp ?? 0) + XP_PER_CLICK * effectiveClicks + rarityBonus;
  const newClicks = (profile.total_clicks ?? 0) + clickCount;
  const newLevel = calculateLevelFromXp(newXp);
  const oldLevel = profile.level ?? 1;

  // Durability: reduce equipped item durability, unequip at 0
  let chupeteBroke = false;
  let brokeItemName: string | null = null;

  if (equippedId && equippedDurability !== null) {
    const newDurability = Math.max(0, equippedDurability - effectiveClicks);
    if (newDurability <= 0) {
      const { data: brokeInv } = await supabase
        .from("inventory")
        .select("item:items(name)")
        .eq("id", equippedId)
        .maybeSingle();
      brokeItemName = (brokeInv?.item as any)?.name ?? null;
      chupeteBroke = true;
      await supabase.from("profiles").update({ equipped_chupete_id: null }).eq("id", user.id);
      await supabase.from("inventory").delete().eq("id", equippedId);
    } else {
      await supabase.from("inventory").update({ durability: newDurability }).eq("id", equippedId);
    }
  }

  // Calculate credits earned this batch
  // Credits come from: drops, level ups, and click milestones — NOT from raw clicks
  let creditsEarned = 0;

  // Credits for drop rarity bonus
  if (isDropped && rarity) {
    creditsEarned += CREDITS_RARITY_BONUS[rarity] ?? 0;
  }

  // Credits for level ups (can gain multiple levels in one batch)
  for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
    creditsEarned += creditsForLevel(lvl);
  }

  // Credits for click milestones
  for (const [milestone, reward] of Object.entries(CLICK_MILESTONE_CREDITS)) {
    const ms = parseInt(milestone, 10);
    if (newClicks >= ms && profile.total_clicks < ms) {
      creditsEarned += reward;
    }
  }

  const newCredits = (profile.credits ?? 0) + creditsEarned;

  await supabase.from("profiles")
    .update({ total_clicks: newClicks, xp: newXp, level: newLevel, credits: newCredits })
    .eq("id", user.id);

  // Count total drops if a drop happened (for drop milestone badges)
  let totalDropCount = 0;
  if (isDropped) {
    const { count } = await supabase.from("drops").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    totalDropCount = count ?? 0;
  }

  // Count legendary+ items for collector badges
  let legendaryCount = 0, extraterrestreCount = 0, ortCount = 0;
  if (isDropped && (rarity === "legendario" || rarity === "extraterrestre" || rarity === "en_el_ort")) {
    const { data: rareCounts } = await supabase.from("inventory")
      .select("item:items(rarity)")
      .eq("user_id", user.id);
    if (rareCounts) {
      for (const row of rareCounts) {
        const r = (row.item as any)?.rarity;
        if (r === "legendario") legendaryCount++;
        else if (r === "extraterrestre") extraterrestreCount++;
        else if (r === "en_el_ort") ortCount++;
      }
    }
  }

  // Badge checks (extended)
  const badgesToCheck: { key: string; condition: boolean }[] = [
    // Click milestones
    { key: "primer_click",          condition: newClicks >= 1       && profile.total_clicks < 1 },
    { key: "click_100",             condition: newClicks >= 100     && profile.total_clicks < 100 },
    { key: "click_1000",            condition: newClicks >= 1000    && profile.total_clicks < 1000 },
    { key: "click_10000",           condition: newClicks >= 10000   && profile.total_clicks < 10000 },
    { key: "click_50000",           condition: newClicks >= 50000   && profile.total_clicks < 50000 },
    { key: "click_100000",          condition: newClicks >= 100000  && profile.total_clicks < 100000 },
    { key: "click_500000",          condition: newClicks >= 500000  && profile.total_clicks < 500000 },
    { key: "click_1000000",         condition: newClicks >= 1000000 && profile.total_clicks < 1000000 },
    // Level milestones
    { key: "nivel_5",               condition: newLevel >= 5   && (profile.level ?? 1) < 5 },
    { key: "nivel_10",              condition: newLevel >= 10  && (profile.level ?? 1) < 10 },
    { key: "nivel_25",              condition: newLevel >= 25  && (profile.level ?? 1) < 25 },
    { key: "nivel_50",              condition: newLevel >= 50  && (profile.level ?? 1) < 50 },
    { key: "nivel_100",             condition: newLevel >= 100 && (profile.level ?? 1) < 100 },
    { key: "nivel_200",             condition: newLevel >= 200 && (profile.level ?? 1) < 200 },
    // First drops by rarity
    { key: "primer_raro",           condition: isDropped && rarity === "raro" },
    { key: "primer_legendario",     condition: isDropped && rarity === "legendario" },
    { key: "primer_extraterrestre", condition: isDropped && rarity === "extraterrestre" },
    { key: "primer_ort",            condition: isDropped && rarity === "en_el_ort" },
    // Drop count milestones
    { key: "drops_10",              condition: isDropped && totalDropCount >= 10 },
    { key: "drops_100",             condition: isDropped && totalDropCount >= 100 },
    { key: "drops_500",             condition: isDropped && totalDropCount >= 500 },
    // Collector badges
    { key: "colector_legendario",   condition: isDropped && legendaryCount >= 5 },
    { key: "colector_extraterrestre", condition: isDropped && extraterrestreCount >= 3 },
    { key: "colector_ort",          condition: isDropped && ortCount >= 2 },
  ];

  const newBadges: { name: string; icon: string }[] = [];

  for (const b of badgesToCheck) {
    if (!b.condition) continue;
    const { data: badge } = await supabase.from("badges").select("id, name, icon_svg").eq("key", b.key).single();
    if (!badge) continue;
    const { data: existing } = await supabase.from("user_badges")
      .select("user_id").eq("user_id", user.id).eq("badge_id", badge.id).maybeSingle();
    if (!existing) {
      await supabase.from("user_badges").insert({ user_id: user.id, badge_id: badge.id });
      newBadges.push({ name: badge.name, icon: badge.icon_svg ?? "🏆" });
    }
  }

  const baseResponse = {
    credits_earned: creditsEarned,
    chupete_broke: chupeteBroke,
    broke_item_name: brokeItemName,
    new_badges: newBadges,
    click_multiplier: clickMultiplier,
  };

  if (!isDropped) {
    return new Response(JSON.stringify({ dropped: false, ...baseResponse }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ dropped: true, item, float_value: floatValue, rarity, isNewRecord, inventory_id: inventoryId, ...baseResponse }),
    { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  );
});
