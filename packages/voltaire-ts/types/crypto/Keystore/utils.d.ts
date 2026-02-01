/**
 * Convert Uint8Array to hex string (without 0x prefix)
 *
 * @param {Uint8Array} bytes - Bytes to convert
 * @returns {string} Hex string without 0x prefix
 */
export function bytesToHex(bytes: Uint8Array): string;
/**
 * Convert hex string to Uint8Array (with or without 0x prefix)
 *
 * @param {string} hex - Hex string
 * @returns {Uint8Array} Bytes
 */
export function hexToBytes(hex: string): Uint8Array;
/**
 * Generate a UUID v4
 *
 * @returns {string} UUID
 */
export function generateUuid(): string;
/**
 * Concatenate multiple Uint8Arrays
 *
 * @param {...Uint8Array} arrays - Arrays to concatenate
 * @returns {Uint8Array} Concatenated array
 */
export function concat(...arrays: Uint8Array[]): Uint8Array;
//# sourceMappingURL=utils.d.ts.map