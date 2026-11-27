/**
 * Create Chain from a chain object (identity function)
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {import('./ChainType.js').Chain} Chain object
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const mainnet = Chain.fromId(1);
 * if (mainnet) {
 *   const chain = Chain.from(mainnet);
 * }
 * ```
 */
export function from(chain: import("./ChainType.js").Chain): import("./ChainType.js").Chain;
//# sourceMappingURL=from.d.ts.map