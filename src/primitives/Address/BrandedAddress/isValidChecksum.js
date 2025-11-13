import { IsValid } from "./ChecksumAddress.js";

/**
 * Factory: Check if string has valid EIP-55 checksum
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(str: string) => boolean} Function that validates EIP-55 checksum
 *
 * @example
 * ```typescript
 * import { IsValidChecksum } from '@tevm/voltaire/Address/BrandedAddress'
 * import { hash as keccak256 } from '@tevm/voltaire/crypto/Keccak256'
 *
 * const isValidChecksum = IsValidChecksum({ keccak256 })
 * if (isValidChecksum("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")) {
 *   console.log("Valid checksum")
 * }
 * ```
 */
export function IsValidChecksum({ keccak256 }) {
	return IsValid({ keccak256 });
}
