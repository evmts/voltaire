import { InvalidTransactionTypeError } from "../errors/index.js";
import type { BrandedHash } from "../Hash/index.js";
import * as EIP1559 from "./EIP1559/hash.js";
import * as EIP2930 from "./EIP2930/hash.js";
import * as EIP4844 from "./EIP4844/hash.js";
import * as EIP7702 from "./EIP7702/hash.js";
import * as Legacy from "./Legacy/hash.js";
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
export function hash(this: Any): BrandedHash {
	switch (this.type) {
		case Type.Legacy:
			return Legacy.hash.call(this as any);
		case Type.EIP2930:
			return EIP2930.hash(this as any);
		case Type.EIP1559:
			return EIP1559.hash(this as any);
		case Type.EIP4844:
			return EIP4844.hash(this as any);
		case Type.EIP7702:
			return EIP7702.hash(this as any);
		default:
			throw new InvalidTransactionTypeError(
				`Unknown transaction type: ${(this as any).type}`,
				{
					code: "UNKNOWN_TRANSACTION_TYPE",
					context: { type: (this as any).type },
					docsPath: "/primitives/transaction/hash#error-handling",
				},
			);
	}
}
