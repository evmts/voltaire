import { CHAIN_NAMES } from "./knownChains.js";

/**
 * Get human-readable name for a chain ID
 *
 * @this {import('./ChainIdType.js').ChainIdType}
 * @returns {string | undefined} Chain name or undefined if unknown
 *
 * @example
 * ```typescript
 * import * as ChainId from './index.js';
 *
 * ChainId.getName(1);        // "Mainnet"
 * ChainId.getName(137);      // "Polygon"
 * ChainId.getName(999999);   // undefined
 * ```
 */
export function getName() {
	return CHAIN_NAMES.get(/** @type {number} */ (this));
}
