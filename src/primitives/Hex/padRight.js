import { InvalidSizeError } from "./errors.js";
import { fromBytes } from "./fromBytes.js";
import { toBytes } from "./toBytes.js";

/**
 * Pad hex to right (suffix with zeros)
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to pad
 * @param {number} targetSize - Target size in bytes (must be non-negative integer)
 * @returns {string} Right-padded hex string
 * @throws {InvalidSizeError} If targetSize is not a non-negative integer
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const padded = Hex.padRight(hex, 4); // '0x12340000'
 * Hex.padRight('0x1234', -1); // throws InvalidSizeError
 * Hex.padRight('0x1234', 1.5); // throws InvalidSizeError
 * ```
 */
export function padRight(hex, targetSize) {
	if (!Number.isInteger(targetSize) || targetSize < 0) {
		throw new InvalidSizeError(
			`Invalid target size: ${targetSize}. Size must be a non-negative integer.`,
			{
				value: targetSize,
				expected: "non-negative integer",
				context: { targetSize },
			},
		);
	}
	// Normalize odd-length hex by padding with trailing 0
	let normalized = hex;
	if (hex.length % 2 !== 0) {
		normalized = `${hex}0`;
	}
	const bytes = toBytes(
		/** @type {import('./HexType.js').HexType} */ (normalized),
	);
	if (bytes.length >= targetSize) {
		return /** @type {import('./HexType.js').HexType} */ (fromBytes(bytes));
	}
	const padded = new Uint8Array(targetSize);
	padded.set(bytes, 0);
	return /** @type {import('./HexType.js').HexType} */ (fromBytes(padded));
}
