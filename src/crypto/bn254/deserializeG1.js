import * as G1 from "./G1/index.js";
import { Bn254Error } from "./errors.js";

/**
 * Deserialize G1 point from bytes
 *
 * @param {Uint8Array} bytes - 64-byte serialization
 * @returns {import('./BrandedG1Point.js').BrandedG1Point} G1 point
 * @throws {Bn254Error} If bytes length is invalid
 *
 * @example
 * ```typescript
 * const point = deserializeG1(bytes);
 * ```
 */
export function deserializeG1(bytes) {
	if (bytes.length !== 64) {
		throw new Bn254Error("Invalid G1 point serialization");
	}

	const x = BigInt("0x" + bytesToHex(bytes.slice(0, 32)));
	const y = BigInt("0x" + bytesToHex(bytes.slice(32, 64)));

	if (x === 0n && y === 0n) {
		return G1.infinity();
	}

	return G1.fromAffine(x, y);
}

/**
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToHex(bytes) {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}
