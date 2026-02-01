import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import { type Any } from "./types.js";
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
export declare function getSender(this: Any): BrandedAddress;
//# sourceMappingURL=getSender.d.ts.map