import { Keccak256 } from "../../../crypto/keccak256.js";
import type { Hash } from "../../Hash/index.js";
import type { BrandedTransactionEIP4844 } from "./BrandedTransactionEIP4844.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash
 */
export function hash(tx: BrandedTransactionEIP4844): Hash {
	return Keccak256.hash(serialize(tx));
}
