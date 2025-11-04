/**
 * Hash Type Definitions
 *
 * Note: We don't export a 'Hash' type alias here to avoid collision with the
 * Hash factory function exported from Hash.js. Use BrandedHash for the type.
 */

// Re-export types and constants
export type { BrandedHash } from "./BrandedHash.js";
export { hashSymbol, SIZE, ZERO } from "./BrandedHash.js";

// Re-export factory function
export type { HashConstructor } from "./HashConstructor.js";
