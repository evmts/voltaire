import type { Address } from "./Address.js";
import type { Hex } from "../Hex/index.js";

/**
 * Convert Address to hex string
 *
 * @returns Lowercase hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = Address.toHex.call(addr);
 * // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 */
export function toHex(this: Address): Hex {
  return `0x${Array.from(this, (b) => b.toString(16).padStart(2, "0")).join("")}` as Hex;
}
