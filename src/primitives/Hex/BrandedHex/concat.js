import * as OxHex from "ox/Hex";
import { fromBytes } from "./fromBytes.js";

/**
 * Concatenate multiple hex strings
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {...string} hexes - Hex strings to concatenate
 * @returns {string} Concatenated hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.concat('0x12', '0x34', '0x56'); // '0x123456'
 * ```
 */
export function concat(...hexes) {
	const allBytes = hexes.flatMap((h) =>
		Array.from(OxHex.toBytes(/** @type {`0x${string}`} */ (h))),
	);
	return /** @type {import('./BrandedHex.js').BrandedHex} */ (
		fromBytes(new Uint8Array(allBytes))
	);
}
