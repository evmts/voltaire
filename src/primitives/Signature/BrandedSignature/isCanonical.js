import { COMPONENT_SIZE } from "./constants.js";

/**
 * Check if ECDSA signature has canonical s-value (s <= n/2)
 *
 * For secp256k1 and p256, a signature is canonical if s <= curve_order / 2
 * This prevents signature malleability.
 *
 * @param {import('./BrandedSignature.js').BrandedSignature} signature - Signature to check
 * @returns {boolean} True if signature is canonical or Ed25519
 *
 * @example
 * ```typescript
 * if (!Signature.isCanonical(sig)) {
 *   sig = Signature.normalize(sig);
 * }
 * ```
 */
export function isCanonical(signature) {
	// Ed25519 signatures are always canonical
	if (signature.algorithm === "ed25519") {
		return true;
	}

	// For ECDSA, check if s <= curve_order / 2
	const s = signature.slice(COMPONENT_SIZE, COMPONENT_SIZE * 2);

	// secp256k1 curve order / 2
	const SECP256K1_N_DIV_2 = new Uint8Array([
		0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
		0xff, 0xff, 0xff, 0xff, 0x5d, 0x57, 0x6e, 0x73, 0x57, 0xa4, 0x50, 0x1d,
		0xdf, 0xe9, 0x2f, 0x46, 0x68, 0x1b, 0x20, 0xa0,
	]);

	// P-256 curve order / 2
	const P256_N_DIV_2 = new Uint8Array([
		0x7f, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x7f, 0xff, 0xff, 0xff,
		0xff, 0xff, 0xff, 0xff, 0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17, 0x9e, 0x84,
		0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x51,
	]);

	const threshold =
		signature.algorithm === "secp256k1" ? SECP256K1_N_DIV_2 : P256_N_DIV_2;

	// Compare s with threshold
	for (let i = 0; i < COMPONENT_SIZE; i++) {
		if (s[i] < threshold[i]) return true;
		if (s[i] > threshold[i]) return false;
	}

	return true; // Equal to threshold is also canonical
}
