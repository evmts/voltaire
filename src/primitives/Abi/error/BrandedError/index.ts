// @ts-nocheck
export * from "./BrandedError.js";

import { decodeParams } from "./decodeParams.js";
import { encodeParams } from "./encodeParams.js";
import { getSelector } from "./getSelector.js";
import { getSignature } from "./getSignature.js";

// Export individual functions
export { decodeParams, encodeParams, getSelector, getSignature };

// Namespace export
export const BrandedError = {
	getSelector,
	getSignature,
	encodeParams,
	decodeParams,
};
