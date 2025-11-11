import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import { InvalidTransactionTypeError } from "../errors/index.js";
import * as EIP1559 from "./EIP1559/getSender.js";
import * as EIP2930 from "./EIP2930/getSender.js";
import * as EIP4844 from "./EIP4844/getSender.js";
import * as EIP7702 from "./EIP7702/getSender.js";
import * as Legacy from "./Legacy/getSender.js";
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
			return Legacy.getSender.call(this as any);
		case Type.EIP2930:
			return EIP2930.getSender(this as any);
		case Type.EIP1559:
			return EIP1559.getSender(this as any);
		case Type.EIP4844:
			return EIP4844.getSender(this as any);
		case Type.EIP7702:
			return EIP7702.getSender(this as any);
		default:
			throw new InvalidTransactionTypeError(
				`Unknown transaction type: ${(this as any).type}`,
				{
					code: "UNKNOWN_TRANSACTION_TYPE",
					context: { type: (this as any).type },
					docsPath: "/primitives/transaction/get-sender#error-handling",
				},
			);
	}
}
