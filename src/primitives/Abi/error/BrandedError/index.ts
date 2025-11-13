// @ts-nocheck
export * from "./BrandedError.js";

// Import crypto dependencies
import { keccak256String as keccak256StringImpl } from "../../../Hash/BrandedHash/index.js";

import { decodeParams } from "./decodeParams.js";
import { encodeParams } from "./encodeParams.js";
import { GetSelector } from "./getSelector.js";
import { getSignature } from "./getSignature.js";

// Factory export (tree-shakeable)
export { GetSelector };

// Wrapper export (convenient, backward compat)
export const getSelector = GetSelector({
	keccak256String: keccak256StringImpl,
});

// Export individual functions
export { decodeParams, encodeParams, getSignature };

// Namespace export
export const BrandedError = {
	getSelector,
	getSignature,
	encodeParams,
	decodeParams,
	// Factory
	GetSelector,
};
