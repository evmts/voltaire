/**
 * Get the parent L1 chain for an L2
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {import('./ChainType.js').Chain | undefined} L1 chain or undefined
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const l1 = Chain.getL1Chain(optimism);
 * // => mainnet chain object
 * ```
 */
export function getL1Chain(chain: import("./ChainType.js").Chain): import("./ChainType.js").Chain | undefined;
//# sourceMappingURL=getL1Chain.d.ts.map