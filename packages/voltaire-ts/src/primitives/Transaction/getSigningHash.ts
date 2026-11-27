import { InvalidTransactionTypeError } from "../errors/index.js";
import type { HashType } from "../Hash/index.js";
import * as EIP1559 from "./EIP1559/getSigningHash.js";
import type { TransactionEIP1559Type } from "./EIP1559/TransactionEIP1559Type.js";
import * as EIP2930 from "./EIP2930/getSigningHash.js";
import type { TransactionEIP2930Type } from "./EIP2930/TransactionEIP2930Type.js";
import * as EIP4844 from "./EIP4844/getSigningHash.js";
import type { TransactionEIP4844Type } from "./EIP4844/TransactionEIP4844Type.js";
import * as EIP7702 from "./EIP7702/getSigningHash.js";
import type { TransactionEIP7702Type } from "./EIP7702/TransactionEIP7702Type.js";
import * as Legacy from "./Legacy/getSigningHash.js";
import type { TransactionLegacyType } from "./Legacy/TransactionLegacyType.js";
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
export function getSigningHash(this: Any): HashType {
	switch (this.type) {
		case Type.Legacy:
			return Legacy.getSigningHash.call(
				this as unknown as TransactionLegacyType,
			) as HashType;
		case Type.EIP2930:
			return EIP2930.getSigningHash(
				this as unknown as TransactionEIP2930Type,
			) as HashType;
		case Type.EIP1559:
			return EIP1559.getSigningHash(
				this as unknown as TransactionEIP1559Type,
			) as HashType;
		case Type.EIP4844:
			return EIP4844.getSigningHash(
				this as unknown as TransactionEIP4844Type,
			) as HashType;
		case Type.EIP7702:
			return EIP7702.getSigningHash(
				this as unknown as TransactionEIP7702Type,
			) as HashType;
		default: {
			const unknownType = (this as { type?: unknown }).type;
			throw new InvalidTransactionTypeError(
				`Unknown transaction type: ${String(unknownType)}`,
				{
					code: -32602,
					context: { type: unknownType },
					docsPath: "/primitives/transaction/get-signing-hash#error-handling",
				},
			);
		}
	}
}
