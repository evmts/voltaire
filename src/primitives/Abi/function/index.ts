// @ts-nocheck
export * from "./Function.js";
export type { Function as BrandedFunction } from "./BrandedFunction/BrandedFunction.js";
export * from "./BrandedFunction/errors.js";
export * from "./BrandedFunction/statemutability.js";

// Re-export BrandedFunction namespace for advanced usage
import * as BrandedFunction from "./BrandedFunction/index.js";
export { BrandedFunction };
