/**
 * Check if chain is a Layer 2
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {boolean} True if L2
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * Chain.isL2(mainnet);   // => false
 * Chain.isL2(optimism);  // => true
 * ```
 */
export function isL2(chain: import("./ChainType.js").Chain): boolean;
//# sourceMappingURL=isL2.d.ts.map