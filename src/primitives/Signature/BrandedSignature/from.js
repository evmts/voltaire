import { ECDSA_SIZE, ED25519_SIZE } from "./constants.js";
import { InvalidSignatureFormatError } from "./errors.js";
import { fromCompact } from "./fromCompact.js";
import { fromEd25519 } from "./fromEd25519.js";
import { fromP256 } from "./fromP256.js";
import { fromSecp256k1 } from "./fromSecp256k1.js";

/**
 * Create Signature from various input types (universal constructor)
 *
 * @param {Uint8Array | { r: Uint8Array; s: Uint8Array; v?: number; algorithm?: import('./BrandedSignature.js').SignatureAlgorithm } | { signature: Uint8Array; algorithm: 'ed25519' }} value - Signature data
 * @returns {import('./BrandedSignature.js').BrandedSignature} Signature
 * @throws {InvalidSignatureFormatError} If value format is unsupported or invalid
 * @throws {InvalidSignatureLengthError} If signature length is invalid
 *
 * @example
 * ```typescript
 * // From compact bytes (64 bytes, defaults to secp256k1)
 * const sig1 = Signature.from(bytes64);
 *
 * // From object with r, s, v
 * const sig2 = Signature.from({ r, s, v: 27, algorithm: 'secp256k1' });
 *
 * // From Ed25519
 * const sig3 = Signature.from({ signature: bytes64, algorithm: 'ed25519' });
 * ```
 */
export function from(value) {
	// If it's already a BrandedSignature, return it
	if (
		value &&
		typeof value === "object" &&
		"__tag" in value &&
		value.__tag === "Signature"
	) {
		return /** @type {import('./BrandedSignature.js').BrandedSignature} */ (
			value
		);
	}

	// Handle Uint8Array (compact format)
	if (value instanceof Uint8Array) {
		if (value.length === ECDSA_SIZE || value.length === ED25519_SIZE) {
			// Default to secp256k1 for ambiguous 64-byte signatures
			return fromCompact(value, "secp256k1");
		}
		throw new InvalidSignatureFormatError(
			`Invalid signature length: ${value.length} bytes`,
			{
				value: value.length,
				expected: `${ECDSA_SIZE} or ${ED25519_SIZE} bytes`,
				docsPath: "/primitives/signature/from#error-handling",
			},
		);
	}

	// Handle object with r, s (ECDSA)
	if (value && typeof value === "object" && "r" in value && "s" in value) {
		const algorithm = value.algorithm || "secp256k1";
		if (algorithm === "secp256k1") {
			return fromSecp256k1(value.r, value.s, value.v);
		}
		if (algorithm === "p256") {
			return fromP256(value.r, value.s);
		}
		throw new InvalidSignatureFormatError(
			`Invalid algorithm for ECDSA signature: ${algorithm}`,
			{
				value: algorithm,
				expected: "secp256k1 or p256",
				docsPath: "/primitives/signature/from#error-handling",
			},
		);
	}

	// Handle object with signature (Ed25519)
	if (
		value &&
		typeof value === "object" &&
		"signature" in value &&
		value.algorithm === "ed25519"
	) {
		return fromEd25519(value.signature);
	}

	throw new InvalidSignatureFormatError("Unsupported signature value type", {
		value: typeof value,
		expected: "Uint8Array or signature object",
		docsPath: "/primitives/signature/from#error-handling",
	});
}
