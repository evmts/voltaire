export type { BrandedError } from "./BrandedError/BrandedError.js";
export type { AbiErrorConstructor } from "./AbiErrorConstructor.js";
import { AbiError as AbiErrorImpl } from "./AbiError.js";
import type { AbiErrorConstructor } from "./AbiErrorConstructor.js";

// Re-export BrandedError namespace for advanced usage
export * as BrandedErrorUtils from "./BrandedError/index.js";

// Export Error namespace for Abi.Error usage
export { Error } from "./Error.js";

// Export the AbiError class as default export
export const AbiError = AbiErrorImpl as unknown as AbiErrorConstructor;

// Export namespace methods
export { getSignature } from "./BrandedError/getSignature.js";
export { getSelector } from "./BrandedError/getSelector.js";
export { encodeParams } from "./BrandedError/encodeParams.js";
export { decodeParams } from "./BrandedError/decodeParams.js";
