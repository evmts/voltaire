// @ts-nocheck
import * as BrandedError from "./BrandedError/index.ts";

/**
 * Factory function for creating Error instances
 * Note: Error is a plain object, not a class instance
 * This namespace provides convenient methods for working with errors
 */

// Static utility methods
export const Error = {
	getSignature: BrandedError.getSignature,
	getSelector: BrandedError.getSelector,
	encodeParams: BrandedError.encodeParams,
	decodeParams: BrandedError.decodeParams,
};
