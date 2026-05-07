export type RarityType =
  | "comun"
  | "poco_comun"
  | "medio_raro"
  | "raro"
  | "ultra_raro"
  | "legendario"
  | "extraterrestre"
  | "en_el_ort";

export interface Item {
  id: string;
  name: string;
  rarity: RarityType;
  description: string | null;
  image_url: string;
  base_price_ars: number;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  banner_color: string | null;
  username_color: string | null;
  level: number;
  xp: number;
  total_clicks: number;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  float_value: number;
  obtained_at: string;
  is_listed: boolean;
  show_in_profile: boolean;
  nickname?: string | null;
  nickname_bold?: boolean;
  nickname_italic?: boolean;
  nickname_color?: string | null;
  item?: Item;
}

export interface ShopItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: "charm" | "frame";
  icon: string;
  price_credits: number;
}

export interface ProfileCosmetic {
  user_id: string;
  shop_item_id: string;
  equipped: boolean;
  purchased_at: string;
  shop_item?: ShopItem;
}

export interface Listing {
  id: string;
  seller_id: string;
  inventory_id: string;
  price_ars: number;
  price_credits: number;
  status: "active" | "sold" | "cancelled";
  mp_preference_id: string | null;
  created_at: string;
  sold_at: string | null;
  inventory?: InventoryItem & { item?: Item };
  seller?: Profile;
}

export interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  price_ars: number;
  platform_fee: number;
  mp_payment_id: string;
  completed_at: string;
}

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon_svg: string | null;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface DropResult {
  item: Item;
  float_value: number;
  rarity: RarityType;
  isNewRecord: boolean;
  inventory_id: string;
}
