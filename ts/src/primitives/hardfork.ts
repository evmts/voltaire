/**
 * Ethereum hardfork enumeration and utilities
 */

export enum Hardfork {
  FRONTIER = "FRONTIER",
  HOMESTEAD = "HOMESTEAD",
  DAO = "DAO",
  TANGERINE_WHISTLE = "TANGERINE_WHISTLE",
  SPURIOUS_DRAGON = "SPURIOUS_DRAGON",
  BYZANTIUM = "BYZANTIUM",
  CONSTANTINOPLE = "CONSTANTINOPLE",
  PETERSBURG = "PETERSBURG",
  ISTANBUL = "ISTANBUL",
  MUIR_GLACIER = "MUIR_GLACIER",
  BERLIN = "BERLIN",
  LONDON = "LONDON",
  ARROW_GLACIER = "ARROW_GLACIER",
  GRAY_GLACIER = "GRAY_GLACIER",
  MERGE = "MERGE",
  SHANGHAI = "SHANGHAI",
  CANCUN = "CANCUN",
  PRAGUE = "PRAGUE",
  OSAKA = "OSAKA",
}

const HARDFORK_ORDER: Hardfork[] = [
  Hardfork.FRONTIER,
  Hardfork.HOMESTEAD,
  Hardfork.DAO,
  Hardfork.TANGERINE_WHISTLE,
  Hardfork.SPURIOUS_DRAGON,
  Hardfork.BYZANTIUM,
  Hardfork.CONSTANTINOPLE,
  Hardfork.PETERSBURG,
  Hardfork.ISTANBUL,
  Hardfork.MUIR_GLACIER,
  Hardfork.BERLIN,
  Hardfork.LONDON,
  Hardfork.ARROW_GLACIER,
  Hardfork.GRAY_GLACIER,
  Hardfork.MERGE,
  Hardfork.SHANGHAI,
  Hardfork.CANCUN,
  Hardfork.PRAGUE,
  Hardfork.OSAKA,
];

/**
 * Check if hardfork is at or after a given version
 */
export function isAtLeast(current: Hardfork, target: Hardfork): boolean {
  const currentIndex = HARDFORK_ORDER.indexOf(current);
  const targetIndex = HARDFORK_ORDER.indexOf(target);
  return currentIndex >= targetIndex;
}

/**
 * Check if hardfork is before a given version
 */
export function isBefore(current: Hardfork, target: Hardfork): boolean {
  const currentIndex = HARDFORK_ORDER.indexOf(current);
  const targetIndex = HARDFORK_ORDER.indexOf(target);
  return currentIndex < targetIndex;
}

/**
 * Check if two hardforks are equal
 */
export function equals(a: Hardfork, b: Hardfork): boolean {
  return a === b;
}

/**
 * Parse hardfork from string (case-insensitive)
 */
export function fromString(name: string): Hardfork {
  const upper = name.toUpperCase().replace(/[-\s]/g, "_");
  const hardfork = Object.values(Hardfork).find(
    (hf) => hf === upper
  );

  if (!hardfork) {
    throw new Error(`Unknown hardfork: ${name}`);
  }

  return hardfork;
}

/**
 * Get all hardforks in chronological order
 */
export function getAllHardforks(): Hardfork[] {
  return [...HARDFORK_ORDER];
}
