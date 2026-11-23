import { encodeHexDigits } from "../../primitives/Hex/encodeHexDigits.js";
import { FP_MOD } from "./constants.js";
import { Bn254Error, Bn254InvalidPointError } from "./errors.js";
import * as G1 from "./G1/index.js";

/**
 * Deserialize G1 point from bytes
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - 64-byte serialization
 * @returns {import('./G1PointType.js').G1PointType} G1 point
 * @throws {Bn254Error} If bytes length is invalid (must be 64 bytes)
 * @throws {Bn254InvalidPointError} If a coordinate is >= the field modulus or the point is not on the curve
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

	if (x >= FP_MOD || y >= FP_MOD) {
		throw new Bn254InvalidPointError(
			"G1 coordinate is not a canonical field element (>= field modulus)",
			{
				code: -32602,
				context: { x: x.toString(16), y: y.toString(16), curve: "G1" },
				docsPath: "/crypto/bn254#serialization",
			},
		);
	}

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
	return encodeHexDigits(bytes);
}
