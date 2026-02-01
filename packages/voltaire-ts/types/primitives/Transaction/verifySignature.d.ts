import { type Any } from "./types.js";
/**
 * Verify transaction signature.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @returns True if signature is valid
 * @throws {InvalidTransactionTypeError} If transaction type is unknown or unsupported
 * @example
 * ```javascript
 * import { verifySignature } from './primitives/Transaction/verifySignature.js';
 * const isValid = verifySignature.call(tx);
 * ```
 */
export declare function verifySignature(this: Any): boolean;
//# sourceMappingURL=verifySignature.d.ts.map