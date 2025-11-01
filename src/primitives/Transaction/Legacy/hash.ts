import { Keccak256 } from "../../crypto/keccak256.js";
import type { Hash } from "../../Hash/index.js";
import type { Legacy } from "../types.js";
import { serialize } from "./serialize.js";

/**
 * Compute transaction hash (keccak256 of serialized transaction)
 */
export function hash(this: Legacy): Hash {
	return Keccak256.hash(serialize.call(this));
}
