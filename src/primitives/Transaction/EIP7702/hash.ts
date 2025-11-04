import { Keccak256 } from "../../../crypto/keccak256.js";
import { Hash, type BrandedHash } from "../../Hash/index.js";
import type { BrandedTransactionEIP7702 } from "./BrandedTransactionEIP7702.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash
 */
export function hash(tx: BrandedTransactionEIP7702): BrandedHash {
	return Keccak256.hash(serialize(tx));
}
