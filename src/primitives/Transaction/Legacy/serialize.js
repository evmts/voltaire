import { encode } from "../../Rlp/encode.js";
import { encodeAddress, encodeBigintCompact } from "../utils.js";

/**
 * Serialize legacy transaction to RLP encoded bytes
 *
 * @this {import('./BrandedTransactionLegacy.js').BrandedTransactionLegacy}
 * @returns {Uint8Array} RLP encoded transaction
 *
 * @example
 * ```typescript
 * const rlpBytes = TransactionLegacy.serialize.call(tx);
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
