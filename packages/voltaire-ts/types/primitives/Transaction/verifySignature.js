import { InvalidTransactionTypeError } from "../errors/index.js";
import * as EIP1559 from "./EIP1559/verifySignature.js";
import * as EIP2930 from "./EIP2930/verifySignature.js";
import * as EIP4844 from "./EIP4844/verifySignature.js";
import * as EIP7702 from "./EIP7702/verifySignature.js";
import * as Legacy from "./Legacy/verifySignature.js";
import { Type } from "./types.js";
/**
 * Verify transaction signature.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @returns True if signature is valid
 * @throws {InvalidTransactionTypeError} If transaction type is unknown or unsupported
 * @example
 * ```javascript
 * import { verifySignature } from './primitives/Transaction/verifySignature.js';
 * const isValid = verifySignature.call(tx);
 * ```
 */
export function verifySignature() {
    switch (this.type) {
        case Type.Legacy:
            return Legacy.verifySignature.call(this);
        case Type.EIP2930:
            return EIP2930.verifySignature(this);
        case Type.EIP1559:
            return EIP1559.verifySignature(this);
        case Type.EIP4844:
            return EIP4844.verifySignature(this);
        case Type.EIP7702:
            return EIP7702.verifySignature(this);
        default:
            throw new InvalidTransactionTypeError(
            // biome-ignore lint/suspicious/noExplicitAny: error message for unknown type
            `Unknown transaction type: ${this.type}`, {
                code: -32602,
                // biome-ignore lint/suspicious/noExplicitAny: error context for unknown type
                context: { type: this.type },
                docsPath: "/primitives/transaction/verify-signature#error-handling",
            });
    }
}
