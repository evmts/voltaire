/**
 * Get the chain name
 *
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {string} Chain name (e.g., "Ethereum Mainnet")
 *
 * @example
 * ```typescript
 * import * as Chain from './primitives/Chain/index.js';
 * const name = Chain.getName(mainnet);
 * // => "Ethereum Mainnet"
 * ```
 */
export function getName(chain) {
	return chain.name;
}
