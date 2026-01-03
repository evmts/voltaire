import { KNOWN_CHAINS } from "./knownChains.js";

/**
 * Check if chain ID is a known/supported chain
 *
 * @this {import('./ChainIdType.js').ChainIdType}
 * @returns {boolean} True if chain ID is known
 *
 * @example
 * ```typescript
 * import * as ChainId from './index.js';
 *
 * ChainId.isKnown(1);        // true (Mainnet)
 * ChainId.isKnown(137);      // true (Polygon)
 * ChainId.isKnown(999999);   // false (unknown)
 * ```
 */
export function isKnown() {
	return KNOWN_CHAINS.has(/** @type {number} */ (this));
}
