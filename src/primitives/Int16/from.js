import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
	InvalidLengthError,
} from "../errors/index.js";
import { INT16_MAX, INT16_MIN } from "./Int16Type.js";

/**
 * Create a BrandedInt16 from a number, bigint, hex string, or another BrandedInt16
 * @param {number | bigint | string | import("./Int16Type.js").BrandedInt16} value
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidFormatError} If value is not an integer or invalid hex
 * @throws {IntegerOverflowError} If value exceeds INT16_MAX
 * @throws {IntegerUnderflowError} If value is below INT16_MIN
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
	// Already BrandedInt16
	return value;
}

/**
 * Create a BrandedInt16 from a number
 * @param {number} value
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidFormatError} If value is not an integer
 * @throws {IntegerOverflowError} If value exceeds INT16_MAX
 * @throws {IntegerUnderflowError} If value is below INT16_MIN
 */
export function fromNumber(value) {
	if (!Number.isInteger(value)) {
		throw new InvalidFormatError(`Int16: value must be an integer, got ${value}`, {
			value,
			expected: "integer",
			docsPath: "/primitives/int16#from-number",
		});
	}
	if (value > INT16_MAX) {
		throw new IntegerOverflowError(`Int16: value ${value} exceeds maximum ${INT16_MAX}`, {
			value,
			max: INT16_MAX,
			type: "int16",
		});
	}
	if (value < INT16_MIN) {
		throw new IntegerUnderflowError(`Int16: value ${value} is below minimum ${INT16_MIN}`, {
			value,
			min: INT16_MIN,
			type: "int16",
		});
	}
	return /** @type {import("./Int16Type.js").BrandedInt16} */ (value);
}

/**
 * Create a BrandedInt16 from a bigint
 * @param {bigint} value
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {IntegerOverflowError} If value exceeds INT16_MAX
 * @throws {IntegerUnderflowError} If value is below INT16_MIN
 */
export function fromBigint(value) {
	if (value > BigInt(INT16_MAX)) {
		throw new IntegerOverflowError(`Int16: value ${value} exceeds maximum ${INT16_MAX}`, {
			value,
			max: INT16_MAX,
			type: "int16",
		});
	}
	if (value < BigInt(INT16_MIN)) {
		throw new IntegerUnderflowError(`Int16: value ${value} is below minimum ${INT16_MIN}`, {
			value,
			min: INT16_MIN,
			type: "int16",
		});
	}
	return /** @type {import("./Int16Type.js").BrandedInt16} */ (Number(value));
}

/**
 * Create a BrandedInt16 from a hex string (two's complement)
 * @param {string} hex - "0xFFFF" for -1, "0x8000" for -32768, "0x7FFF" for 32767
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidFormatError} If hex string is invalid
 */
export function fromHex(hex) {
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (!/^[0-9a-fA-F]{1,4}$/.test(cleaned)) {
		throw new InvalidFormatError(`Int16: invalid hex string ${hex}`, {
			value: hex,
			expected: "1-4 hex characters",
			docsPath: "/primitives/int16#from-hex",
		});
	}
	const unsigned = Number.parseInt(cleaned, 16);
	// Two's complement conversion: if bit 15 is set, it's negative
	const signed = unsigned >= 32768 ? unsigned - 65536 : unsigned;
	return /** @type {import("./Int16Type.js").BrandedInt16} */ (signed);
}

/**
 * Create a BrandedInt16 from bytes (two's complement, big-endian)
 * @param {Uint8Array} bytes - 2 bytes
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidLengthError} If bytes length is not 2
 */
export function fromBytes(bytes) {
	if (bytes.length !== 2) {
		throw new InvalidLengthError(`Int16: expected 2 bytes, got ${bytes.length}`, {
			value: bytes,
			expected: "2 bytes",
			docsPath: "/primitives/int16#from-bytes",
		});
	}
	const unsigned =
		/** @type {number} */ (/** @type {number} */ (bytes[0]) << 8) |
		/** @type {number} */ (bytes[1]);
	// Two's complement conversion
	const signed = unsigned >= 32768 ? unsigned - 65536 : unsigned;
	return /** @type {import("./Int16Type.js").BrandedInt16} */ (signed);
}
