import { InvalidTransactionTypeError } from "../errors/index.js";
import * as EIP1559 from "./EIP1559/serialize.js";
import * as EIP2930 from "./EIP2930/serialize.js";
import * as EIP4844 from "./EIP4844/serialize.js";
import * as EIP7702 from "./EIP7702/serialize.js";
import * as Legacy from "./Legacy/serialize.js";
import { Type } from "./types.js";
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
export function serialize() {
    switch (this.type) {
        case Type.Legacy:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return Legacy.serialize.call(this);
        case Type.EIP2930:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return EIP2930.serialize(this);
        case Type.EIP1559:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return EIP1559.serialize(this);
        case Type.EIP4844:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return EIP4844.serialize(this);
        case Type.EIP7702:
            // biome-ignore lint/suspicious/noExplicitAny: type narrowed by case
            return EIP7702.serialize(this);
        default:
            throw new InvalidTransactionTypeError(
            // biome-ignore lint/suspicious/noExplicitAny: error message for unknown type
            `Unknown transaction type: ${this.type}`, {
                code: -32602,
                // biome-ignore lint/suspicious/noExplicitAny: error context for unknown type
                context: { type: this.type },
                docsPath: "/primitives/transaction/serialize#error-handling",
            });
    }
}
