import * as G1 from "./G1/index.js";

/**
 * Serialize G1 point to bytes (64 bytes: x || y)
 *
 * @param {import('./BrandedG1Point.js').BrandedG1Point} point - G1 point
 * @returns {Uint8Array} 64-byte serialization
 *
 * @example
 * ```typescript
 * const bytes = serializeG1(point);
 * ```
 */
export function serializeG1(point) {
	const affine = G1.toAffine(point);
	const result = new Uint8Array(64);

	const xBytes = hexToBytes(affine.x.toString(16).padStart(64, "0"));
	const yBytes = hexToBytes(affine.y.toString(16).padStart(64, "0"));

	result.set(xBytes, 0);
	result.set(yBytes, 32);

	return result;
}

function hexToBytes(hex) {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
	}
	return bytes;
}
