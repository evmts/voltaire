import * as Rlp from "../../Rlp/index.js";
import type { BrandedTransactionLegacy } from "./BrandedTransactionLegacy.js";
import { encodeAddress, encodeBigintCompact } from "../utils.js";

/**
 * Serialize legacy transaction to RLP encoded bytes
 */
export function serialize(tx: BrandedTransactionLegacy): Uint8Array {
	const fields = [
		encodeBigintCompact(tx.nonce),
		encodeBigintCompact(tx.gasPrice),
		encodeBigintCompact(tx.gasLimit),
		encodeAddress(tx.to),
		encodeBigintCompact(tx.value),
		tx.data,
		encodeBigintCompact(tx.v),
		tx.r,
		tx.s,
	];
	return Rlp.encode(fields);
}
