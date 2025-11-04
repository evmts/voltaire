import { Keccak256 } from "../../../crypto/keccak256.js";
import type { Hash } from "../../Hash/index.js";
import * as Rlp from "../../Rlp/index.js";
import type { BrandedAuthorization } from "./BrandedAuthorization.js";
import { encodeBigintCompact } from "../utils.js";

/**
 * Get signing hash for authorization
 *
 * Per EIP-7702: keccak256(MAGIC || rlp([chain_id, address, nonce]))
 * MAGIC = 0x05
 */
export function getSigningHash(auth: BrandedAuthorization): Hash {
	const MAGIC = 0x05;
	const fields = [
		encodeBigintCompact(auth.chainId),
		auth.address,
		encodeBigintCompact(auth.nonce),
	];
	const rlpEncoded = Rlp.encode.call(fields);

	// Prepend magic byte
	const data = new Uint8Array(1 + rlpEncoded.length);
	data[0] = MAGIC;
	data.set(rlpEncoded, 1);

	return Keccak256.hash(data);
}
