import { Keccak256 } from "../../../crypto/keccak256.js";
import * as Rlp from "../../Rlp/index.js";
import { Type } from "../types.js";
import { encodeAccessList, encodeBigintCompact } from "../utils.js";

/**
 * Get signing hash for EIP-4844 transaction
 *
 * @param {import('./BrandedTransactionEIP4844.js').BrandedTransactionEIP4844} tx - EIP-4844 transaction
 * @returns {import('../../Hash/index.js').BrandedHash} Signing hash
 *
 * @example
 * ```typescript
 * const sigHash = getSigningHash(tx);
 * ```
 */
export function getSigningHash(tx) {
	const fields = [
		encodeBigintCompact(tx.chainId),
		encodeBigintCompact(tx.nonce),
		encodeBigintCompact(tx.maxPriorityFeePerGas),
		encodeBigintCompact(tx.maxFeePerGas),
		encodeBigintCompact(tx.gasLimit),
		tx.to,
		encodeBigintCompact(tx.value),
		tx.data,
		encodeAccessList(tx.accessList),
		encodeBigintCompact(tx.maxFeePerBlobGas),
		tx.blobVersionedHashes.map((h) => h),
	];
	const rlpEncoded = Rlp.encode(fields);

	// Prepend type byte 0x03
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP4844;
	result.set(rlpEncoded, 1);

	return Keccak256.hash(result);
}
