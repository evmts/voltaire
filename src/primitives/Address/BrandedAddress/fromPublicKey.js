import { hash as keccak256 } from "../../../crypto/Keccak256/hash.js";

/**
 * Create Address from secp256k1 public key (standard form)
 *
 * @param {bigint} x - Public key x coordinate
 * @param {bigint} y - Public key y coordinate
 * @returns {import('./BrandedAddress.js').BrandedAddress} Address derived from keccak256(pubkey)[12:32]
 *
 * @example
 * ```typescript
 * const addr = Address.fromPublicKey(xCoord, yCoord);
 * ```
 */
export function fromPublicKey(x, y) {
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
}
