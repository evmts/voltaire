// @ts-nocheck
/**
 * Convert signature to compact format (EIP-2098: 64 bytes with yParity in bit 255 of s)
 *
 * The compact format encodes r (32 bytes) || s (32 bytes) with the yParity
 * (recovery bit) encoded in bit 255 (MSB) of s. This saves 1 byte compared
 * to the traditional 65-byte format (r || s || v).
 *
 * @see https://eips.ethereum.org/EIPS/eip-2098
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../SignatureType.js').Secp256k1SignatureType} signature - ECDSA signature
 * @returns {Uint8Array} 64-byte compact signature with yParity in bit 255 of s
 * @throws {never}
 * @example
 * ```javascript
 * import { Secp256k1 } from './crypto/Secp256k1/index.js';
 * const compact = Secp256k1.Signature.toCompact(signature);
 * console.log(compact.length); // 64
 * // yParity is encoded in bit 255 of s (MSB of byte 32)
 * ```
 */
export function toCompact(signature) {
	const compact = new Uint8Array(64);

	// Copy r (first 32 bytes)
	compact.set(signature.r, 0);

	// Copy s (next 32 bytes)
	compact.set(signature.s, 32);

	// EIP-2098: Encode yParity in bit 255 (MSB) of s
	if (signature.v !== undefined) {
		// Convert v to yParity (0 or 1)
		// v can be: 0/1 (yParity), 27/28 (legacy), or chainId*2+35+yParity (EIP-155)
		let yParity;
		if (signature.v <= 1) {
			yParity = signature.v;
		} else if (signature.v === 27 || signature.v === 28) {
			yParity = signature.v - 27;
		} else {
			// EIP-155: v = chainId * 2 + 35 + yParity
			yParity = (signature.v - 35) % 2;
		}

		if (yParity === 1) {
			compact[32] |= 0x80; // Set bit 255
		}
	}

	return compact;
}
