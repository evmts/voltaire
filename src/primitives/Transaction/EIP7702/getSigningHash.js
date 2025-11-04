import { Keccak256 } from "../../../crypto/keccak256.js";
import * as Rlp from "../../Rlp/index.js";
import { Type } from "../types.js";
import {
	encodeAccessList,
	encodeAddress,
	encodeAuthorizationList,
	encodeBigintCompact,
} from "../utils.js";

/**
 * Get signing hash
 *
 * @param {import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702} tx - Transaction to get signing hash for
 * @returns {import('../../Hash/index.js').BrandedHash} Keccak256 hash for signing
 *
 * @example
 * ```javascript
 * const signingHash = TransactionEIP7702.getSigningHash(tx);
 * // Used to create or verify transaction signature
 * ```
 */
export function getSigningHash(tx) {
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
	];
	const rlpEncoded = Rlp.encode(fields);

	// Prepend type byte 0x04
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP7702;
	result.set(rlpEncoded, 1);

	return Keccak256.hash(result);
}
