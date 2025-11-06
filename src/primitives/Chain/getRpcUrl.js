/**
 * Get RPC URL(s) for the chain
 *
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {string | string[]} RPC URL or array of URLs
 *
 * @example
 * ```typescript
 * import * as Chain from './primitives/Chain/index.js';
 * const rpc = Chain.getRpcUrl(mainnet);
 * // => ["https://...", "https://..."]
 * ```
 */
export function getRpcUrl(chain) {
	return chain.rpc.length === 1 ? chain.rpc[0] : chain.rpc;
}
