export * from "./errors.js";
export * from "./BrandedFunction.js";
export * from "./statemutability.js";

// Import crypto dependencies
import { keccak256String as keccak256StringImpl } from "../../../Hash/BrandedHash/keccak256String.js";

import { decodeParams } from "./decodeParams.js";
import { decodeResult } from "./decodeResult.js";
import { encodeParams } from "./encodeParams.js";
import { encodeResult } from "./encodeResult.js";
import { GetSelector } from "./getSelector.js";
import { getSignature } from "./getSignature.js";

// Factory export (tree-shakeable)
export { GetSelector };

// Wrapper export (convenient, backward compat)
export const getSelector = GetSelector({
	keccak256String: keccak256StringImpl,
});

// Export individual functions
export { getSignature, encodeParams, decodeParams, encodeResult, decodeResult };

// Namespace export
export const BrandedFunction = {
	getSelector,
	getSignature,
	encodeParams,
	decodeParams,
	encodeResult,
	decodeResult,
	// Factory
	GetSelector,
};
