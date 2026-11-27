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
	// Validate r and s are Uint8Arrays of length 32
	if (!(r instanceof Uint8Array) || r.length !== COMPONENT_SIZE) {
		throw new InvalidSignatureLengthError(
			`Invalid r component length: expected ${COMPONENT_SIZE} bytes, got ${r instanceof Uint8Array ? r.length : typeof r}`,
			{
				value: r instanceof Uint8Array ? r.length : r,
				expected: `${COMPONENT_SIZE} bytes`,
			},
		);
	}
	if (!(s instanceof Uint8Array) || s.length !== COMPONENT_SIZE) {
		throw new InvalidSignatureLengthError(
			`Invalid s component length: expected ${COMPONENT_SIZE} bytes, got ${s instanceof Uint8Array ? s.length : typeof s}`,
			{
				value: s instanceof Uint8Array ? s.length : s,
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
