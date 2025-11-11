/**
 * Hex (Hexadecimal) Type Definitions
 */

import type { BrandedHex } from "./BrandedHex.js";

// Re-export types
export type { BrandedHex, Bytes, Sized } from "./BrandedHex.js";

// Export function types for fromBytes and toBytes
export declare function fromBytes(bytes: Uint8Array): BrandedHex;
export declare function toBytes(hex: BrandedHex | string): Uint8Array;
