import type { HashType } from "../Hash/index.js";
import { type Any } from "./types.js";
/**
 * Compute transaction hash.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @returns Transaction hash
 * @throws {InvalidTransactionTypeError} If transaction type is unknown or unsupported
 * @example
 * ```javascript
 * import { hash } from './primitives/Transaction/hash.js';
 * const txHash = hash.call(tx);
 * ```
 */
export declare function hash(this: Any): HashType;
//# sourceMappingURL=hash.d.ts.map