import { Keccak256 } from "../../../crypto/keccak256.js";
import * as Rlp from "../../Rlp/index.js";
import { Type } from "../types.js";
import {
	encodeAccessList,
	encodeAddress,
	encodeBigintCompact,
} from "../utils.js";

/**
 * Get signing hash for EIP-2930 transaction
 *
 * @param {import('./BrandedTransactionEIP2930.js').BrandedTransactionEIP2930} tx - Transaction
 * @returns {import('../../Hash/index.js').BrandedHash} Signing hash
 *
 * @example
 * ```typescript
 * const signingHash = TransactionEIP2930.getSigningHash(tx);
 * ```
 */
export function getSigningHash(tx) {
	const fields = [
		encodeBigintCompact(tx.chainId),
		encodeBigintCompact(tx.nonce),
		encodeBigintCompact(tx.gasPrice),
		encodeBigintCompact(tx.gasLimit),
		encodeAddress(tx.to),
		encodeBigintCompact(tx.value),
		tx.data,
		encodeAccessList(tx.accessList),
	];
	const rlpEncoded = Rlp.encode(fields);

	// Prepend type byte 0x01
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP2930;
	result.set(rlpEncoded, 1);

	return Keccak256.hash(result);
}
