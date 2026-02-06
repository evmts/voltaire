import { type Any } from "./types.js";
/**
 * Serialize transaction to RLP encoded bytes.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @returns RLP encoded transaction
 * @throws {InvalidTransactionTypeError} If transaction type is unknown or unsupported
 * @example
 * ```javascript
 * import { serialize } from './primitives/Transaction/serialize.js';
 * const bytes = serialize.call(tx);
 * ```
 */
export declare function serialize(this: Any): Uint8Array;
//# sourceMappingURL=serialize.d.ts.map