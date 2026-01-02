import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
} from "../errors/index.js";
import { BITS, MAX, MIN, MODULO } from "./constants.js";

/**
 * Create Int256 from hex string (two's complement)
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./Int256Type.js').BrandedInt256} Int256 value
 * @throws {InvalidFormatError} If hex is invalid
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.fromHex("0x7fffffffffffffffffffffffffffffff"); // MAX
 * const b = Int256.fromHex("0x80000000000000000000000000000000"); // MIN
 * const c = Int256.fromHex("0xffffffffffffffffffffffffffffffff"); // -1
 * ```
 */
export function fromHex(hex) {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;

	if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
		throw new InvalidFormatError(`Invalid hex string: ${hex}`, {
			value: hex,
			expected: "valid hex characters",
			docsPath: "/primitives/int256#from-hex",
		});
	}

	// Parse as unsigned
	const unsigned = BigInt(`0x${cleanHex}`);

	// Convert from two's complement if high bit is set
	const highBit = 2n ** BigInt(BITS - 1);
	const value = unsigned >= highBit ? unsigned - MODULO : unsigned;

	if (value > MAX) {
		throw new IntegerOverflowError(`Int256 value exceeds maximum (${MAX}): ${value}`, {
			value,
			max: MAX,
			type: "int256",
		});
	}
	if (value < MIN) {
		throw new IntegerUnderflowError(`Int256 value below minimum (${MIN}): ${value}`, {
			value,
			min: MIN,
			type: "int256",
		});
	}

	return /** @type {import('./Int256Type.js').BrandedInt256} */ (value);
}
