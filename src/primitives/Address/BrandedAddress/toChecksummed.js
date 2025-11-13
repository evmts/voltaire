import { From } from "./ChecksumAddress.js";

/**
 * Factory: Convert Address to EIP-55 checksummed hex string
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(address: import('./BrandedAddress.js').BrandedAddress) => import('./ChecksumAddress.js').Checksummed} Function that converts Address to checksummed hex string
 *
 * @example
 * ```typescript
 * import { ToChecksummed } from '@tevm/voltaire/Address/BrandedAddress'
 * import { hash as keccak256 } from '@tevm/voltaire/crypto/Keccak256'
 *
 * const toChecksummed = ToChecksummed({ keccak256 })
 * const checksummed = toChecksummed(addr)
 * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
 * ```
 */
export function ToChecksummed({ keccak256 }) {
	return From({ keccak256 });
}
