import {
	COMPONENT_SIZE,
	ECDSA_SIZE,
	ECDSA_WITH_V_SIZE,
	ED25519_SIZE,
} from "./constants.js";
import { InvalidSignatureLengthError } from "./errors.js";
import { fromEd25519 } from "./fromEd25519.js";
import { fromP256 } from "./fromP256.js";
import { fromSecp256k1 } from "./fromSecp256k1.js";

/**
 * Create Signature from compact format (EIP-2098: supports yParity in bit 255 of s)
 *
 * @param {Uint8Array} bytes - Compact signature bytes (64 or 65 bytes)
 * @param {import('../SignatureType.js').SignatureAlgorithm | number} algorithmOrV - Algorithm or explicit v value
 * @returns {import('../SignatureType.js').SignatureType} Signature
 * @throws {InvalidSignatureLengthError} If bytes length is invalid
 *
 * @example
 * ```typescript
 * // EIP-2098: Extract yParity from bit 255 of s (64 bytes)
 * const sig1 = Signature.fromCompact(bytes64, 'secp256k1');
 *
 * // Explicit v value (64 bytes)
 * const sig2 = Signature.fromCompact(bytes64, 0);
 *
 * // Legacy: 65 bytes with v at end
 * const sig3 = Signature.fromCompact(bytes65, 'secp256k1');
 *
 * // Ed25519 (64 bytes)
 * const sig4 = Signature.fromCompact(bytes64, 'ed25519');
 * ```
 */
export function fromCompact(bytes, algorithmOrV) {
	const algorithm =
		typeof algorithmOrV === "string" ? algorithmOrV : "secp256k1";
	const explicitV = typeof algorithmOrV === "number" ? algorithmOrV : undefined;

	if (algorithm === "ed25519") {
		if (bytes.length !== ED25519_SIZE) {
			throw new InvalidSignatureLengthError(
				`Ed25519 signature must be ${ED25519_SIZE} bytes, got ${bytes.length}`,
				{
					value: bytes.length,
					expected: `${ED25519_SIZE} bytes`,
					docsPath: "/primitives/signature/from-compact#error-handling",
				},
			);
		}
		return fromEd25519(bytes);
	}

	// ECDSA algorithms (secp256k1, p256)
	if (bytes.length === ECDSA_SIZE) {
		const r = bytes.slice(0, COMPONENT_SIZE);
		const sBytes = bytes.slice(COMPONENT_SIZE, ECDSA_SIZE);

		// EIP-2098: Extract yParity from bit 255 of s
		const yParity =
			explicitV !== undefined ? explicitV : (sBytes[0] & 0x80) >> 7;

		// Clear bit 255 from s
		const s = new Uint8Array(sBytes);
		s[0] &= 0x7f;

		if (algorithm === "secp256k1") {
			return fromSecp256k1(r, s, yParity);
		}
		if (algorithm === "p256") {
			return fromP256(r, s);
		}
	}

	if (bytes.length === ECDSA_WITH_V_SIZE && algorithm === "secp256k1") {
		const r = bytes.slice(0, COMPONENT_SIZE);
		const s = bytes.slice(COMPONENT_SIZE, ECDSA_SIZE);
		const v = bytes[64];
		return fromSecp256k1(r, s, v);
	}

	throw new InvalidSignatureLengthError(
		`Invalid signature length for ${algorithm}: ${bytes.length} bytes`,
		{
			value: bytes.length,
			expected:
				algorithm === "secp256k1"
					? `${ECDSA_SIZE} or ${ECDSA_WITH_V_SIZE} bytes`
					: `${ECDSA_SIZE} bytes`,
			context: { algorithm },
			docsPath: "/primitives/signature/from-compact#error-handling",
		},
	);
}
