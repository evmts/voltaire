import { Keccak256 } from "../../../crypto/keccak256.js";
import { Hash, type BrandedHash } from "../../Hash/index.js";
import type { BrandedTransactionLegacy } from "./BrandedTransactionLegacy.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash (keccak256 of serialized transaction)
 */
export function hash(tx: BrandedTransactionLegacy): BrandedHash {
	return Keccak256.hash(serialize(tx));
}
