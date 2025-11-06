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
	const item = this.find(
		(item) => item.type === "function" && item.name === functionName,
	);

	if (!item || item.type !== "function") {
		throw new AbiItemNotFoundError(
			`Function "${functionName}" not found in ABI`,
		);
	}

	return Function.encodeParams(item, args);
}
