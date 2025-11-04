import { Keccak256 } from "../../../crypto/keccak256.js";
import type { Hash } from "../../Hash/index.js";
import type { BrandedTransactionEIP2930 } from "./BrandedTransactionEIP2930.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash
 */
export function hash(tx: BrandedTransactionEIP2930): Hash {
	return Keccak256.hash(serialize(tx));
}
