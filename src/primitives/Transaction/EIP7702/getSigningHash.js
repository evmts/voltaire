import { Keccak256 } from "../../../crypto/Keccak256/index.js";
import { encode } from "../../Rlp/BrandedRlp/encode.js";
import { Type } from "../types.js";
import {
	encodeAccessList,
	encodeAddress,
	encodeAuthorizationList,
	encodeBigintCompact,
} from "../utils.js";

/**
 * Get signing hash.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702} tx - Transaction to get signing hash for
 * @returns {import('../../Hash/index.js').BrandedHash} Keccak256 hash for signing
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { getSigningHash } from './primitives/Transaction/EIP7702/getSigningHash.js';
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
		encodeAuthorizationList(tx.authorizationList),
	];
	const rlpEncoded = encode(fields);

	// Prepend type byte 0x04
	const result = new Uint8Array(1 + rlpEncoded.length);
	result[0] = Type.EIP7702;
	result.set(rlpEncoded, 1);

	return Keccak256.hash(result);
}
