import * as Hex from "../../Hex/index.js";
import { AbiInvalidSelectorError, AbiItemNotFoundError } from "../Errors.js";
import * as Function from "../function/index.js";

/**
 * Decode function call data and identify function (branded ABI method)
 *
 * @this {import('./BrandedAbi.js').BrandedAbi}
 * @param {Uint8Array} data - Encoded function call data
 * @returns {{ functionName: string, args: readonly unknown[] }} Decoded function name and arguments
 *
 * @example
 * ```typescript
 * const abi = [...];
 * const decoded = Abi.decodeData.call(abi, calldata);
 * // { functionName: "transfer", args: [address, amount] }
 * ```
 */
export function decodeData(data) {
	if (data.length < 4) {
		throw new AbiInvalidSelectorError("Data too short to contain selector");
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
		);
	}

	const args = Function.decodeParams(item, data);

	return {
		functionName: item.name,
		args,
	};
}
