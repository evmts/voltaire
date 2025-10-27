/**
 * Hex string format
 * Always includes "0x" prefix
 */
export type HexString = `0x${string}`;

/**
 * Type guard: Check if string is valid hex format
 */
export function isHexString(value: unknown): value is HexString {
  return typeof value === 'string' && /^0x[0-9a-fA-F]*$/.test(value);
}

/**
 * Convert bytes to hex string with 0x prefix
 *
 * @param bytes Input bytes
 * @returns Hex string with 0x prefix
 */
export function bytesToHex(bytes: Uint8Array): HexString {
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}` as HexString;
}
