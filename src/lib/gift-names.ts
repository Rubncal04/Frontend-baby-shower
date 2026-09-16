export const GIFT_NAME_IDS = [
  "cuna-cama",
  "mecedora-silla-vibradora",
  "monitor-seguridad",
  "panalera-cambiador",
  "colchon-antirreflujo",
  "esterilizador-tetero",
  "olla-hervidora",
  "kit-aseo-semanario",
  "cobija",
  "termo",
  "lampara-baja-intensidad",
  "abanico-recargable",
  "ropita-3-6-meses",
  "juguetes-estimulacion",
  "almohada-lactancia",
  "kit-bano-bebe",
  "cambiador-portatil",
] as const;

export type GiftNameId = (typeof GIFT_NAME_IDS)[number];

/** Type-guard for gift ids that have localized names in the message catalogs. */
export function isGiftNameId(id: string): id is GiftNameId {
  return (GIFT_NAME_IDS as readonly string[]).includes(id);
}
