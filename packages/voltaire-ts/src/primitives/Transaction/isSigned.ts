import { assertSigned } from "./assertSigned.js";
import type { Any } from "./types.js";

/**
 * Check if transaction is signed.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @returns True if transaction has valid signature
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { isSigned } from './primitives/Transaction/isSigned.js';
 * const signed = isSigned.call(tx);
 * ```
 */
export function isSigned(this: Any): boolean {
	try {
		assertSigned.call(this);
		return true;
	} catch {
		return false;
	}
}
