// @ts-nocheck
import { CURVE_ORDER, SIGNATURE_COMPONENT_SIZE } from "./constants.js";

/**
 * Convert 32-byte big-endian array to bigint
 * @param {Uint8Array} bytes
 * @returns {bigint}
 */
function bytes32ToBigInt(bytes) {
	if (bytes.length !== 32) {
		throw new Error(`Expected 32 bytes, got ${bytes.length}`);
	}
	let result = 0n;
	for (let i = 0; i < 32; i++) {
		result = (result << 8n) | BigInt(bytes[i] ?? 0);
	}
	return result;
}

/**
 * Validate signature components
 *
 * Checks that r and s are within valid range [1, n-1] where n is the
 * curve order. Also enforces low-s values to prevent malleability.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedSignature.js').BrandedSignature} signature - ECDSA signature to validate
 * @returns {boolean} true if signature is valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * const signature = { r: new Uint8Array(32), s: new Uint8Array(32), v: 27 };
 * const valid = Secp256k1.isValidSignature(signature);
 * ```
 */
export function isValidSignature(signature) {
	if (signature.r.length !== SIGNATURE_COMPONENT_SIZE) return false;
	if (signature.s.length !== SIGNATURE_COMPONENT_SIZE) return false;

	try {
		const r = bytes32ToBigInt(signature.r);
		const s = bytes32ToBigInt(signature.s);

		// r and s must be in [1, n-1]
		if (r === 0n || r >= CURVE_ORDER) return false;
		if (s === 0n || s >= CURVE_ORDER) return false;

		// Ethereum enforces s <= n/2 to prevent malleability
		const halfN = CURVE_ORDER / 2n;
		if (s > halfN) return false;

		// v must be 0, 1, 27, or 28
		if (
			signature.v !== 0 &&
			signature.v !== 1 &&
			signature.v !== 27 &&
			signature.v !== 28
		) {
			return false;
		}

		return true;
	} catch {
		return false;
	}
}
