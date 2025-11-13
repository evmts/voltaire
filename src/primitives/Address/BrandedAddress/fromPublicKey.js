/**
 * Factory: Create Address from secp256k1 public key (standard form)
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(x: bigint, y: bigint) => import('./BrandedAddress.js').BrandedAddress} Function that creates Address from public key coordinates
 *
 * @example
 * ```typescript
 * import { FromPublicKey } from '@tevm/voltaire/Address/BrandedAddress'
 * import { hash as keccak256 } from '@tevm/voltaire/crypto/Keccak256'
 *
 * const fromPublicKey = FromPublicKey({ keccak256 })
 * const addr = fromPublicKey(xCoord, yCoord)
 * ```
 */
export function FromPublicKey({ keccak256 }) {
	return function fromPublicKey(x, y) {
		// Encode public key as 64 bytes (uncompressed, no prefix)
		const pubkey = new Uint8Array(64);

		// Encode x coordinate (32 bytes, big-endian)
		for (let i = 0; i < 32; i++) {
			pubkey[31 - i] = Number((x >> BigInt(i * 8)) & 0xffn);
		}

		// Encode y coordinate (32 bytes, big-endian)
		for (let i = 0; i < 32; i++) {
			pubkey[63 - i] = Number((y >> BigInt(i * 8)) & 0xffn);
		}

		// Hash and take last 20 bytes
		const hash = keccak256(pubkey);
		return /** @type {import('./BrandedAddress.js').BrandedAddress} */ (
			hash.slice(12)
		);
	};
}
