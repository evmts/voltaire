import { fromBytes } from "./fromBytes.js";
import { toBytes } from "./toBytes.js";

/**
 * Concatenate multiple hex strings
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string[] | string} hexesOrFirst - Array of hex strings, or first hex string
 * @param {...string} rest - Additional hex strings (if first arg is not an array)
 * @returns {string} Concatenated hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * // Variadic form
 * Hex.concat('0x12', '0x34', '0x56'); // '0x123456'
 * // Array form
 * Hex.concat(['0x12', '0x34', '0x56']); // '0x123456'
 * ```
 */
export function concat(hexesOrFirst, ...rest) {
	// Support both array and variadic forms
	const hexes = Array.isArray(hexesOrFirst)
		? hexesOrFirst
		: [hexesOrFirst, ...rest];

	const allBytes = hexes.flatMap((h) =>
		Array.from(toBytes(/** @type {import('./HexType.js').HexType} */ (h))),
	);
	return /** @type {import('./HexType.js').HexType} */ (
		fromBytes(new Uint8Array(allBytes))
	);
}
