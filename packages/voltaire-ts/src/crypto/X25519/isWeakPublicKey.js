import { PUBLIC_KEY_SIZE } from "./constants.js";

/** Curve25519 field prime p = 2^255 - 19 */
const FIELD_PRIME = (1n << 255n) - 19n;

/**
 * The u-coordinates of every point of order 2, 4, or 8 on Curve25519 and on
 * its quadratic twist (8 * P is the point at infinity for each). X25519 with any of these as the peer public key
 * yields the all-zero shared secret for every (clamped) secret key.
 *
 * @see https://cr.yp.to/ecdh.html#validate
 */
const LOW_ORDER_U = [
	// u = 0: order 2
	0n,
	// u = 1: order 4
	1n,
	// order 8
	0x00b8495f16056286fdb1329ceb8d09da6ac49ff1fae35616aeb8413b7c7aebe0n,
	// order 8
	0x57119fd0dd4e22d8868e1c58c45c44045bef839c55b1d0b1248c50a3bc959c5fn,
	// u = p - 1: order 4 (on the twist)
	FIELD_PRIME - 1n,
];

/**
 * Check whether an X25519 public key is a known weak (low-order) point
 *
 * The key is decoded exactly as RFC 7748 section 5 prescribes (little-endian,
 * bit 255 masked, reduced mod p) and compared against the five low-order
 * u-coordinates. Decoding first means every alias is caught as well: the
 * non-canonical encodings `p` (= 0) and `p + 1` (= 1), and all seven byte
 * strings again with bit 255 set (14 encodings in total).
 *
 * Public keys are public, so this comparison does not need to be
 * constant-time.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @see https://www.rfc-editor.org/rfc/rfc7748#section-6.1
 * @since 0.0.0
 * @param {import('./PublicKey.js').PublicKey} publicKey - 32-byte public key
 * @returns {boolean} True if the key is a low-order point. False for keys of any other length.
 * @throws {never}
 * @example
 * ```javascript
 * import { X25519 } from './crypto/X25519/index.js';
 * X25519.isWeakPublicKey(new Uint8Array(32)); // true
 * ```
 */
export function isWeakPublicKey(publicKey) {
	if (!(publicKey instanceof Uint8Array)) {
		return false;
	}
	if (publicKey.length !== PUBLIC_KEY_SIZE) {
		return false;
	}

	let u = 0n;
	for (let i = PUBLIC_KEY_SIZE - 1; i >= 0; i--) {
		u = (u << 8n) | BigInt(/** @type {number} */ (publicKey[i]));
	}
	u &= (1n << 255n) - 1n;
	u %= FIELD_PRIME;

	return LOW_ORDER_U.includes(u);
}
