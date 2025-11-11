import { InvalidTransactionTypeError } from "../errors/index.js";
import type { BrandedHash } from "../Hash/index.js";
import * as EIP1559 from "./EIP1559/getSigningHash.js";
import * as EIP2930 from "./EIP2930/getSigningHash.js";
import * as EIP4844 from "./EIP4844/getSigningHash.js";
import * as EIP7702 from "./EIP7702/getSigningHash.js";
import * as Legacy from "./Legacy/getSigningHash.js";
import { type Any, Type } from "./types.js";

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
export function getSigningHash(this: Any): BrandedHash {
	switch (this.type) {
		case Type.Legacy:
			return Legacy.getSigningHash.call(this as any);
		case Type.EIP2930:
			return EIP2930.getSigningHash(this as any);
		case Type.EIP1559:
			return EIP1559.getSigningHash(this as any);
		case Type.EIP4844:
			return EIP4844.getSigningHash(this as any);
		case Type.EIP7702:
			return EIP7702.getSigningHash(this as any);
		default:
			throw new InvalidTransactionTypeError(
				`Unknown transaction type: ${(this as any).type}`,
				{
					code: "UNKNOWN_TRANSACTION_TYPE",
					context: { type: (this as any).type },
					docsPath: "/primitives/transaction/get-signing-hash#error-handling",
				},
			);
	}
}
