import type { BrandedBytecode } from "./BrandedBytecode.js";
import type { Hash } from "../Hash/index.js";
import { Keccak256 } from "../../crypto/keccak256.js";

/**
 * Compute bytecode hash (keccak256)
 *
 * @param code - Bytecode to hash
 * @returns Bytecode hash (32 bytes)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * const codeHash = Bytecode.hash(code);
 * ```
 */
export function hash(code: BrandedBytecode): Hash {
	return Keccak256.hash(code) as Hash;
}
