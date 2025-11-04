import { hasEIP4844 } from "./hasEIP4844.js";

/**
 * Check if hardfork has EIP-4844 (convenience form)
 *
 * @this {import('./BrandedHardfork.js').BrandedHardfork}
 * @returns {boolean} true if blob transactions are available
 *
 * @example
 * ```typescript
 * import { CANCUN, supportsBlobs } from './hardfork.js';
 *
 * supportsBlobs.call(CANCUN); // true
 * ```
 */
export function supportsBlobs() {
	return hasEIP4844(this);
}
