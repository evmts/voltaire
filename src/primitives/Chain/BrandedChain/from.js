/**
 * Create Chain from a chain object (identity function)
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('../ChainType.js').Chain} chain - Chain object
 * @returns {import('../ChainType.js').Chain} Chain object
 * @throws {never}
 * @example
 * ```javascript
 * import { mainnet } from '@tevm/chains';
 * import * as Chain from './primitives/Chain/index.js';
 * const chain = Chain.from(mainnet);
 * ```
 */
export function from(chain) {
	return chain;
}
