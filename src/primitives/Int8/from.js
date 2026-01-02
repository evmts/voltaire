import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
	InvalidLengthError,
} from "../errors/index.js";
import { INT8_MAX, INT8_MIN } from "./Int8Type.js";

/**
 * Create a BrandedInt8 from a number, bigint, hex string, or another BrandedInt8
 * @param {number | bigint | string | import("./Int8Type.js").BrandedInt8} value
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidFormatError} If value is not an integer or invalid hex
 * @throws {IntegerOverflowError} If value exceeds INT8_MAX
 * @throws {IntegerUnderflowError} If value is below INT8_MIN
 */
export function from(value) {
	if (typeof value === "number") {
		return fromNumber(value);
	}
	if (typeof value === "bigint") {
		return fromBigint(value);
	}
	if (typeof value === "string") {
		return fromHex(value);
	}
	// Already BrandedInt8
	return value;
}

/**
 * Create a BrandedInt8 from a number
 * @param {number} value
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidFormatError} If value is not an integer
 * @throws {IntegerOverflowError} If value exceeds INT8_MAX
 * @throws {IntegerUnderflowError} If value is below INT8_MIN
 */
export function fromNumber(value) {
	if (!Number.isInteger(value)) {
		throw new InvalidFormatError(
			`Int8: value must be an integer, got ${value}`,
			{
				value,
				expected: "integer",
				docsPath: "/primitives/int8#from-number",
			},
		);
	}
	if (value > INT8_MAX) {
		throw new IntegerOverflowError(
			`Int8: value ${value} exceeds maximum ${INT8_MAX}`,
			{
				value,
				max: INT8_MAX,
				type: "int8",
			},
		);
	}
	if (value < INT8_MIN) {
		throw new IntegerUnderflowError(
			`Int8: value ${value} is below minimum ${INT8_MIN}`,
			{
				value,
				min: INT8_MIN,
				type: "int8",
			},
		);
	}
	return /** @type {import("./Int8Type.js").BrandedInt8} */ (value);
}

/**
 * Create a BrandedInt8 from a bigint
 * @param {bigint} value
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {IntegerOverflowError} If value exceeds INT8_MAX
 * @throws {IntegerUnderflowError} If value is below INT8_MIN
 */
export function fromBigint(value) {
	if (value > BigInt(INT8_MAX)) {
		throw new IntegerOverflowError(
			`Int8: value ${value} exceeds maximum ${INT8_MAX}`,
			{
				value,
				max: INT8_MAX,
				type: "int8",
			},
		);
	}
	if (value < BigInt(INT8_MIN)) {
		throw new IntegerUnderflowError(
			`Int8: value ${value} is below minimum ${INT8_MIN}`,
			{
				value,
				min: INT8_MIN,
				type: "int8",
			},
		);
	}
	return /** @type {import("./Int8Type.js").BrandedInt8} */ (Number(value));
}

/**
 * Create a BrandedInt8 from a hex string (two's complement)
 * @param {string} hex - "0xFF" for -1, "0x80" for -128, "0x7F" for 127
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidFormatError} If hex string is invalid
 */
export function fromHex(hex) {
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (!/^[0-9a-fA-F]{1,2}$/.test(cleaned)) {
		throw new InvalidFormatError(`Int8: invalid hex string ${hex}`, {
			value: hex,
			expected: "1-2 hex characters",
			docsPath: "/primitives/int8#from-hex",
		});
	}
	const unsigned = Number.parseInt(cleaned, 16);
	// Two's complement conversion: if bit 7 is set, it's negative
	const signed = unsigned >= 128 ? unsigned - 256 : unsigned;
	return /** @type {import("./Int8Type.js").BrandedInt8} */ (signed);
}

/**
 * Create a BrandedInt8 from bytes (two's complement)
 * @param {Uint8Array} bytes - single byte
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidLengthError} If bytes length is not 1
 */
export function fromBytes(bytes) {
	if (bytes.length !== 1) {
		throw new InvalidLengthError(`Int8: expected 1 byte, got ${bytes.length}`, {
			value: bytes,
			expected: "1 byte",
			docsPath: "/primitives/int8#from-bytes",
		});
	}
	const unsigned = /** @type {number} */ (bytes[0]);
	// Two's complement conversion
	const signed = unsigned >= 128 ? unsigned - 256 : unsigned;
	return /** @type {import("./Int8Type.js").BrandedInt8} */ (signed);
}
