/**
 * Convert BrandedInt16 to number
 * @param {import('./BrandedInt16.ts').BrandedInt16} value
 * @returns {number}
 */
export function toNumber(value) {
	return value;
}

/**
 * Convert BrandedInt16 to bigint
 * @param {import('./BrandedInt16.ts').BrandedInt16} value
 * @returns {bigint}
 */
export function toBigint(value) {
	return BigInt(value);
}

/**
 * Convert BrandedInt16 to hex string (two's complement)
 * @param {import('./BrandedInt16.ts').BrandedInt16} value
 * @returns {string}
 */
export function toHex(value) {
	// Convert to unsigned for two's complement representation
	const unsigned = value < 0 ? value + 65536 : value;
	return `0x${unsigned.toString(16).padStart(4, "0")}`;
}

/**
 * Convert BrandedInt16 to bytes (two's complement, big-endian)
 * @param {import('./BrandedInt16.ts').BrandedInt16} value
 * @returns {Uint8Array}
 */
export function toBytes(value) {
	const unsigned = value < 0 ? value + 65536 : value;
	return new Uint8Array([(unsigned >> 8) & 0xff, unsigned & 0xff]);
}

/**
 * Convert BrandedInt16 to string
 * @param {import('./BrandedInt16.ts').BrandedInt16} value
 * @returns {string}
 */
export function toString(value) {
	return value.toString();
}
