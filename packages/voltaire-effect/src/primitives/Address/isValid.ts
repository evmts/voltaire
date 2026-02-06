/**
 * @fileoverview Address validity check.
 * @module isValid
 * @since 0.1.0
 */

import { Address } from "@tevm/voltaire/Address";

/**
 * Checks if a value is a valid Ethereum address string.
 *
 * @param value - The value to check
 * @returns true if the value is a valid address string
 *
 * @example
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 *
 * Address.isValid('0x742d35cc6634c0532925a3b844bc9e7595f251e3') // true
 * Address.isValid('invalid') // false
 * ```
 *
 * @since 0.1.0
 */
export const isValid = (value: string | Uint8Array): boolean =>
	Address.isValid(value);
