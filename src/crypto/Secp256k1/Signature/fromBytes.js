// @ts-nocheck
import { InvalidSignatureError } from "../errors.js";

/**
 * Create signature from bytes with v appended (65 bytes: r || s || v)
 *
 * @param {Uint8Array} bytes - 65-byte signature
 * @returns {import('../BrandedSignature.js').BrandedSignature} ECDSA signature
 * @throws {InvalidSignatureError} If bytes is wrong length
 *
 * @example
 * ```typescript
 * const signature = Signature.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== 65) {
		throw new InvalidSignatureError(
			`Signature must be 65 bytes, got ${bytes.length}`,
		);
	}

	return {
		r: bytes.slice(0, 32),
		s: bytes.slice(32, 64),
		v: bytes[64] ?? 0,
	};
}
