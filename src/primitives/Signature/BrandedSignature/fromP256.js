import { COMPONENT_SIZE, ECDSA_SIZE } from "./constants.js";
import { InvalidSignatureLengthError } from "./errors.js";

/**
 * Create Signature from P-256 ECDSA signature
 *
 * @param {Uint8Array} r - r component (32 bytes)
 * @param {Uint8Array} s - s component (32 bytes)
 * @returns {import('./BrandedSignature.js').BrandedSignature} Signature
 * @throws {InvalidSignatureLengthError} If r or s is not 32 bytes
 *
 * @example
 * ```typescript
 * const sig = Signature.fromP256(r, s);
 * ```
 */
export function fromP256(r, s) {
	if (r.length !== COMPONENT_SIZE) {
		throw new InvalidSignatureLengthError(
			`r must be ${COMPONENT_SIZE} bytes, got ${r.length}`,
		);
	}
	if (s.length !== COMPONENT_SIZE) {
		throw new InvalidSignatureLengthError(
			`s must be ${COMPONENT_SIZE} bytes, got ${s.length}`,
		);
	}

	const result = new Uint8Array(ECDSA_SIZE);
	result.set(r, 0);
	result.set(s, COMPONENT_SIZE);

	// Add metadata
	Object.defineProperties(result, {
		__tag: {
			value: "Signature",
			writable: false,
			enumerable: false,
			configurable: false,
		},
		algorithm: {
			value: "p256",
			writable: false,
			enumerable: true,
			configurable: false,
		},
	});

	return /** @type {import('./BrandedSignature.js').BrandedSignature} */ (
		result
	);
}
