import { AbiItemNotFoundError } from "../Errors.js";
import * as Function from "../function/index.js";

/**
 * Encode function call data (branded ABI method)
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @this {import('./BrandedAbi.js').BrandedAbi}
 * @param {string} functionName - Function name to encode
 * @param {readonly unknown[]} args - Function arguments
 * @returns {Uint8Array} Encoded function call data
 * @throws {AbiItemNotFoundError} If function not found in ABI
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const abi = [{ type: 'function', name: 'transfer', inputs: [...] }];
 * const encoded = Abi.encode(abi, "transfer", [address, amount]);
 * ```
 */
export function encode(functionName, args) {
	const item = this.find(
		(item) => item.type === "function" && item.name === functionName,
	);

	if (!item || item.type !== "function") {
		throw new AbiItemNotFoundError(
			`Function "${functionName}" not found in ABI`,
			{
				value: functionName,
				expected: 'valid function name in ABI',
				context: { functionName, abi: this }
			}
		);
	}

	return Function.encodeParams(item, args);
}
