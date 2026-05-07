export const RARITIES = {
  comun: {
    label: "Común",
    color: "#3a3a3a",
    gradient: null,
    italic: false,
    glint: false,
    order: 0,
  },
  poco_comun: {
    label: "Poco Común",
    color: "#2d5a2d",
    gradient: null,
    italic: false,
    glint: false,
    order: 1,
  },
  medio_raro: {
    label: "Medio Raro",
    color: "#1a4060",
    gradient: null,
    italic: false,
    glint: false,
    order: 2,
  },
  raro: {
    label: "Raro",
    color: "#4a2090",
    gradient: null,
    italic: false,
    glint: false,
    order: 3,
  },
  ultra_raro: {
    label: "Ultra Raro",
    color: "#902060",
    gradient: null,
    italic: false,
    glint: false,
    order: 4,
  },
  legendario: {
    label: "Legendario",
    color: null,
    gradient: ["#ff6600", "#ffaa00"] as [string, string],
    italic: true,
    glint: true,
    order: 5,
  },
  extraterrestre: {
    label: "Extraterrestre",
    color: null,
    gradient: ["#00aaff", "#00ffcc"] as [string, string],
    italic: true,
    glint: true,
    order: 6,
  },
  en_el_ort: {
    label: "En el Ort**",
    color: null,
    gradient: ["#ff1493", "#ff6600", "#ff1493"] as [string, string, string],
    italic: true,
    glint: true,
    order: 7,
  },
} as const;

export type RarityKey = keyof typeof RARITIES;

export const RARITY_ORDER: RarityKey[] = [
  "en_el_ort",
  "extraterrestre",
  "legendario",
  "ultra_raro",
  "raro",
  "medio_raro",
  "poco_comun",
  "comun",
];

export function getConditionLabel(floatValue: number): string {
  if (floatValue < 0.07) return "Impecable";
  if (floatValue < 0.15) return "Mínimo Desgaste";
  if (floatValue < 0.38) return "Probado en Campo";
  if (floatValue < 0.45) return "Bien Desgastado";
  return "Desgaste Notable";
}

export function formatARS(amount: number): string {
  return "$" + amount.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}
