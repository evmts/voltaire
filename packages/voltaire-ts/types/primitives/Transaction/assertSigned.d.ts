import type { Any } from "./types.js";
/**
 * Assert transaction is signed (has non-zero signature).
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @returns void
 * @throws {TransactionError} If transaction is not signed
 * @example
 * ```javascript
 * import { assertSigned } from './primitives/Transaction/assertSigned.js';
 * assertSigned.call(tx);
 * ```
 */
export declare function assertSigned(this: Any): void;
//# sourceMappingURL=assertSigned.d.ts.map