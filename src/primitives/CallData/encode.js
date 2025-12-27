import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { encodeParameters } from "../Abi/Encoding.js";
import { fromBytes } from "./fromBytes.js";

/**
 * Encode function call into CallData
 *
 * @param {string} signature - Function signature (e.g., "transfer(address,uint256)")
 * @param {unknown[]} params - Array of parameter values
 * @returns {import('./CallDataType.js').CallDataType} Encoded calldata
 *
 * @example
 * ```javascript
 * const calldata = CallData.encode(
 *   "transfer(address,uint256)",
 *   ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "1000000000000000000"]
 * );
 * ```
 */
export function encode(signature, params) {
	// Compute function selector (first 4 bytes of keccak256 hash of signature)
	const encoder = new TextEncoder();
	const signatureBytes = encoder.encode(signature);
	const hash = keccak256(signatureBytes);
	const selector = hash.slice(0, 4);

	// Parse the signature to extract types
	const match = signature.match(/^\w+\(([^)]*)\)$/);
	if (!match) {
		throw new Error(`Invalid function signature: ${signature}`);
	}

	const typesStr = match[1];
	const types = typesStr ? typesStr.split(",").map((t) => t.trim()) : [];

	if (types.length !== params.length) {
		throw new Error(
			`Parameter count mismatch: signature has ${types.length} parameters, got ${params.length}`,
		);
	}

	// If no params, return just the selector
	if (params.length === 0) {
		return fromBytes(new Uint8Array(selector));
	}

	// Convert types to parameter objects for encodeParameters
	const parameterObjects = types.map((type) => ({ type, name: "" }));

	// Encode parameters using ABI encoding
	const encodedParams = encodeParameters(
		/** @type {any} */ (parameterObjects),
		/** @type {any} */ (params),
	);

	// Combine selector + encoded params
	const result = new Uint8Array(4 + encodedParams.length);
	result.set(selector, 0);
	result.set(encodedParams, 4);

	return fromBytes(result);
}
