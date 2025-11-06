import { InvalidSignatureLengthError } from "./errors.js";
import { ED25519_SIZE } from "./constants.js";

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
		);
	}

	const result = new Uint8Array(signature);

	// Add metadata
	Object.defineProperties(result, {
		__tag: {
			value: "Signature",
			writable: false,
			enumerable: false,
			configurable: false,
		},
		algorithm: {
			value: "ed25519",
			writable: false,
			enumerable: true,
			configurable: false,
		},
	});

	return /** @type {import('./BrandedSignature.js').BrandedSignature} */ (
		result
	);
}
