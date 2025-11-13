import { INT8_MAX, INT8_MIN } from "./BrandedInt8.ts";

/**
 * Create a BrandedInt8 from a number, bigint, hex string, or another BrandedInt8
 * @param {number | bigint | string | import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
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
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function fromNumber(value) {
	if (!Number.isInteger(value)) {
		throw new Error(`Int8: value must be an integer, got ${value}`);
	}
	if (value < INT8_MIN || value > INT8_MAX) {
		throw new Error(
			`Int8: value ${value} out of range [${INT8_MIN}, ${INT8_MAX}]`,
		);
	}
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (value);
}

/**
 * Create a BrandedInt8 from a bigint
 * @param {bigint} value
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function fromBigint(value) {
	if (value < BigInt(INT8_MIN) || value > BigInt(INT8_MAX)) {
		throw new Error(
			`Int8: value ${value} out of range [${INT8_MIN}, ${INT8_MAX}]`,
		);
	}
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (Number(value));
}

/**
 * Create a BrandedInt8 from a hex string (two's complement)
 * @param {string} hex - "0xFF" for -1, "0x80" for -128, "0x7F" for 127
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function fromHex(hex) {
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (!/^[0-9a-fA-F]{1,2}$/.test(cleaned)) {
		throw new Error(`Int8: invalid hex string ${hex}`);
	}
	const unsigned = Number.parseInt(cleaned, 16);
	// Two's complement conversion: if bit 7 is set, it's negative
	const signed = unsigned >= 128 ? unsigned - 256 : unsigned;
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (signed);
}

/**
 * Create a BrandedInt8 from bytes (two's complement)
 * @param {Uint8Array} bytes - single byte
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function fromBytes(bytes) {
	if (bytes.length !== 1) {
		throw new Error(`Int8: expected 1 byte, got ${bytes.length}`);
	}
	const unsigned = bytes[0];
	// Two's complement conversion
	const signed = unsigned >= 128 ? unsigned - 256 : unsigned;
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (signed);
}
