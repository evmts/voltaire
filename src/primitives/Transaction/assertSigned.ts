import { TransactionError } from "../errors/index.js";
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
export function assertSigned(this: Any): void {
	const isZeroR = this.r.every((b) => b === 0);
	const isZeroS = this.s.every((b) => b === 0);

	if (isZeroR || isZeroS) {
		throw new TransactionError("Transaction is not signed", {
			code: "TRANSACTION_NOT_SIGNED",
			context: { hasR: !isZeroR, hasS: !isZeroS },
			docsPath: "/primitives/transaction/assert-signed#error-handling",
		});
	}
}
