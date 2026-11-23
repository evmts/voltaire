import type { Unsigned } from "./UnsignedType.js";
/**
 * Deserialize an unsigned transaction (signing payload) produced by
 * `serializeUnsigned`.
 *
 * Accepts:
 * - Legacy: 6 fields (pre-EIP-155) or 9 fields with empty `r`/`s` (EIP-155,
 *   `chainId` read from position 6).
 * - Typed (1, 2, 3, 4): `type || rlp([...fields])` without `yParity`, `r`, `s`.
 *
 * Every field is validated by the same rules as `deserialize`: byte-string or
 * list type, canonical RLP integers, a 20-byte `to` and non-empty
 * authorization list for EIP-7702, and non-empty blob hashes for EIP-4844.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.1.0
 * @param data - Unsigned serialized transaction
 * @returns Unsigned transaction
 * @throws {DecodingError} If the field count or any field is invalid
 * @throws {InvalidTransactionTypeError} If transaction type is unknown
 * @example
 * ```javascript
 * import { deserializeUnsigned } from './primitives/Transaction/deserializeUnsigned.js';
 * const tx = deserializeUnsigned(bytes);
 * ```
 */
export declare function deserializeUnsigned(data: Uint8Array): Unsigned;
//# sourceMappingURL=deserializeUnsigned.d.ts.map