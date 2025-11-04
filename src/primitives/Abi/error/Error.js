// @ts-nocheck
export * from "./BrandedError.js";

import { decodeParams } from "./decodeParams.js";
import { encodeParams } from "./encodeParams.js";
import { getSelector } from "./getSelector.js";
import { getSignature } from "./getSignature.js";

// Export individual functions
export { decodeParams, encodeParams, getSelector, getSignature };

/**
 * @typedef {import('./BrandedError.js').BrandedError} BrandedError
 */

/**
 * Namespace object for Error operations
 */
export const Error = {
	getSelector,
	getSignature,
	encodeParams,
	decodeParams,
};
