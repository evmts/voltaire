import { InvalidAlgorithmError, InvalidSignatureFormatError } from "./errors.js";
import { getR } from "./getR.js";
import { getS } from "./getS.js";
import { getV } from "./getV.js";

/**
 * Convert Signature to tuple format [yParity, r, s] for transaction envelopes
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to convert
 * @returns {[number, Uint8Array, Uint8Array]} Tuple [yParity, r, s]
 * @throws {InvalidAlgorithmError} If signature is not secp256k1
 * @throws {InvalidSignatureFormatError} If signature has no v value
 *
 * @example
 * ```javascript
 * import * as Signature from './primitives/Signature/index.js';
 * const sig = Signature.fromSecp256k1(r, s, 27);
 * const [yParity, r, s] = Signature.toTuple(sig);
 * ```
 */
export function toTuple(signature) {
	if (signature.algorithm !== "secp256k1") {
		throw new InvalidAlgorithmError("toTuple only supports secp256k1 signatures", {
			value: signature.algorithm,
			expected: "secp256k1",
			code: "UNSUPPORTED_ALGORITHM_FOR_TUPLE",
		});
	}

	const r = getR(signature);
	const s = getS(signature);
	const v = getV(signature);

	if (v === undefined) {
		throw new InvalidSignatureFormatError("Signature must have v value for tuple conversion", {
			value: signature,
			expected: "secp256k1 signature with v value",
			code: "MISSING_V_VALUE",
		});
	}

	// Calculate yParity from v
	let yParity;
	if (v === 27 || v === 28) {
		yParity = v - 27;
	} else if (v >= 35) {
		// EIP-155: v = chainId * 2 + 35 + yParity
		yParity = (v - 35) % 2;
	} else {
		yParity = v;
	}

	return [yParity, r, s];
}
