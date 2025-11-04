import { Keccak256 } from "../../../crypto/keccak256.js";
import type { Hash } from "../../Hash/index.js";
import type { BrandedTransactionLegacy } from "./BrandedTransactionLegacy.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash (keccak256 of serialized transaction)
 */
export function hash(tx: BrandedTransactionLegacy): Hash {
	return Keccak256.hash(serialize(tx));
}
