import type { Address } from "./Address.js";
import * as Hex from "../Hex/index.js";
import * as Hash from "../Hash/index.js";
import * as AddressModule from "./Address.js";

/**
 * EIP-55 checksummed address
 */
export type Checksummed = Hex.Sized<20> & { readonly __tag: 'Hex'; readonly __variant: 'Address'; readonly __checksummed: true };

/**
 * Create checksummed address from Address
 *
 * @param addr - Address to checksum
 * @returns Checksummed address hex string
 *
 * @example
 * ```typescript
 * const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
 * const checksummed = ChecksumAddress.from(addr);
 * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
 * ```
 */
export function from(addr: Address): Checksummed {
  const lower = AddressModule.toHex.call(addr).slice(2);
  const hashBytes = Hash.keccak256(new TextEncoder().encode(lower)) as unknown as Uint8Array;
  const hashHex = Array.from(hashBytes, (b) => b.toString(16).padStart(2, "0")).join("");
  let result = "0x";
  for (let i = 0; i < 40; i++) {
    const ch = lower[i];
    if (ch !== undefined && ch >= "a" && ch <= "f") {
      const hv = Number.parseInt(hashHex[i] ?? "0", 16);
      result += hv >= 8 ? ch.toUpperCase() : ch;
    } else {
      result += ch ?? "";
    }
  }
  return result as Checksummed;
}

/**
 * Check if string has valid EIP-55 checksum
 *
 * @param str - Address string to validate
 * @returns True if checksum is valid
 *
 * @example
 * ```typescript
 * if (ChecksumAddress.isValid("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")) {
 *   console.log("Valid checksum");
 * }
 * ```
 */
export function isValid(str: string): boolean {
  if (!AddressModule.isValid(str)) return false;
  try {
    const addr = AddressModule.fromHex(str.startsWith("0x") ? str : `0x${str}`);
    const checksummed = from(addr) as string;
    return checksummed === (str.startsWith("0x") ? str : `0x${str}`);
  } catch {
    return false;
  }
}
