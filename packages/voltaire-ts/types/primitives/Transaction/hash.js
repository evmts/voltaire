import { InvalidTransactionTypeError } from "../errors/index.js";
import * as EIP1559 from "./EIP1559/hash.js";
import * as EIP2930 from "./EIP2930/hash.js";
import * as EIP4844 from "./EIP4844/hash.js";
import * as EIP7702 from "./EIP7702/hash.js";
import * as Legacy from "./Legacy/hash.js";
import { Type } from "./types.js";
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
export function hash() {
    switch (this.type) {
        case Type.Legacy:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return Legacy.hash.call(this);
        case Type.EIP2930:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return EIP2930.hash(this);
        case Type.EIP1559:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return EIP1559.hash(this);
        case Type.EIP4844:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return EIP4844.hash(this);
        case Type.EIP7702:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return EIP7702.hash(this);
        default:
            throw new InvalidTransactionTypeError(
            // biome-ignore lint/suspicious/noExplicitAny: error message for unknown type
            `Unknown transaction type: ${this.type}`, {
                code: -32602,
                // biome-ignore lint/suspicious/noExplicitAny: error context for unknown type
                context: { type: this.type },
                docsPath: "/primitives/transaction/hash#error-handling",
            });
    }
}
