import { COMPONENT_SIZE, ECDSA_SIZE } from "./constants.js";
import { InvalidSignatureLengthError } from "./errors.js";

/**
 * Create Signature from secp256k1 ECDSA signature
 *
 * @param {Uint8Array} r - r component (32 bytes)
 * @param {Uint8Array} s - s component (32 bytes)
 * @param {number} [v] - Optional recovery ID (27 or 28 for Ethereum)
 * @returns {import('./SignatureType.js').SignatureType} Signature
 *
 * @example
 * ```typescript
 * const sig = Signature.fromSecp256k1(rBytes, sBytes, 27);
 * ```
 */
export function fromSecp256k1(r, s, v) {
	// Validate r and s lengths
	if (r.length !== COMPONENT_SIZE) {
		throw new InvalidSignatureLengthError(
			`Invalid r component length: expected ${COMPONENT_SIZE} bytes, got ${r.length}`,
			{
				value: r.length,
				expected: `${COMPONENT_SIZE} bytes`,
			},
		);
	}
	if (s.length !== COMPONENT_SIZE) {
		throw new InvalidSignatureLengthError(
			`Invalid s component length: expected ${COMPONENT_SIZE} bytes, got ${s.length}`,
			{
				value: s.length,
				expected: `${COMPONENT_SIZE} bytes`,
			},
		);
	}

	const result = new Uint8Array(ECDSA_SIZE);
	result.set(r, 0);
	result.set(s, COMPONENT_SIZE);

	// Add metadata (algorithm and optional v)
	if (v !== undefined) {
		Object.assign(result, { algorithm: "secp256k1", v });
	} else {
		Object.assign(result, { algorithm: "secp256k1" });
	}

	return /** @type {import('./SignatureType.js').SignatureType} */ (result);
}
