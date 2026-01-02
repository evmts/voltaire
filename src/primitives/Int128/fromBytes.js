import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidLengthError,
} from "../errors/index.js";
import { BITS, MAX, MIN, MODULO, SIZE } from "./constants.js";

/**
 * Create Int128 from bytes (two's complement, big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Byte array (16 bytes)
 * @returns {import('./Int128Type.js').BrandedInt128} Int128 value
 * @throws {InvalidLengthError} If bytes length is incorrect
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const bytes = new Uint8Array(16);
 * bytes[15] = 0xff; // -1
 * const value = Int128.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== SIZE) {
		throw new InvalidLengthError(
			`Int128 requires ${SIZE} bytes, got ${bytes.length}`,
			{
				value: bytes,
				expected: `${SIZE} bytes`,
				docsPath: "/primitives/int128#from-bytes",
			},
		);
	}

	// Parse as unsigned
	let unsigned = 0n;
	for (let i = 0; i < SIZE; i++) {
		unsigned = (unsigned << 8n) | BigInt(/** @type {number} */ (bytes[i]));
	}

	// Convert from two's complement if high bit is set
	const highBit = 2n ** BigInt(BITS - 1);
	const value = unsigned >= highBit ? unsigned - MODULO : unsigned;

	if (value > MAX) {
		throw new IntegerOverflowError(
			`Int128 value exceeds maximum (${MAX}): ${value}`,
			{
				value,
				max: MAX,
				type: "int128",
			},
		);
	}
	if (value < MIN) {
		throw new IntegerUnderflowError(
			`Int128 value below minimum (${MIN}): ${value}`,
			{
				value,
				min: MIN,
				type: "int128",
			},
		);
	}

	return /** @type {import('./Int128Type.js').BrandedInt128} */ (value);
}
