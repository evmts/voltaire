import * as G2 from "./G2/index.js";

/**
 * Serialize G2 point to bytes (128 bytes: x.c0 || x.c1 || y.c0 || y.c1)
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('./BrandedG2Point.js').BrandedG2Point} point - G2 point
 * @returns {Uint8Array} 128-byte serialization
 * @throws {never}
 * @example
 * ```javascript
 * import { serializeG2 } from './crypto/bn254/serializeG2.js';
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const point = G2.generator();
 * const bytes = serializeG2(point);
 * ```
 */
export function serializeG2(point) {
	const affine = G2.toAffine(point);
	const result = new Uint8Array(128);

	const xc0Bytes = hexToBytes(affine.x.c0.toString(16).padStart(64, "0"));
	const xc1Bytes = hexToBytes(affine.x.c1.toString(16).padStart(64, "0"));
	const yc0Bytes = hexToBytes(affine.y.c0.toString(16).padStart(64, "0"));
	const yc1Bytes = hexToBytes(affine.y.c1.toString(16).padStart(64, "0"));

	result.set(xc0Bytes, 0);
	result.set(xc1Bytes, 32);
	result.set(yc0Bytes, 64);
	result.set(yc1Bytes, 96);

	return result;
}

/**
 * @param {string} hex
 * @returns {Uint8Array}
 */
function hexToBytes(hex) {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
	}
	return bytes;
}
