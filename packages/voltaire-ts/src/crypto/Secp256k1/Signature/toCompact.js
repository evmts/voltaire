// @ts-nocheck
/**
 * Convert signature to EIP-2098 compact format (64 bytes: r || s with yParity in bit 255)
 *
 * EIP-2098 encodes the recovery parameter (yParity) into the highest bit of s,
 * allowing signatures to be represented in 64 bytes instead of 65.
 *
 * @see https://eips.ethereum.org/EIPS/eip-2098
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../SignatureType.js').Secp256k1SignatureType} signature - ECDSA signature
 * @returns {Uint8Array} 64-byte EIP-2098 compact signature
 * @throws {never}
 * @example
 * ```javascript
 * import { Secp256k1 } from './crypto/Secp256k1/index.js';
 * const compact = Secp256k1.Signature.toCompact(signature);
 * console.log(compact.length); // 64
 * // yParity is encoded in bit 255 of s
 * ```
 */
export function toCompact(signature) {
	const compact = new Uint8Array(64);

	// Copy r (first 32 bytes)
	compact.set(signature.r, 0);

	// Copy s (next 32 bytes)
	compact.set(signature.s, 32);

	// EIP-2098: Encode yParity in bit 255 (MSB) of s
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

	return compact;
}
