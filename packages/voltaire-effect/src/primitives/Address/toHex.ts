/**
 * @module toHex
 * @description Convert Address to lowercase hex string
 * @since 0.1.0
 */
import { Address, type AddressType } from "@tevm/voltaire/Address";
import type { HexType } from "@tevm/voltaire/Hex";

/**
 * Convert Address to lowercase hex string
 *
 * @param addr - Address to convert
 * @returns Lowercase hex string with 0x prefix
 * @example
 * ```typescript
 * Address.toHex(addr) // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 */
export const toHex = (addr: AddressType): HexType => Address.toHex(addr);
