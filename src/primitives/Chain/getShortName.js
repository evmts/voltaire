/**
 * Get the chain short name
 *
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {string} Short name (e.g., "eth")
 *
 * @example
 * ```typescript
 * import * as Chain from './primitives/Chain/index.js';
 * const shortName = Chain.getShortName(mainnet);
 * // => "eth"
 * ```
 */
export function getShortName(chain) {
	return chain.shortName;
}
