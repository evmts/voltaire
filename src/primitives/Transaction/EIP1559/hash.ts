import { Keccak256 } from "../../../crypto/keccak256.js";
import type { Hash } from "../../Hash/index.js";
import type { BrandedTransactionEIP1559 } from "./BrandedTransactionEIP1559.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash
 */
export function hash(tx: BrandedTransactionEIP1559): Hash {
	return Keccak256.hash(serialize(tx));
}
