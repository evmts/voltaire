import { ECDSA_WITH_V_SIZE } from "./constants.js";

/**
 * Convert Signature to compact format (EIP-2098: yParity encoded in bit 255 of s)
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to convert
 * @returns {Uint8Array} Compact signature (64 bytes with yParity in bit 255 of s)
 *
 * @example
 * ```typescript
 * const compact = Signature.toCompact(sig);
 * // Returns r + s (64 bytes) with yParity encoded in bit 255 of s (EIP-2098)
 * ```
 */
export function toCompact(signature) {
	const compact = new Uint8Array(64);

	// Copy r (first 32 bytes)
	compact.set(signature.subarray(0, 32), 0);

	// Copy s (next 32 bytes)
	compact.set(signature.subarray(32, 64), 32);

	// EIP-2098: Encode yParity in bit 255 (MSB) of s
	if (signature.v !== undefined && signature.algorithm === "secp256k1") {
		const yParity = signature.v;
		if (yParity === 1) {
			/** @type {*} */ (compact)[32] |= 0x80; // Set bit 255
		}
	}

	return compact;
}
