// Export factory function and all methods
// @ts-expect-error - Hex.js uses @ts-nocheck but has default export
import HexDefault from "./Hex.js";
export const Hex = HexDefault;
export * from "./Hex.js";

// Export type definitions (Hex type conflicts with Hex function, rename to HexType)
export type { HexType, Sized, Bytes } from "./HexType.js";
export type { Hex as HexBrand } from "./HexType.js";
