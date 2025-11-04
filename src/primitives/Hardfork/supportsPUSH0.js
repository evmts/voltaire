import { hasEIP3855 } from "./hasEIP3855.js";

/**
 * Check if hardfork has EIP-3855 (convenience form)
 *
 * @this {import('./BrandedHardfork.js').BrandedHardfork}
 * @returns {boolean} true if PUSH0 is available
 *
 * @example
 * ```typescript
 * import { SHANGHAI, supportsPUSH0 } from './hardfork.js';
 *
 * supportsPUSH0.call(SHANGHAI); // true
 * ```
 */
export function supportsPUSH0() {
	return hasEIP3855(this);
}
