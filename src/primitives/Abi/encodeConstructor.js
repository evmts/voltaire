import * as Hex from "../Hex/index.js";
import { AbiItemNotFoundError } from "./Errors.js";
import * as Constructor from "./constructor/index.js";

/**
 * Encode constructor deployment data from ABI
 *
 * @param {import('./Abi.js').Abi} abi - Full ABI array
 * @param {readonly unknown[]} args - Constructor arguments
 * @returns {import('../Hex/index.js').Hex} Encoded constructor parameters (hex string)
 *
 * @example
 * ```typescript
 * const abi = [
 *   {
 *     type: "constructor",
 *     inputs: [
 *       { type: "string", name: "name" },
 *       { type: "string", name: "symbol" }
 *     ]
 *   }
 * ];
 * const encoded = Abi.encodeConstructor(abi, ["MyToken", "MTK"]);
 * // This is appended to bytecode for deployment
 * ```
 */
export function encodeConstructor(abi, args) {
	const item = abi.find((item) => item.type === "constructor");

	if (!item || item.type !== "constructor") {
		throw new AbiItemNotFoundError("Constructor not found in ABI");
	}

	// Type assertion after guard
	const ctor =
		/** @type {import('./constructor/index.js').BrandedConstructor} */ (item);
	const encoded = Constructor.encodeParams(ctor, [...args]);
	return Hex.fromBytes(encoded);
}
