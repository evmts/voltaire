import { ED25519_SIZE } from "./constants.js";
import { InvalidSignatureLengthError } from "./errors.js";

/**
 * Create Signature from Ed25519 signature
 *
 * @param {Uint8Array} signature - Ed25519 signature (64 bytes)
 * @returns {import('./BrandedSignature.js').BrandedSignature} Signature
 * @throws {InvalidSignatureLengthError} If signature is not 64 bytes
 *
 * @example
 * ```typescript
 * const sig = Signature.fromEd25519(signature);
 * ```
 */
export function fromEd25519(signature) {
	if (signature.length !== ED25519_SIZE) {
		throw new InvalidSignatureLengthError(
			`Ed25519 signature must be ${ED25519_SIZE} bytes, got ${signature.length}`,
			{
				value: signature.length,
				expected: `${ED25519_SIZE} bytes`,
				docsPath: "/primitives/signature/from-ed25519#error-handling",
			},
		);
	}

	const result = new Uint8Array(signature);

	// Add metadata (algorithm)
	Object.assign(result, { algorithm: "ed25519" });

	return /** @type {import('./BrandedSignature.js').BrandedSignature} */ (
		result
	);
}
