// @ts-nocheck
export * from "./BrandedConstructor.js";

import { decodeParams } from "./decodeParams.js";
import { encodeParams } from "./encodeParams.js";

// Export individual functions
export { encodeParams, decodeParams };

/**
 * Namespace object for BrandedConstructor operations
 */
export const BrandedConstructor = {
	encodeParams,
	decodeParams,
};
