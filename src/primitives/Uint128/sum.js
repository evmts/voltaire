import { plus } from "./plus.js";

/**
 * Sum array of values
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type[]} values - Array of values
 * @returns {import('./Uint128Type.js').Uint128Type} Sum with wrapping
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const values = [Uint128.from(100n), Uint128.from(50n), Uint128.from(75n)];
 * const total = Uint128.sum(values); // 225n
 * ```
 */
export function sum(values) {
	let result = /** @type {import('./Uint128Type.js').Uint128Type} */ (0n);
	for (let i = 0; i < values.length; i++) {
		result = plus(result, /** @type {import('./Uint128Type.js').Uint128Type} */ (values[i]));
	}
	return /** @type {import('./Uint128Type.js').Uint128Type} */ (result);
}
