import { encode } from "../../Rlp/BrandedRlp/encode.js";
import { Type } from "../types.js";
import {
	encodeAccessList,
	encodeAddress,
	encodeAuthorizationList,
	encodeBigintCompact,
} from "../utils.js";

/**
 * Serialize EIP-7702 transaction to RLP encoded bytes.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702} tx - Transaction to serialize
 * @returns {Uint8Array} RLP encoded transaction with type prefix
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { serialize } from './primitives/Transaction/EIP7702/serialize.js';
 * const serialized = serialize(tx);
 * ```
 */
export function serialize(tx) {
	const fields = [
		encodeBigintCompact(tx.chainId),
		encodeBigintCompact(tx.nonce),
		encodeBigintCompact(tx.maxPriorityFeePerGas),
		encodeBigintCompact(tx.maxFeePerGas),
		encodeBigintCompact(tx.gasLimit),
		encodeAddress(tx.to),
		encodeBigintCompact(tx.value),
		tx.data,
		encodeAccessList(tx.accessList),
		encodeAuthorizationList(tx.authorizationList),
		new Uint8Array([tx.yParity]),
		tx.r,
		tx.s,
	];
	const rlpEncoded = encode(fields);

	// Prepend type byte 0x04
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP7702;
	result.set(rlpEncoded, 1);
	return result;
}
