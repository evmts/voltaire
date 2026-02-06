import { type Any } from "./types.js";
/**
 * Deserialize RLP encoded transaction.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param data - RLP encoded transaction data
 * @returns Deserialized transaction
 * @throws {InvalidTransactionTypeError} If transaction type is unknown or unsupported
 * @example
 * ```javascript
 * import { deserialize } from './primitives/Transaction/deserialize.js';
 * const tx = deserialize(bytes);
 * ```
 */
export declare function deserialize(data: Uint8Array): Any;
//# sourceMappingURL=deserialize.d.ts.map