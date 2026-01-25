import { InvalidTransactionTypeError } from "../errors/index.js";
import type { HashType } from "../Hash/index.js";
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
export function hash(this: Any): HashType {
	switch (this.type) {
		case Type.Legacy:
			// biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
			return Legacy.hash.call(this as any) as HashType;
		case Type.EIP2930:
			// biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
			return EIP2930.hash(this as any) as HashType;
		case Type.EIP1559:
			// biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
			return EIP1559.hash(this as any) as HashType;
		case Type.EIP4844:
			// biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
			return EIP4844.hash(this as any) as HashType;
		case Type.EIP7702:
			// biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
			return EIP7702.hash(this as any) as HashType;
		default:
			throw new InvalidTransactionTypeError(
				// biome-ignore lint/suspicious/noExplicitAny: error message for unknown type
				`Unknown transaction type: ${(this as any).type}`,
				{
					code: -32602,
					// biome-ignore lint/suspicious/noExplicitAny: error context for unknown type
					context: { type: (this as any).type },
					docsPath: "/primitives/transaction/hash#error-handling",
				},
			);
	}
}
