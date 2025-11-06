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
	if (chain.rpc.length === 0) {
		return [];
	}
	if (chain.rpc.length === 1) {
		const url = chain.rpc[0];
		return url ?? [];
	}
	return chain.rpc;
}
