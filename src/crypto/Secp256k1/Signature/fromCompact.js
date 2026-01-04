// @ts-nocheck
import { InvalidSignatureError } from "../../../primitives/errors/index.js";

/**
 * Create signature from EIP-2098 compact format (64 bytes: r || s with yParity in bit 255)
 *
 * EIP-2098 encodes yParity in bit 255 of s. This function:
 * - Extracts yParity from bit 255 if no explicit v is provided
 * - Clears bit 255 from s to restore the original s value
 * - Uses the explicit v if provided (for legacy compatibility)
 *
 * @see https://eips.ethereum.org/EIPS/eip-2098
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} compact - 64-byte compact signature
 * @param {number} [v] - Optional explicit recovery id. If omitted, extracted from bit 255.
 * @returns {import('../SignatureType.js').Secp256k1SignatureType} ECDSA signature
 * @throws {InvalidSignatureError} If compact data is wrong length
 * @example
 * ```javascript
 * import { Secp256k1 } from './crypto/Secp256k1/index.js';
 * // EIP-2098: extract yParity from bit 255
 * const sig1 = Secp256k1.Signature.fromCompact(compact);
 * // Explicit v (legacy)
 * const sig2 = Secp256k1.Signature.fromCompact(compact, 27);
 * ```
 */
export function fromCompact(compact, v) {
	if (compact.length !== 64) {
		throw new InvalidSignatureError(
			`Compact signature must be 64 bytes, got ${compact.length}`,
			{
				code: "INVALID_COMPACT_SIGNATURE_LENGTH",
				context: { actualLength: compact.length, expectedLength: 64 },
				docsPath: "/crypto/secp256k1/signature#error-handling",
			},
		);
	}

	// EIP-2098: Extract yParity from bit 255 of s
	const yParityFromBit = (compact[32] & 0x80) >> 7;

	// Use explicit v if provided, otherwise use extracted yParity
	const recoveryV = v !== undefined ? v : yParityFromBit;

	// Clear bit 255 from s to restore original value
	const s = compact.slice(32, 64);
	s[0] = s[0] & 0x7f;

	return {
		r: compact.slice(0, 32),
		s,
		v: recoveryV,
	};
}
