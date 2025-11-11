import * as Hex from "../../Hex/index.js";
import { AbiInvalidSelectorError, AbiItemNotFoundError } from "../Errors.js";
import * as Function from "../function/index.js";

/**
 * Decode function call data and identify function (branded ABI method)
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @this {import('./BrandedAbi.js').BrandedAbi}
 * @param {Uint8Array} data - Encoded function call data
 * @returns {{ functionName: string, args: readonly unknown[] }} Decoded function name and arguments
 * @throws {AbiInvalidSelectorError} If data is too short to contain selector
 * @throws {AbiItemNotFoundError} If function with selector not found in ABI
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const abi = [{ type: 'function', name: 'transfer', inputs: [...] }];
 * const decoded = Abi.decodeData(abi, calldata);
 * // { functionName: "transfer", args: [address, amount] }
 * ```
 */
export function decodeData(data) {
	if (data.length < 4) {
		throw new AbiInvalidSelectorError("Data too short to contain selector", {
			value: data.length,
			expected: "at least 4 bytes",
			context: { dataLength: data.length },
		});
	}

	const selector = data.slice(0, 4);

	// Find function by selector
	const item = this.find((item) => {
		if (item.type !== "function") return false;
		const itemSelector = Function.getSelector(item);
		// Compare bytes
		for (let i = 0; i < 4; i++) {
			if (selector[i] !== itemSelector[i]) return false;
		}
		return true;
	});

	if (!item || item.type !== "function") {
		throw new AbiItemNotFoundError(
			`Function with selector ${Hex.fromBytes(selector)} not found in ABI`,
			{
				value: Hex.fromBytes(selector),
				expected: "valid function selector in ABI",
				context: { selector: Hex.fromBytes(selector), abi: this },
			},
		);
	}

	const args = Function.decodeParams(item, data);

	return {
		functionName: item.name,
		args,
	};
}
