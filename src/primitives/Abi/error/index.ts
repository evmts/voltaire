// @ts-nocheck
export type { BrandedError } from "./BrandedError/BrandedError.js";
export type { AbiErrorConstructor } from "./AbiErrorConstructor.js";
import { AbiError as AbiErrorImpl } from "./AbiError.js";
import type { AbiErrorConstructor } from "./AbiErrorConstructor.js";

// Re-export BrandedError namespace for advanced usage
export * as BrandedError from "./BrandedError/index.ts";

// Export the AbiError class as default export
export const AbiError = AbiErrorImpl as unknown as AbiErrorConstructor;
