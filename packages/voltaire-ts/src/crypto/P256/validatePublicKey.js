import { p256 } from "@noble/curves/nist.js";
import { CURVE_B, FIELD_PRIME, PUBLIC_KEY_SIZE } from "./constants.js";

const COORDINATE_SIZE = 32;
const SEC1_UNCOMPRESSED_SIZE = 65;
const SEC1_COMPRESSED_SIZE = 33;

/**
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @returns {bigint}
 */
function readCoordinate(bytes, offset) {
	let value = 0n;
	for (let i = 0; i < COORDINATE_SIZE; i++) {
		value = (value << 8n) | BigInt(/** @type {number} */ (bytes[offset + i]));
	}
	return value;
}

/**
 * Check affine coordinates per SEC 1 v2 section 3.2.2.1 / NIST SP 800-56A
 * section 5.6.2.3.3 (full public-key validation). P-256 has cofactor 1, so an
 * on-curve point other than infinity is always in the prime-order group.
 *
 * @param {bigint} x
 * @param {bigint} y
 * @returns {boolean}
 */
function isValidAffinePoint(x, y) {
	// Coordinates must be canonical field elements
	if (x >= FIELD_PRIME || y >= FIELD_PRIME) {
		return false;
	}
	// (0, 0) is the conventional encoding of the point at infinity
	if (x === 0n && y === 0n) {
		return false;
	}
	// y^2 = x^3 - 3x + b (mod p)
	const lhs = (y * y) % FIELD_PRIME;
	const rhs =
		(((x * x) % FIELD_PRIME) * x + (FIELD_PRIME - 3n) * x + CURVE_B) %
		FIELD_PRIME;
	return lhs === rhs;
}

/**
 * Validate a P256 public key
 *
 * Accepted encodings:
 * - 64 bytes: raw `x || y` (the library's native format)
 * - 65 bytes: SEC1 uncompressed `0x04 || x || y`
 * - 33 bytes: SEC1 compressed `0x02 | 0x03 || x`
 *
 * Rejects:
 * - any other length or SEC1 prefix (including hybrid `0x06`/`0x07` and the
 *   `0x00` infinity encoding)
 * - the point at infinity `(0, 0)`
 * - non-canonical coordinates `x >= p` or `y >= p`
 * - points that do not satisfy `y^2 = x^3 - 3x + b (mod p)`
 *
 * Accepting an off-curve point in ECDH enables invalid-curve attacks that
 * recover the private key, so every ECDH and verify path runs this check.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./P256PublicKeyType.js').P256PublicKeyType | Uint8Array} publicKey - Public key to validate
 * @returns {boolean} True if the key encodes a valid curve point, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as P256 from './crypto/P256/index.js';
 * const publicKey = new Uint8Array(64);
 * const isValid = P256.validatePublicKey(publicKey); // false: point at infinity
 * ```
 */
export function validatePublicKey(publicKey) {
	if (!(publicKey instanceof Uint8Array)) {
		return false;
	}

	if (publicKey.length === PUBLIC_KEY_SIZE) {
		return isValidAffinePoint(
			readCoordinate(publicKey, 0),
			readCoordinate(publicKey, COORDINATE_SIZE),
		);
	}

	if (publicKey.length === SEC1_UNCOMPRESSED_SIZE) {
		if (publicKey[0] !== 0x04) {
			return false;
		}
		return isValidAffinePoint(
			readCoordinate(publicKey, 1),
			readCoordinate(publicKey, 1 + COORDINATE_SIZE),
		);
	}

	if (publicKey.length === SEC1_COMPRESSED_SIZE) {
		if (publicKey[0] !== 0x02 && publicKey[0] !== 0x03) {
			return false;
		}
		if (readCoordinate(publicKey, 1) >= FIELD_PRIME) {
			return false;
		}
		try {
			// Decompression fails when x^3 - 3x + b is not a square mod p
			const point = p256.Point.fromBytes(publicKey).toAffine();
			return isValidAffinePoint(point.x, point.y);
		} catch {
			return false;
		}
	}

	return false;
}
