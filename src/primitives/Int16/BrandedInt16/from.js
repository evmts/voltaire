import { INT16_MIN, INT16_MAX } from "./BrandedInt16.ts";

/**
 * Create a BrandedInt16 from a number, bigint, hex string, or another BrandedInt16
 * @param {number | bigint | string | import('./BrandedInt16.ts').BrandedInt16} value
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
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
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function fromNumber(value) {
	if (!Number.isInteger(value)) {
		throw new Error(`Int16: value must be an integer, got ${value}`);
	}
	if (value < INT16_MIN || value > INT16_MAX) {
		throw new Error(
			`Int16: value ${value} out of range [${INT16_MIN}, ${INT16_MAX}]`,
		);
	}
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (value);
}

/**
 * Create a BrandedInt16 from a bigint
 * @param {bigint} value
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function fromBigint(value) {
	if (value < BigInt(INT16_MIN) || value > BigInt(INT16_MAX)) {
		throw new Error(
			`Int16: value ${value} out of range [${INT16_MIN}, ${INT16_MAX}]`,
		);
	}
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (
		Number(value)
	);
}

/**
 * Create a BrandedInt16 from a hex string (two's complement)
 * @param {string} hex - "0xFFFF" for -1, "0x8000" for -32768, "0x7FFF" for 32767
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function fromHex(hex) {
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (!/^[0-9a-fA-F]{1,4}$/.test(cleaned)) {
		throw new Error(`Int16: invalid hex string ${hex}`);
	}
	const unsigned = Number.parseInt(cleaned, 16);
	// Two's complement conversion: if bit 15 is set, it's negative
	const signed = unsigned >= 32768 ? unsigned - 65536 : unsigned;
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (signed);
}

/**
 * Create a BrandedInt16 from bytes (two's complement, big-endian)
 * @param {Uint8Array} bytes - 2 bytes
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function fromBytes(bytes) {
	if (bytes.length !== 2) {
		throw new Error(`Int16: expected 2 bytes, got ${bytes.length}`);
	}
	const unsigned = (bytes[0] << 8) | bytes[1];
	// Two's complement conversion
	const signed = unsigned >= 32768 ? unsigned - 65536 : unsigned;
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (signed);
}
