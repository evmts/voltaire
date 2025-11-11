import * as G1 from "./G1/index.js";
import { Bn254Error } from "./errors.js";

/**
 * Deserialize G1 point from bytes
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - 64-byte serialization
 * @returns {import('./BrandedG1Point.js').BrandedG1Point} G1 point
 * @throws {Bn254Error} If bytes length is invalid (must be 64 bytes)
 * @example
 * ```javascript
 * import { deserializeG1 } from './crypto/bn254/deserializeG1.js';
 * const bytes = new Uint8Array(64);
 * const point = deserializeG1(bytes);
 * ```
 */
export function deserializeG1(bytes) {
	if (bytes.length !== 64) {
		throw new Bn254Error("Invalid G1 point serialization length", {
			code: "INVALID_LENGTH",
			context: { received: bytes.length, expected: 64, curve: "G1" },
			docsPath: "/crypto/bn254#serialization",
		});
	}

	const x = BigInt(`0x${bytesToHex(bytes.slice(0, 32))}`);
	const y = BigInt(`0x${bytesToHex(bytes.slice(32, 64))}`);

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
