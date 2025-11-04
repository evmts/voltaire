import { hasEIP1559 } from "./hasEIP1559.js";

/**
 * Check if hardfork has EIP-1559 (convenience form)
 *
 * @this {import('./BrandedHardfork.js').BrandedHardfork}
 * @returns {boolean} true if EIP-1559 is active
 *
 * @example
 * ```typescript
 * import { LONDON, supportsEIP1559 } from './hardfork.js';
 *
 * supportsEIP1559.call(LONDON); // true
 * ```
 */
export function supportsEIP1559() {
	return hasEIP1559(this);
}
