// @ts-nocheck
import { InvalidSignatureError } from "../errors.js";

/**
 * Create signature from compact format (64 bytes: r || s)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} compact - 64-byte compact signature
 * @param {number} v - Recovery id (0, 1, 27, or 28)
 * @returns {import('../BrandedSignature.js').BrandedSignature} ECDSA signature
 * @throws {InvalidSignatureError} If compact data is wrong length
 * @example
 * ```javascript
 * import { Secp256k1 } from './crypto/Secp256k1/index.js';
 * const compact = new Uint8Array(64);
 * const signature = Secp256k1.Signature.fromCompact(compact, 27);
 * ```
 */
export function fromCompact(compact, v) {
	if (compact.length !== 64) {
		throw new InvalidSignatureError(
			`Compact signature must be 64 bytes, got ${compact.length}`,
		);
	}

	return {
		r: compact.slice(0, 32),
		s: compact.slice(32, 64),
		v,
	};
}
