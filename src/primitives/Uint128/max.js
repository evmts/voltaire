import { Uint128EmptyInputError } from "./errors.js";
import { maximum } from "./maximum.js";

/**
 * Get maximum value from array
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type[]} values - Array of values
 * @returns {import('./Uint128Type.js').Uint128Type} Maximum value
 * @throws {Uint128EmptyInputError} If array is empty
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const values = [Uint128.from(100n), Uint128.from(50n), Uint128.from(75n)];
 * const max = Uint128.max(values); // 100n
 * ```
 */
export function max(values) {
	if (values.length === 0) {
		throw new Uint128EmptyInputError("Cannot find maximum of empty array");
	}

	let result = /** @type {import('./Uint128Type.js').Uint128Type} */ (
		values[0]
	);
	for (let i = 1; i < values.length; i++) {
		result = maximum(
			result,
			/** @type {import('./Uint128Type.js').Uint128Type} */ (values[i]),
		);
	}
	return result;
}
