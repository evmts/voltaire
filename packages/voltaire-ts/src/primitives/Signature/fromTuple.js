import { InvalidSignatureFormatError } from "./errors.js";
import { fromSecp256k1 } from "./fromSecp256k1.js";

/**
 * Create Signature from tuple format [yParity, r, s]
 *
 * @param {[number, Uint8Array, Uint8Array]} tuple - Tuple [yParity, r, s]
 * @param {number} [chainId] - Optional chain ID for EIP-155 v encoding
 * @returns {import('./SignatureType.js').SignatureType} Signature
 *
 * @example
 * ```javascript
 * import * as Signature from './primitives/Signature/index.js';
 * const sig = Signature.fromTuple([0, r, s]);
 * // With chain ID for EIP-155
 * const sig155 = Signature.fromTuple([0, r, s], 1);
 * ```
 */
export function fromTuple(tuple, chainId) {
	if (!Array.isArray(tuple) || tuple.length !== 3) {
		throw new InvalidSignatureFormatError(
			"Signature tuple must be [yParity, r, s]",
			{ value: tuple, expected: "3-element tuple [yParity, r, s]" },
		);
	}
	const [yParity, r, s] = tuple;
	if (!Number.isInteger(yParity)) {
		throw new InvalidSignatureFormatError(`Invalid yParity: ${yParity}`, {
			value: yParity,
			expected: "integer yParity (0 or 1)",
		});
	}
	if (chainId !== undefined && (!Number.isInteger(chainId) || chainId < 0)) {
		throw new InvalidSignatureFormatError(`Invalid chainId: ${chainId}`, {
			value: chainId,
			expected: "non-negative integer chainId",
		});
	}

	// Calculate v from yParity and optional chainId
	let v;
	if (chainId !== undefined) {
		// EIP-155: v = chainId * 2 + 35 + yParity
		v = chainId * 2 + 35 + yParity;
	} else {
		// Legacy: v = 27 + yParity
		v = 27 + yParity;
	}

	return fromSecp256k1(r, s, v);
}
