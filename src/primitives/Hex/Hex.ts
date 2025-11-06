/**
 * Hex (Hexadecimal) Type Definitions
 */

// Re-export types
export type { BrandedHex, Bytes, Sized } from "./BrandedHex.js";

// For backwards compatibility, export BrandedHex as Unsized
export type { BrandedHex as Unsized } from "./BrandedHex.js";

// Export BrandedHex as Hex for compatibility
export type { BrandedHex as Hex } from "./BrandedHex.js";
