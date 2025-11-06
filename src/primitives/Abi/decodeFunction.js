import * as Hex from "../Hex/index.js";
import { AbiInvalidSelectorError, AbiItemNotFoundError } from "./Errors.js";
import * as Function from "./function/index.js";

/**
 * Decode function call data using ABI
 *
 * @param {import('./Abi.js').Abi} abi - Full ABI array
 * @param {import('../Hex/index.js').Hex | Uint8Array} data - Encoded function call data
 * @returns {{ name: string, params: readonly unknown[] }} Decoded function name and parameters
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
 * const decoded = Abi.decodeFunction(abi, "0xa9059cbb...");
 * // { name: "transfer", params: ["0x742d35...", 100n] }
 * ```
 */
export function decodeFunction(abi, data) {
	const bytes = typeof data === "string" ? Hex.toBytes(data) : data;

	if (bytes.length < 4) {
		throw new AbiInvalidSelectorError("Data too short to contain selector");
	}

	const selector = bytes.slice(0, 4);

	// Find function by selector
	const item = abi.find((item) => {
		if (item.type !== "function") return false;
		const fn = /** @type {import('./function/index.js').Function} */ (item);
		const itemSelector = Function.getSelector(fn);
		// Compare bytes
		for (let i = 0; i < 4; i++) {
			if (selector[i] !== itemSelector[i]) return false;
		}
		return true;
	});

	if (!item || item.type !== "function") {
		throw new AbiItemNotFoundError(
			`Function with selector ${Hex.fromBytes(selector)} not found in ABI`,
		);
	}

	// Type assertion after guard
	const fn = /** @type {import('./function/index.js').Function} */ (item);
	const params = Function.decodeParams(fn, bytes.slice(4));

	return {
		name: fn.name,
		params,
	};
}
