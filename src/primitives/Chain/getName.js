/**
 * Get the chain name
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {string} Chain name (e.g., "Ethereum Mainnet")
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const name = Chain.getName(mainnet);
 * // => "Ethereum Mainnet"
 * ```
 */
export function getName(chain) {
	return chain.name;
}
