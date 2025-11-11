import { keccak256String } from "../../../Hash/BrandedHash/keccak256String.js";
import { getSignature } from "./getSignature.js";

/**
 * Get the 4-byte selector for an error
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @template {string} TName
 * @template {readonly import('../../parameter/index.js').BrandedParameter[]} TInputs
 * @param {import('./BrandedError.js').BrandedError<TName, TInputs>} error - ABI error definition
 * @returns {Uint8Array} 4-byte selector
 * @throws {never}
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const error = { type: "error", name: "Unauthorized", inputs: [] };
 * const selector = Abi.Error.getSelector(error);
 * ```
 */
export function getSelector(error) {
	const signature = getSignature(error);
	const hash = keccak256String(signature);
	return hash.slice(0, 4);
}
