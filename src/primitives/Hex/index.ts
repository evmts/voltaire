// Export factory function and all methods
// Hex.js uses @ts-nocheck so we import default
import HexDefault from "./Hex.js";
export const Hex = HexDefault;
export * from "./Hex.js";

// Export type definitions (Hex type conflicts with Hex function, rename to HexType)
export type { HexType, Sized, Bytes } from "./HexType.js";
export type { Hex as HexBrand } from "./HexType.js";
