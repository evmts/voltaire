import { InvalidTransactionTypeError } from "../errors/index.js";
import * as EIP1559 from "./EIP1559/serialize.js";
import * as EIP2930 from "./EIP2930/serialize.js";
import * as EIP4844 from "./EIP4844/serialize.js";
import * as EIP7702 from "./EIP7702/serialize.js";
import * as Legacy from "./Legacy/serialize.js";
import { type Any, Type } from "./types.js";

/**
 * Serialize transaction to RLP encoded bytes.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @returns RLP encoded transaction
 * @throws {InvalidTransactionTypeError} If transaction type is unknown or unsupported
 * @example
 * ```javascript
 * import { serialize } from './primitives/Transaction/serialize.js';
 * const bytes = serialize.call(tx);
 * ```
 */
export function serialize(this: Any): Uint8Array {
	switch (this.type) {
		case Type.Legacy:
			return Legacy.serialize.call(this as any);
		case Type.EIP2930:
			return EIP2930.serialize(this as any);
		case Type.EIP1559:
			return EIP1559.serialize(this as any);
		case Type.EIP4844:
			return EIP4844.serialize(this as any);
		case Type.EIP7702:
			return EIP7702.serialize(this as any);
		default:
			throw new InvalidTransactionTypeError(
				`Unknown transaction type: ${(this as any).type}`,
				{
					code: "UNKNOWN_TRANSACTION_TYPE",
					context: { type: (this as any).type },
					docsPath: "/primitives/transaction/serialize#error-handling",
				},
			);
	}
}
