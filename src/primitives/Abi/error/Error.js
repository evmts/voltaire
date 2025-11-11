// @ts-nocheck
import * as BrandedError from "./BrandedError/index.ts";

/**
 * Factory function for creating Error instances
 * Note: Error is a plain object, not a class instance
 * This namespace provides convenient methods for working with errors
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const error = {
 *   type: 'error',
 *   name: 'Unauthorized',
 *   inputs: [{ type: 'address', name: 'caller' }]
 * };
 * const selector = Abi.Error.getSelector(error);
 * ```
 */

// Static utility methods
export const Error = {
	getSignature: BrandedError.getSignature,
	getSelector: BrandedError.getSelector,
	encodeParams: BrandedError.encodeParams,
	decodeParams: BrandedError.decodeParams,
};
