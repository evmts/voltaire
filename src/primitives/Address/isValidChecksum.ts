import * as Checksummed from "./ChecksumAddress.js";

/**
 * Check if string has valid EIP-55 checksum (standard form)
 *
 * @param str - Address string to validate
 * @returns True if checksum is valid
 *
 * @example
 * ```typescript
 * if (Address.isValidChecksum("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")) {
 *   console.log("Valid checksum");
 * }
 * ```
 */
export function isValidChecksum(str: string): boolean {
  return Checksummed.isValid(str);
}
