/**
 * Check if chain is a testnet
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {boolean} True if testnet
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * Chain.isTestnet(mainnet);  // => false
 * Chain.isTestnet(sepolia);  // => true
 * ```
 */
export function isTestnet(chain: import("./ChainType.js").Chain): boolean;
//# sourceMappingURL=isTestnet.d.ts.map