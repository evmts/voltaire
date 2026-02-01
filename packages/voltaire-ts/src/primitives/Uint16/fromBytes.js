import { Uint16InvalidLengthError } from "./errors.js";

/**
 * Create Uint16 from Uint8Array (2 bytes, big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Uint8Array (must be exactly 2 bytes)
 * @returns {import('./Uint16Type.js').Uint16Type} Uint16 value
 * @throws {Uint16InvalidLengthError} If bytes length is not 2
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const bytes = new Uint8Array([0xff, 0xff]);
 * const value = Uint16.fromBytes(bytes); // 65535
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== 2) {
		throw new Uint16InvalidLengthError(
			`Uint16 requires exactly 2 bytes, got ${bytes.length}`,
			{
				value: bytes,
				expected: "2 bytes",
				actualLength: bytes.length,
			},
		);
	}

	const b0 = bytes[0];
	const b1 = bytes[1];
	if (b0 === undefined || b1 === undefined) {
		throw new Uint16InvalidLengthError("Invalid byte array", {
			value: bytes,
			expected: "2 valid bytes",
			actualLength: bytes.length,
		});
	}
	const value = /** @type {number} */ ((b0 << 8) | b1);
	return /** @type {import('./Uint16Type.js').Uint16Type} */ (value);
}
