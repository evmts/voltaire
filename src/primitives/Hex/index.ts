// Export factory function and all methods
export { Hex, default as default } from "./Hex.js";
export * from "./Hex.js";

// Export type definitions (Hex type conflicts with Hex function, rename to HexType)
export type { HexType, Sized, Bytes } from "./HexType.js";
export type { Hex as HexBrand } from "./HexType.js";
