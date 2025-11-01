import { HEX_SIZE } from "./constants.js";

/**
 * Check if string is valid address format (standard form)
 *
 * @param str - String to validate
 * @returns True if valid hex format (with or without 0x)
 *
 * @example
 * ```typescript
 * if (Address.isValid("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")) {
 *   const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * }
 * ```
 */
export function isValid(str: string): boolean {
  if (!str.startsWith("0x")) {
    return str.length === 40 && /^[0-9a-fA-F]{40}$/.test(str);
  }
  return str.length === HEX_SIZE && /^0x[0-9a-fA-F]{40}$/.test(str);
}
