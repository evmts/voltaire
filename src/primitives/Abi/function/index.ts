// @ts-nocheck
import { Function } from "./Function.js";

// Re-export BrandedFunction namespace and types
export type { Function as BrandedFunction } from "./BrandedFunction/BrandedFunction.js";
export * from "./BrandedFunction/errors.js";
export * from "./BrandedFunction/statemutability.js";
import * as BrandedFunction from "./BrandedFunction/index.js";
export { BrandedFunction };

// Export Function methods directly for namespace usage (Abi.Function.*)
export const getSelector = Function.getSelector;
export const getSignature = Function.getSignature;
export const encodeParams = Function.encodeParams;
export const decodeParams = Function.decodeParams;
export const encodeResult = Function.encodeResult;
export const decodeResult = Function.decodeResult;

// Also export the Function factory itself
export { Function };
