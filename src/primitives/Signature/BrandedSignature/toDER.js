import { COMPONENT_SIZE } from "./constants.js";
import { InvalidAlgorithmError } from "./errors.js";

/**
 * Convert ECDSA signature to DER encoding
 *
 * @param {import('./BrandedSignature.js').BrandedSignature} signature - Signature to convert
 * @returns {Uint8Array} DER-encoded signature
 * @throws {InvalidAlgorithmError} If signature is not ECDSA (secp256k1 or p256)
 *
 * @example
 * ```typescript
 * const der = Signature.toDER(sig);
 * // Returns DER-encoded SEQUENCE of r and s integers
 * ```
 */
export function toDER(signature) {
	if (signature.algorithm !== "secp256k1" && signature.algorithm !== "p256") {
		throw new InvalidAlgorithmError(
			`DER encoding only supported for ECDSA signatures, got ${signature.algorithm}`,
		);
	}

	const r = signature.slice(0, COMPONENT_SIZE);
	const s = signature.slice(COMPONENT_SIZE, COMPONENT_SIZE * 2);

	// Encode integer as DER
	const encodeInteger = (/** @type {Uint8Array} */ value) => {
		// Remove leading zeros
		let i = 0;
		while (i < value.length && value[i] === 0) i++;

		// If high bit is set, prepend 0x00 to indicate positive number
		const needsPadding = (value[i] ?? 0) >= 0x80;
		const length = value.length - i + (needsPadding ? 1 : 0);

		const result = new Uint8Array(2 + length);
		result[0] = 0x02; // INTEGER tag
		result[1] = length;

		if (needsPadding) {
			result[2] = 0x00;
			result.set(value.slice(i), 3);
		} else {
			result.set(value.slice(i), 2);
		}

		return result;
	};

	const rDER = encodeInteger(r);
	const sDER = encodeInteger(s);

	// Create SEQUENCE
	const result = new Uint8Array(2 + rDER.length + sDER.length);
	result[0] = 0x30; // SEQUENCE tag
	result[1] = rDER.length + sDER.length;
	result.set(rDER, 2);
	result.set(sDER, 2 + rDER.length);

	return result;
}
