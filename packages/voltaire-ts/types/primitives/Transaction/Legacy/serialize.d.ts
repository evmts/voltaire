/**
 * Serialize legacy transaction to RLP encoded bytes.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @this {import('./TransactionLegacyType.js').TransactionLegacyType}
 * @returns {Uint8Array} RLP encoded transaction
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { serialize } from './primitives/Transaction/Legacy/serialize.js';
 * const rlpBytes = serialize.call(tx);
 * ```
 */
export function serialize(this: import("./TransactionLegacyType.js").TransactionLegacyType): Uint8Array;
//# sourceMappingURL=serialize.d.ts.map