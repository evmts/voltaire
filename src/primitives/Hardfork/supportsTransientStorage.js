import { hasEIP1153 } from "./hasEIP1153.js";

/**
 * Check if hardfork has EIP-1153 (convenience form)
 *
 * @this {import('./BrandedHardfork.js').BrandedHardfork}
 * @returns {boolean} true if TLOAD/TSTORE are available
 *
 * @example
 * ```typescript
 * import { CANCUN, supportsTransientStorage } from './hardfork.js';
 *
 * supportsTransientStorage.call(CANCUN); // true
 * ```
 */
export function supportsTransientStorage() {
	return hasEIP1153(this);
}
