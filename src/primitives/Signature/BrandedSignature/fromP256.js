import { COMPONENT_SIZE, ECDSA_SIZE } from "./constants.js";
import { InvalidSignatureLengthError } from "./errors.js";

/**
 * Create Signature from P-256 ECDSA signature
 *
 * @param {import('../../Hash/index.js').BrandedHash} r - r component (32 bytes, BrandedHash)
 * @param {import('../../Hash/index.js').BrandedHash} s - s component (32 bytes, BrandedHash)
 * @returns {import('./BrandedSignature.js').BrandedSignature} Signature
 *
 * @example
 * ```typescript
 * import * as Hash from '../../Hash/index.js';
 * const r = Hash.from(rBytes);
 * const s = Hash.from(sBytes);
 * const sig = Signature.fromP256(r, s);
 * ```
 */
export function fromP256(r, s) {
	const result = new Uint8Array(ECDSA_SIZE);
	result.set(r, 0);
	result.set(s, COMPONENT_SIZE);

	// Add metadata (algorithm)
	Object.assign(result, { algorithm: "p256" });

	return /** @type {import('./BrandedSignature.js').BrandedSignature} */ (
		result
	);
}
