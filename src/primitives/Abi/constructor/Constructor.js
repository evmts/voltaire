// @ts-nocheck
export * from "./BrandedConstructor.js";

import { decodeParams } from "./decodeParams.js";
import { encodeParams } from "./encodeParams.js";

// Export individual functions
export { encodeParams, decodeParams };

/**
 * @typedef {import('./BrandedConstructor.js').BrandedConstructor} BrandedConstructor
 */

/**
 * Namespace object for Constructor operations
 * Not a factory function - Constructor is a plain object with methods
 */
export const Constructor = {
	encodeParams,
	decodeParams,
};
