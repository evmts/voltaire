import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import { InvalidTransactionTypeError } from "../errors/index.js";
import * as EIP1559 from "./EIP1559/getSender.js";
import type { TransactionEIP1559Type } from "./EIP1559/TransactionEIP1559Type.js";
import * as EIP2930 from "./EIP2930/getSender.js";
import type { TransactionEIP2930Type } from "./EIP2930/TransactionEIP2930Type.js";
import * as EIP4844 from "./EIP4844/getSender.js";
import type { TransactionEIP4844Type } from "./EIP4844/TransactionEIP4844Type.js";
import * as EIP7702 from "./EIP7702/getSender.js";
import type { TransactionEIP7702Type } from "./EIP7702/TransactionEIP7702Type.js";
import * as Legacy from "./Legacy/getSender.js";
import type { TransactionLegacyType } from "./Legacy/TransactionLegacyType.js";
import { type Any, Type } from "./types.js";

/**
 * Get sender address from transaction signature.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @returns Sender address
 * @throws {InvalidTransactionTypeError} If transaction type is unknown or unsupported
 * @example
 * ```javascript
 * import { getSender } from './primitives/Transaction/getSender.js';
 * const sender = getSender.call(tx);
 * ```
 */
export function getSender(this: Any): BrandedAddress {
	switch (this.type) {
		case Type.Legacy:
			return Legacy.getSender.call(this as unknown as TransactionLegacyType);
		case Type.EIP2930:
			return EIP2930.getSender(this as unknown as TransactionEIP2930Type);
		case Type.EIP1559:
			return EIP1559.getSender(this as unknown as TransactionEIP1559Type);
		case Type.EIP4844:
			return EIP4844.getSender(this as unknown as TransactionEIP4844Type);
		case Type.EIP7702:
			return EIP7702.getSender(this as unknown as TransactionEIP7702Type);
		default: {
			const unknownType = (this as { type?: unknown }).type;
			throw new InvalidTransactionTypeError(
				`Unknown transaction type: ${String(unknownType)}`,
				{
					code: -32602,
					context: { type: unknownType },
					docsPath: "/primitives/transaction/get-sender#error-handling",
				},
			);
		}
	}
}
