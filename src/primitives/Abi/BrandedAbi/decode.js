import { AbiItemNotFoundError } from "../Errors.js";
import * as Function from "../function/index.js";

/**
 * Decode function return values (branded ABI method)
 *
 * @this {import('./BrandedAbi.js').BrandedAbi}
 * @param {string} functionName - Function name
 * @param {Uint8Array} data - Encoded return data
 * @returns {readonly unknown[]} Decoded return values
 *
 * @example
 * ```typescript
 * const abi = [...];
 * const decoded = Abi.decode.call(abi, "balanceOf", encodedData);
 * ```
 */
export function decode(functionName, data) {
	const func = this.find(
		(item) => item.type === "function" && item.name === functionName,
	);

	if (!func) {
		throw new AbiItemNotFoundError(
			`Function "${functionName}" not found in ABI`,
		);
	}

	return Function.decodeResult(func, data);
}
