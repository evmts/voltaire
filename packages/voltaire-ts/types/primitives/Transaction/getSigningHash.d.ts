import type { HashType } from "../Hash/index.js";
import { type Any } from "./types.js";
/**
 * Get signing hash for transaction.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @returns Signing hash
 * @throws {InvalidTransactionTypeError} If transaction type is unknown or unsupported
 * @example
 * ```javascript
 * import { getSigningHash } from './primitives/Transaction/getSigningHash.js';
 * const signingHash = getSigningHash.call(tx);
 * ```
 */
export declare function getSigningHash(this: Any): HashType;
//# sourceMappingURL=getSigningHash.d.ts.map