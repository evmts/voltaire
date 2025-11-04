import { Keccak256 } from "../../../crypto/keccak256.js";
import * as Rlp from "../../Rlp/index.js";
import { Type } from "../types.js";
import {
	encodeAccessList,
	encodeAddress,
	encodeBigintCompact,
} from "../utils.js";

/**
 * Get signing hash for EIP-1559 transaction
 *
 * @param {import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559} tx - Transaction to get signing hash for
 * @returns {import('../../Hash/index.js').BrandedHash} Signing hash
 *
 * @example
 * ```typescript
 * const signingHash = getSigningHash(tx);
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
	];
	const rlpEncoded = Rlp.encode(fields);

	// Prepend type byte 0x02
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP1559;
	result.set(rlpEncoded, 1);

	return Keccak256.hash(result);
}
