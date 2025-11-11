import * as Hex from "../Hex/index.js";
import { AbiItemNotFoundError } from "./Errors.js";
import * as Function from "./function/index.js";

/**
 * Find function in ABI by selector
 *
 * @param {import('./Abi.js').Abi} abi - Full ABI array
 * @param {import("../Hex/BrandedHex/BrandedHex.js").BrandedHex | Uint8Array} selector - 4-byte function selector
 * @returns {import('./function/BrandedFunction.js').Function} Function ABI item
 * @throws {AbiItemNotFoundError} If selector invalid length or function not found in ABI
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
 * const func = Abi.getFunctionBySelector(abi, "0xa9059cbb");
 * // { type: "function", name: "transfer", ... }
 * ```
 */
export function getFunctionBySelector(abi, selector) {
	const selectorBytes =
		typeof selector === "string" ? Hex.toBytes(selector) : selector;

	if (selectorBytes.length !== 4) {
		throw new AbiItemNotFoundError(
			`Invalid selector length: expected 4 bytes, got ${selectorBytes.length}`,
			{
				value: selectorBytes.length,
				expected: '4 bytes',
				context: { selector, selectorLength: selectorBytes.length }
			}
		);
	}

	const item = abi.find((item) => {
		if (item.type !== "function") return false;
		const fn = /** @type {import('./function/index.js').BrandedFunction} */ (
			item
		);

		const itemSelector = Function.getSelector(fn);
		// Compare bytes
		for (let i = 0; i < 4; i++) {
			if (selectorBytes[i] !== itemSelector[i]) return false;
		}
		return true;
	});

	if (!item || item.type !== "function") {
		throw new AbiItemNotFoundError(
			`Function with selector ${Hex.fromBytes(selectorBytes)} not found in ABI`,
			{
				value: Hex.fromBytes(selectorBytes),
				expected: 'valid function selector in ABI',
				context: { selector: Hex.fromBytes(selectorBytes), abi }
			}
		);
	}

	// Type assertion after guard
	return /** @type {import('./function/index.js').BrandedFunction} */ (item);
}
