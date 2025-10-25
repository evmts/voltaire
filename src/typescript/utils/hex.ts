/**
 * Convert hex string to Uint8Array
 *
 * @param hex - Hex string with optional 0x prefix
 * @returns Uint8Array representation of the hex string
 *
 * @example
 * ```typescript
 * const bytes = hexToBytes("0x1234");
 * // Uint8Array([0x12, 0x34])
 *
 * const bytes2 = hexToBytes("abcd");
 * // Uint8Array([0xab, 0xcd])
 * ```
 */
export function hexToBytes(hex: string): Uint8Array {
	// Remove 0x prefix if present
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;

	// Handle empty string
	if (cleaned.length === 0) {
		return new Uint8Array(0);
	}

	// Ensure even length
	const padded = cleaned.length % 2 === 0 ? cleaned : `0${cleaned}`;

	const bytes = new Uint8Array(padded.length / 2);
	for (let i = 0; i < padded.length; i += 2) {
		bytes[i / 2] = Number.parseInt(padded.slice(i, i + 2), 16);
	}

	return bytes;
}

/**
 * Convert Uint8Array to hex string with 0x prefix
 *
 * @param bytes - Byte array to convert
 * @returns Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = bytesToHex(new Uint8Array([0x12, 0x34]));
 * // "0x1234"
 * ```
 */
export function bytesToHex(bytes: Uint8Array): string {
	return `0x${Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}
