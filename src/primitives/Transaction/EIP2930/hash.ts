import { Keccak256 } from "../../../crypto/keccak256.js";
import { Hash, type BrandedHash } from "../../Hash/index.js";
import type { BrandedTransactionEIP2930 } from "./BrandedTransactionEIP2930.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash
 */
export function hash(tx: BrandedTransactionEIP2930): BrandedHash {
	return Keccak256.hash(serialize(tx));
}
