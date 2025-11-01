import { Keccak256 } from "../../crypto/keccak256.js";
import type { Hash } from "../../Hash/index.js";
import type { EIP1559 } from "../types.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash
 */
export function hash(this: EIP1559): Hash {
	return Keccak256.hash(serialize.call(this));
}
