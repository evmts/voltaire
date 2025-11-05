// Export factory function and all methods
export * from "./Uint.factory.js";

// Export type definitions (excluding Uint type to avoid conflict with Uint constructor)
export type { BrandedUint, UintConstructor, Type } from "./Uint.ts";
