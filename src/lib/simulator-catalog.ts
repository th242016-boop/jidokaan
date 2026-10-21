/** Released material IDs are explicit. New studio materials remain private until
 * their names are deliberately added here after the owner's visual approval. */
export const PUBLIC_SPECIAL_PATTERNS = [
  "FLOWER B", "FLOWER C", "BLACK SNAKE", "WHITE SNAKE",
  "RED LIZARD", "ORANGE LIZARD", "YELLOW LIZARD", "GREEN LIZARD", "BLUE LIZARD", "NAVY LIZARD", "PURPLE LIZARD",
  "NATURAL SNAKE", "HOT PINK SNAKE", "ORANGE SNAKE", "SKY BLUE SNAKE", "GREEN SNAKE", "YELLOW SNAKE",
  "SILVER WEAVE", "MICRO HOUNDSTOOTH", "BRONZE", "PINK GOLD",
  "MATTE RED", "MATTE ORANGE", "MATTE YELLOW", "MATTE GREEN", "MATTE BLUE", "MATTE NAVY", "MATTE PURPLE",
  "MATTE KHAKI", "MATTE PINK", "MATTE WHITE", "MATTE GRAY", "MATTE BLACK",
  "RED SUEDE", "ORANGE SUEDE", "YELLOW SUEDE", "GREEN SUEDE", "BLUE SUEDE", "NAVY SUEDE", "PURPLE SUEDE",
  "KHAKI SUEDE", "PINK SUEDE", "WHITE SUEDE", "GRAY SUEDE", "BLACK SUEDE",
] as const;

const published = new Set<string>(PUBLIC_SPECIAL_PATTERNS);
export const isPublicSpecialPattern = (name: string) => published.has(name);
export type SimulatorAudience = "public" | "admin";
