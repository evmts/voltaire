import { encode } from "../../Rlp/encode.js";
import {
	encodeAddress,
	encodeBigintCompact,
	encodeSignatureScalar,
} from "../utils.js";

/**
 * Serialize legacy transaction to RLP encoded bytes.
 *
 * `r` and `s` are RLP integers: leading zero bytes are stripped.
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
export function serialize() {
	const fields = [
		encodeBigintCompact(this.nonce),
		encodeBigintCompact(this.gasPrice),
		encodeBigintCompact(this.gasLimit),
		encodeAddress(this.to),
		encodeBigintCompact(this.value),
		this.data,
		encodeBigintCompact(this.v),
		encodeSignatureScalar(this.r),
		encodeSignatureScalar(this.s),
	];
	return encode(fields);
}
