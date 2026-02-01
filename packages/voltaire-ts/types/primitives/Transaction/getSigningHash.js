import { InvalidTransactionTypeError } from "../errors/index.js";
import * as EIP1559 from "./EIP1559/getSigningHash.js";
import * as EIP2930 from "./EIP2930/getSigningHash.js";
import * as EIP4844 from "./EIP4844/getSigningHash.js";
import * as EIP7702 from "./EIP7702/getSigningHash.js";
import * as Legacy from "./Legacy/getSigningHash.js";
import { Type } from "./types.js";
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
export function getSigningHash() {
    switch (this.type) {
        case Type.Legacy:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return Legacy.getSigningHash.call(this);
        case Type.EIP2930:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return EIP2930.getSigningHash(this);
        case Type.EIP1559:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return EIP1559.getSigningHash(this);
        case Type.EIP4844:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return EIP4844.getSigningHash(this);
        case Type.EIP7702:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return EIP7702.getSigningHash(this);
        default:
            throw new InvalidTransactionTypeError(
            // biome-ignore lint/suspicious/noExplicitAny: error message for unknown type
            `Unknown transaction type: ${this.type}`, {
                code: -32602,
                // biome-ignore lint/suspicious/noExplicitAny: error context for unknown type
                context: { type: this.type },
                docsPath: "/primitives/transaction/get-signing-hash#error-handling",
            });
    }
}
