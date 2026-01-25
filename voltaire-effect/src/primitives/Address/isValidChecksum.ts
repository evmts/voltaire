/**
 * @fileoverview EIP-55 checksum validation.
 * @module isValidChecksum
 * @since 0.1.0
 */

import { Address } from "@tevm/voltaire/Address";

/**
 * Checks if a string has valid EIP-55 checksum.
 *
 * @param value - Hex string to validate
 * @returns true if the checksum is valid
 *
 * @example
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 *
 * Address.isValidChecksum('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed') // true
 * Address.isValidChecksum('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed') // false
 * ```
 *
 * @since 0.1.0
 */
export const isValidChecksum = (value: string): boolean =>
	Address.isValidChecksum(value);
