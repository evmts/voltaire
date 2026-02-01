/**
 * @module isAddress
 * @description Check if value is a valid address (string or bytes)
 * @since 0.1.0
 */
import { Address } from "@tevm/voltaire/Address";

/**
 * Check if value is a valid Ethereum address
 *
 * Alias for isValid - checks if string or bytes is valid address format.
 *
 * @param value - Value to check
 * @returns True if valid address format
 * @example
 * ```typescript
 * Address.isAddress('0x742d35cc6634c0532925a3b844bc9e7595f251e3') // true
 * Address.isAddress('invalid') // false
 * ```
 */
export const isAddress = (value: string | Uint8Array): boolean =>
  Address.isValid(value);
