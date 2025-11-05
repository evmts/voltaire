import { keccak256 } from "../../Hash/BrandedHash/keccak256.js";

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
	const pubkey = new Uint8Array(64);
	for (let i = 31; i >= 0; i--) {
		pubkey[31 - i] = Number((x >> BigInt(i * 8)) & 0xffn);
		pubkey[63 - i] = Number((y >> BigInt(i * 8)) & 0xffn);
	}
	const hash = keccak256(pubkey);
	return /** @type {import('./BrandedAddress.js').BrandedAddress} */ (
		hash.slice(12, 32)
	);
}
