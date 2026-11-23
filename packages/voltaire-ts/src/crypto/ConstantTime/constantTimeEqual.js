/**
 * Compare two byte arrays in constant time.
 *
 * The running time depends only on the lengths of the inputs, never on their
 * contents or on the position of the first differing byte. Use it for every
 * comparison that involves secret material: MACs, HMAC tags, AEAD tags,
 * private keys, shared secrets, password hashes.
 *
 * A length mismatch returns `false` immediately. Lengths are public for the
 * fixed-size values this function is meant for.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} a - First byte array
 * @param {Uint8Array} b - Second byte array
 * @returns {boolean} True if both arrays have the same length and contents
 * @throws {never}
 * @example
 * ```javascript
 * import { constantTimeEqual } from './crypto/ConstantTime/index.js';
 * if (!constantTimeEqual(computedMac, expectedMac)) throw new Error('bad MAC');
 * ```
 */
export function constantTimeEqual(a, b) {
	if (
		!(a instanceof Uint8Array) ||
		!(b instanceof Uint8Array) ||
		a.length !== b.length
	) {
		return false;
	}

	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= /** @type {number} */ (a[i]) ^ /** @type {number} */ (b[i]);
	}

	return diff === 0;
}
