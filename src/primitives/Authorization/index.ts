// Re-export BrandedAuthorization type and utilities
export type { BrandedAuthorization } from "./BrandedAuthorization/BrandedAuthorization.js";
export * from "./BrandedAuthorization/errors.js";
export * from "./BrandedAuthorization/constants.js";
export * from "./BrandedAuthorization/types.js";

// Re-export all functions from BrandedAuthorization
export {
	calculateGasCost,
	equals,
	equalsAuth,
	format,
	getGasCost,
	hash,
	isItem,
	isUnsigned,
	process,
	processAll,
	sign,
	validate,
	verify,
} from "./BrandedAuthorization/index.js";

// Re-export WASM functions
export * from "./BrandedAuthorization/Authorization.wasm.js";

// Namespace export for convenience
export * as Authorization from "./BrandedAuthorization/index.js";
