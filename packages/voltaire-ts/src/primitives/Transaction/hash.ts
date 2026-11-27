import { InvalidTransactionTypeError } from "../errors/index.js";
import type { HashType } from "../Hash/index.js";
import * as EIP1559 from "./EIP1559/hash.js";
import type { TransactionEIP1559Type } from "./EIP1559/TransactionEIP1559Type.js";
import * as EIP2930 from "./EIP2930/hash.js";
import type { TransactionEIP2930Type } from "./EIP2930/TransactionEIP2930Type.js";
import * as EIP4844 from "./EIP4844/hash.js";
import type { TransactionEIP4844Type } from "./EIP4844/TransactionEIP4844Type.js";
import * as EIP7702 from "./EIP7702/hash.js";
import type { TransactionEIP7702Type } from "./EIP7702/TransactionEIP7702Type.js";
import * as Legacy from "./Legacy/hash.js";
import type { TransactionLegacyType } from "./Legacy/TransactionLegacyType.js";
import { type Any, Type } from "./types.js";

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
export function hash(this: Any): HashType {
	switch (this.type) {
		case Type.Legacy:
			return Legacy.hash.call(
				this as unknown as TransactionLegacyType,
			) as HashType;
		case Type.EIP2930:
			return EIP2930.hash(
				this as unknown as TransactionEIP2930Type,
			) as HashType;
		case Type.EIP1559:
			return EIP1559.hash(
				this as unknown as TransactionEIP1559Type,
			) as HashType;
		case Type.EIP4844:
			return EIP4844.hash(
				this as unknown as TransactionEIP4844Type,
			) as HashType;
		case Type.EIP7702:
			return EIP7702.hash(
				this as unknown as TransactionEIP7702Type,
			) as HashType;
		default: {
			const unknownType = (this as { type?: unknown }).type;
			throw new InvalidTransactionTypeError(
				`Unknown transaction type: ${String(unknownType)}`,
				{
					code: -32602,
					context: { type: unknownType },
					docsPath: "/primitives/transaction/hash#error-handling",
				},
			);
		}
	}
}
