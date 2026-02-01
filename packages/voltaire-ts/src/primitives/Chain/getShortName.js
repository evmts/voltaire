/**
 * Get the chain short name
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {string} Short name (e.g., "eth")
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const shortName = Chain.getShortName(mainnet);
 * // => "eth"
 * ```
 */
export function getShortName(chain) {
	return chain.shortName;
}
