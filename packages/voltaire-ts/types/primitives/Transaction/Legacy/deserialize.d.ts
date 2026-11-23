/**
 * Deserialize RLP encoded legacy transaction.
 *
 * Integers must be canonical RLP (no leading zero bytes). `r` and `s` are
 * left-padded to 32 bytes.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP encoded transaction data
 * @returns {import('./TransactionLegacyType.js').TransactionLegacyType} Deserialized legacy transaction
 * @throws {DecodingError} If data is invalid or not a valid legacy transaction
 * @example
 * ```javascript
 * import { deserialize } from './primitives/Transaction/Legacy/deserialize.js';
 * const tx = deserialize(rlpBytes);
 * ```
 */
export function deserialize(data: Uint8Array): import("./TransactionLegacyType.js").TransactionLegacyType;
//# sourceMappingURL=deserialize.d.ts.map