import { encode } from "../../Rlp/BrandedRlp/encode.js";
import { encodeAddress, encodeBigintCompact } from "../utils.js";

/**
 * Serialize legacy transaction to RLP encoded bytes.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @this {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy}
 * @returns {Uint8Array} RLP encoded transaction
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { serialize } from './primitives/Transaction/Legacy/serialize.js';
 * const rlpBytes = serialize.call(tx);
 * ```
 */
export function serialize() {
	const fields = [
		encodeBigintCompact(this.nonce),
		encodeBigintCompact(this.gasPrice),
		encodeBigintCompact(this.gasLimit),
		encodeAddress(this.to),
		encodeBigintCompact(this.value),
		this.data,
		encodeBigintCompact(this.v),
		this.r,
		this.s,
	];
	return encode(fields);
}
