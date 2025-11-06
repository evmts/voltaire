import { fromSecp256k1 } from "./fromSecp256k1.js";
import { fromP256 } from "./fromP256.js";
import { isCanonical } from "./isCanonical.js";
import { COMPONENT_SIZE } from "./constants.js";

/**
 * Normalize ECDSA signature to canonical form (s = n - s if s > n/2)
 *
 * @param {import('./BrandedSignature.js').BrandedSignature} signature - Signature to normalize
 * @returns {import('./BrandedSignature.js').BrandedSignature} Normalized signature
 *
 * @example
 * ```typescript
 * const normalized = Signature.normalize(sig);
 * ```
 */
export function normalize(signature) {
	// Ed25519 signatures are always canonical
	if (signature.algorithm === "ed25519") {
		return signature;
	}

	// If already canonical, return as-is
	if (isCanonical(signature)) {
		return signature;
	}

	// Extract r and s
	const r = signature.slice(0, COMPONENT_SIZE);
	const s = signature.slice(COMPONENT_SIZE, COMPONENT_SIZE * 2);

	// Get curve order
	const curveOrder =
		signature.algorithm === "secp256k1"
			? // secp256k1 curve order
				new Uint8Array([
					0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
					0xff, 0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48,
					0xa0, 0x3b, 0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
				])
			: // P-256 curve order
				new Uint8Array([
					0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff,
					0xff, 0xff, 0xff, 0xff, 0xff, 0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17,
					0x9e, 0x84, 0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x51,
				]);

	// Calculate s_normalized = n - s
	const sNormalized = new Uint8Array(COMPONENT_SIZE);
	let borrow = 0;

	for (let i = COMPONENT_SIZE - 1; i >= 0; i--) {
		const diff = (curveOrder[i] ?? 0) - (s[i] ?? 0) - borrow;
		sNormalized[i] = diff & 0xff;
		borrow = diff < 0 ? 1 : 0;
	}

	// Return new signature with normalized s
	if (signature.algorithm === "secp256k1") {
		// Flip v if present (27 <-> 28)
		const v =
			signature.v !== undefined ? (signature.v === 27 ? 28 : 27) : undefined;
		return fromSecp256k1(r, sNormalized, v);
	}

	return fromP256(r, sNormalized);
}
