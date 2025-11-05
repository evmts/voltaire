import * as Fp2 from "./Fp2/index.js";
import * as G2 from "./G2/index.js";
import { Bn254Error } from "./errors.js";

/**
 * Deserialize G2 point from bytes
 *
 * @param {Uint8Array} bytes - 128-byte serialization
 * @returns {import('./BrandedG2Point.js').BrandedG2Point} G2 point
 * @throws {Bn254Error} If bytes length is invalid
 *
 * @example
 * ```typescript
 * const point = deserializeG2(bytes);
 * ```
 */
export function deserializeG2(bytes) {
	if (bytes.length !== 128) {
		throw new Bn254Error("Invalid G2 point serialization");
	}

	const xc0 = BigInt("0x" + bytesToHex(bytes.slice(0, 32)));
	const xc1 = BigInt("0x" + bytesToHex(bytes.slice(32, 64)));
	const yc0 = BigInt("0x" + bytesToHex(bytes.slice(64, 96)));
	const yc1 = BigInt("0x" + bytesToHex(bytes.slice(96, 128)));

	if (xc0 === 0n && xc1 === 0n && yc0 === 0n && yc1 === 0n) {
		return G2.infinity();
	}

	const x = Fp2.create(xc0, xc1);
	const y = Fp2.create(yc0, yc1);

	return G2.fromAffine(x, y);
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
