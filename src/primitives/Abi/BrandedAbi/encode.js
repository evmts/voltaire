import * as Hex from "../../Hex/index.js";
import { AbiItemNotFoundError } from "../Errors.js";
import * as Function from "../function/index.js";

/**
 * Encode function call data (branded ABI method)
 *
 * @this {import('./BrandedAbi.js').BrandedAbi}
 * @param {string} functionName - Function name to encode
 * @param {readonly unknown[]} args - Function arguments
 * @returns {Uint8Array} Encoded function call data
 *
 * @example
 * ```typescript
 * const abi = [...];
 * const encoded = Abi.encode.call(abi, "transfer", [address, amount]);
 * ```
 */
export function encode(functionName, args) {
	const func = this.find(
		(item) => item.type === "function" && item.name === functionName,
	);

	if (!func) {
		throw new AbiItemNotFoundError(
			`Function "${functionName}" not found in ABI`,
		);
	}

	return Function.encodeParams(func, args);
}
