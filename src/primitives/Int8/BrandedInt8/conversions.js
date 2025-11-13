/**
 * Convert BrandedInt8 to number
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {number}
 */
export function toNumber(value) {
	return value;
}

/**
 * Convert BrandedInt8 to bigint
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {bigint}
 */
export function toBigint(value) {
	return BigInt(value);
}

/**
 * Convert BrandedInt8 to hex string (two's complement)
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {string}
 */
export function toHex(value) {
	// Convert to unsigned byte for two's complement representation
	const unsigned = value < 0 ? value + 256 : value;
	return `0x${unsigned.toString(16).padStart(2, "0")}`;
}

/**
 * Convert BrandedInt8 to bytes (two's complement)
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {Uint8Array}
 */
export function toBytes(value) {
	const unsigned = value < 0 ? value + 256 : value;
	return new Uint8Array([unsigned]);
}

/**
 * Convert BrandedInt8 to string
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {string}
 */
export function toString(value) {
	return value.toString();
}
