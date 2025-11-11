import { AbiItemNotFoundError } from "../Errors.js";
import * as Function from "../function/index.js";

/**
 * Decode function return values (branded ABI method)
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @this {import('./BrandedAbi.js').BrandedAbi}
 * @param {string} functionName - Function name
 * @param {Uint8Array} data - Encoded return data
 * @returns {readonly unknown[]} Decoded return values
 * @throws {AbiItemNotFoundError} If function not found in ABI
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const abi = [{ type: 'function', name: 'balanceOf', outputs: [...] }];
 * const decoded = Abi.decode(abi, "balanceOf", encodedData);
 * ```
 */
export function decode(functionName, data) {
	const item = this.find(
		(item) => item.type === "function" && item.name === functionName,
	);

	if (!item || item.type !== "function") {
		throw new AbiItemNotFoundError(
			`Function "${functionName}" not found in ABI`,
		);
	}

	return Function.decodeResult(item, data);
}
