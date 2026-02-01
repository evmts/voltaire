// Export factory function and all methods

export * from "./Hex.js";
export { default, Hex } from "./Hex.js";
// Export type definitions (Hex type conflicts with Hex function, rename to HexType)
export type { Bytes, Hex as HexBrand, HexType, Sized } from "./HexType.js";
