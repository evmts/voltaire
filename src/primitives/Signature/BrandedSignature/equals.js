/**
 * Check if two signatures are equal
 *
 * @param {import('./BrandedSignature.js').BrandedSignature} a - First signature
 * @param {import('./BrandedSignature.js').BrandedSignature} b - Second signature
 * @returns {boolean} True if signatures are equal
 *
 * @example
 * ```typescript
 * const isEqual = Signature.equals(sig1, sig2);
 * ```
 */
export function equals(a, b) {
	// Check algorithm match
	if (a.algorithm !== b.algorithm) {
		return false;
	}

	// Check v for secp256k1
	if (a.algorithm === "secp256k1" && a.v !== b.v) {
		return false;
	}

	// Check bytes
	if (a.length !== b.length) {
		return false;
	}

	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}

	return true;
}
