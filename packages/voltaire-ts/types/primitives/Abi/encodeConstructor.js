import * as Hex from "../Hex/index.js";
import * as Constructor from "./constructor/index.js";
import { AbiItemNotFoundError } from "./Errors.js";
/**
 * Encode constructor deployment data from ABI
 *
 * @param {import('./Abi.js').Abi} abi - Full ABI array
 * @param {readonly unknown[]} args - Constructor arguments
 * @returns {import("../Hex/index.js").HexType} Encoded constructor parameters (hex string)
 * @throws {AbiItemNotFoundError} If constructor not found in ABI
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
    const item = /** @type {import('./AbiType.js').Item[]} */ (
    /** @type {unknown} */ (abi)).find((/** @type {import('./AbiType.js').Item} */ item) => item.type === "constructor");
    if (!item || item.type !== "constructor") {
        throw new AbiItemNotFoundError("Constructor not found in ABI", {
            value: "constructor",
            expected: "valid constructor item in ABI",
            context: { abi },
        });
    }
    // Type assertion after guard
    const ctor = /** @type {import('./constructor/index.js').ConstructorType} */ (item);
    const encoded = Constructor.encodeParams(ctor, [...args]);
    return Hex.fromBytes(encoded);
}
