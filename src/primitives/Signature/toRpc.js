import { InvalidAlgorithmError } from "./errors.js";
import { getR } from "./getR.js";
import { getS } from "./getS.js";
import { getV } from "./getV.js";

/**
 * Convert Signature to RPC format (r, s, yParity as hex strings)
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to convert
 * @returns {{ r: string, s: string, yParity: string, v?: string }} RPC format signature
 * @throws {InvalidAlgorithmError} If signature is not secp256k1
 *
 * @example
 * ```javascript
 * import * as Signature from './primitives/Signature/index.js';
 * const sig = Signature.fromSecp256k1(r, s, 27);
 * const rpc = Signature.toRpc(sig);
 * // { r: '0x...', s: '0x...', yParity: '0x0', v: '0x1b' }
 * ```
 */
export function toRpc(signature) {
	if (signature.algorithm !== "secp256k1") {
		throw new InvalidAlgorithmError("toRpc only supports secp256k1 signatures", {
			value: signature.algorithm,
			expected: "secp256k1",
			code: "UNSUPPORTED_ALGORITHM_FOR_RPC",
		});
	}

	const r = getR(signature);
	const s = getS(signature);
	const v = getV(signature);

	// Convert r to hex
	const rHex = `0x${Array.from(r)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;

	// Convert s to hex
	const sHex = `0x${Array.from(s)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;

	// Calculate yParity from v
	let yParity;
	const vv = /** @type {number} */ (v ?? 0);
	if (vv === 27 || vv === 28) {
		yParity = vv - 27;
	} else if (vv >= 35) {
		// EIP-155: v = chainId * 2 + 35 + yParity
		yParity = (vv - 35) % 2;
	} else {
		yParity = vv;
	}

	const result =
		/** @type {{ r: string, s: string, yParity: string, v?: string }} */ ({
			r: rHex,
			s: sHex,
			yParity: `0x${yParity.toString(16)}`,
		});

	// Include v if it was set
	if (v !== undefined) {
		result.v = `0x${(/** @type {number} */ (v)).toString(16)}`;
	}

	return result;
}
