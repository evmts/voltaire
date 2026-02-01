/**
 * Hex (Hexadecimal) Type Definitions
 */

import type { HexType } from "./HexType.js";

// Re-export types
export type { HexType, Bytes, Sized } from "./HexType.js";

// Export function types for fromBytes and toBytes
export declare function fromBytes(bytes: Uint8Array): HexType;
export declare function toBytes(hex: HexType | string): Uint8Array;
