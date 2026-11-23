import { type Any } from "./types.js";
import type { Unsigned } from "./UnsignedType.js";
/**
 * Serialize an unsigned transaction to its signing payload.
 *
 * The output is the exact byte string whose keccak256 is the signing hash:
 * - Legacy: `rlp([nonce, gasPrice, gasLimit, to, value, data])`, or the
 *   EIP-155 form `rlp([..., chainId, 0, 0])` when `chainId` is set.
 * - Typed (1, 2, 3, 4): `type || rlp([...fields])` without `yParity`, `r`, `s`.
 *
 * Signature fields on the input are ignored, so a signed transaction can be
 * passed to get its unsigned envelope.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.1.0
 * @param tx - Unsigned (or signed) transaction
 * @returns Unsigned serialized transaction
 * @throws {InvalidTransactionTypeError} If transaction type is unknown
 * @example
 * ```javascript
 * import { serializeUnsigned } from './primitives/Transaction/serializeUnsigned.js';
 * const bytes = serializeUnsigned({ type: 2, chainId: 1n, nonce: 0n, ... });
 * ```
 */
export declare function serializeUnsigned(tx: Unsigned | Any): Uint8Array;
//# sourceMappingURL=serializeUnsigned.d.ts.map