import { InvalidSignatureLengthError } from "./errors.js";
import { ECDSA_SIZE, COMPONENT_SIZE } from "./constants.js";

/**
 * Create Signature from secp256k1 ECDSA signature
 *
 * @param {Uint8Array} r - r component (32 bytes)
 * @param {Uint8Array} s - s component (32 bytes)
 * @param {number} [v] - Optional recovery ID (27 or 28 for Ethereum)
 * @returns {import('./BrandedSignature.js').BrandedSignature} Signature
 * @throws {InvalidSignatureLengthError} If r or s is not 32 bytes
 *
 * @example
 * ```typescript
 * const sig = Signature.fromSecp256k1(r, s, 27);
 * ```
 */
export function fromSecp256k1(r, s, v) {
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
			value: "secp256k1",
			writable: false,
			enumerable: true,
			configurable: false,
		},
		v: {
			value: v,
			writable: false,
			enumerable: v !== undefined,
			configurable: false,
		},
	});

	return /** @type {import('./BrandedSignature.js').BrandedSignature} */ (
		result
	);
}
