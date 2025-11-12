import { COMPONENT_SIZE, ECDSA_SIZE } from "./constants.js";
import { InvalidSignatureLengthError } from "./errors.js";

/**
 * Create Signature from secp256k1 ECDSA signature
 *
 * @param {import('../../Hash/index.js').BrandedHash} r - r component (32 bytes, BrandedHash)
 * @param {import('../../Hash/index.js').BrandedHash} s - s component (32 bytes, BrandedHash)
 * @param {number} [v] - Optional recovery ID (27 or 28 for Ethereum)
 * @returns {import('./BrandedSignature.js').BrandedSignature} Signature
 *
 * @example
 * ```typescript
 * import * as Hash from '../../Hash/index.js';
 * const r = Hash.from(rBytes);
 * const s = Hash.from(sBytes);
 * const sig = Signature.fromSecp256k1(r, s, 27);
 * ```
 */
export function fromSecp256k1(r, s, v) {
	const result = new Uint8Array(ECDSA_SIZE);
	result.set(r, 0);
	result.set(s, COMPONENT_SIZE);

	// Add metadata (algorithm and optional v)
	if (v !== undefined) {
		Object.assign(result, { algorithm: "secp256k1", v });
	} else {
		Object.assign(result, { algorithm: "secp256k1" });
	}

	return /** @type {import('./BrandedSignature.js').BrandedSignature} */ (
		result
	);
}
