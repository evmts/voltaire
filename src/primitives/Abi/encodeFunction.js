import * as Hex from "../Hex/index.js";
import { AbiItemNotFoundError } from "./Errors.js";
import * as Function from "./function/index.js";

/**
 * Encode function call data from ABI by function name
 *
 * @param {import('./Abi.js').Abi} abi - Full ABI array
 * @param {string} functionName - Function name to encode
 * @param {readonly unknown[]} args - Function arguments
 * @returns {import('../Hex/index.js').Hex} Encoded function call data (hex string)
 *
 * @example
 * ```typescript
 * const abi = [
 *   {
 *     type: "function",
 *     name: "transfer",
 *     inputs: [
 *       { type: "address", name: "to" },
 *       { type: "uint256", name: "amount" }
 *     ]
 *   }
 * ];
 * const encoded = Abi.encodeFunction(abi, "transfer", [
 *   "0x742d35cc6634c0532925a3b844bc9e7595f251e3",
 *   100n
 * ]);
 * ```
 */
export function encodeFunction(abi, functionName, args) {
	const item = abi.find((item) => {
		if (item.type !== "function") return false;
		const fn = /** @type {import('./function/index.js').Function} */ (item);
		return fn.name === functionName;
	});

	if (!item || item.type !== "function") {
		throw new AbiItemNotFoundError(
			`Function "${functionName}" not found in ABI`,
		);
	}

	// Type assertion after guard
	const fn = /** @type {import('./function/index.js').Function} */ (item);
	const encoded = Function.encodeParams(fn, args);
	return Hex.fromBytes(encoded);
}
