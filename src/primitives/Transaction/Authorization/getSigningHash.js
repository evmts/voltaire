import { Keccak256 } from "../../../crypto/Keccak256/index.js";
import { Hash } from "../../Hash/index.js";
import { encode } from "../../Rlp/encode.js";
import { encodeBigintCompact } from "../utils.ts";

/**
 * Get signing hash for authorization (EIP-7702)
 *
 * Per EIP-7702: keccak256(MAGIC || rlp([chain_id, address, nonce]))
 * MAGIC = 0x05
 *
 * @param {import('./BrandedAuthorization.js').BrandedAuthorization} auth - Authorization to hash
 * @returns {import('../../Hash/index.js').BrandedHash} Signing hash
 *
 * @example
 * ```typescript
 * const hash = getSigningHash(auth);
 * ```
 */
export function getSigningHash(auth) {
	const MAGIC = 0x05;
	const fields = [
		encodeBigintCompact(auth.chainId),
		auth.address,
		encodeBigintCompact(auth.nonce),
	];
	const rlpEncoded = encode(fields);

	// Prepend magic byte
	const data = new Uint8Array(1 + rlpEncoded.length);
	data[0] = MAGIC;
	data.set(rlpEncoded, 1);

	return Keccak256.hash(data);
}
