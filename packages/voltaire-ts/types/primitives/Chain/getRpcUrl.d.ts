/**
 * Get RPC URL(s) for the chain
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {string | string[]} RPC URL or array of URLs
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const rpc = Chain.getRpcUrl(mainnet);
 * // => ["https://...", "https://..."]
 * ```
 */
export function getRpcUrl(chain: import("./ChainType.js").Chain): string | string[];
//# sourceMappingURL=getRpcUrl.d.ts.map