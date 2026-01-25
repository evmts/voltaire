/**
 * @fileoverview Address to uppercase hex conversion.
 * @module toUppercase
 * @since 0.1.0
 */

import { Address, type AddressType } from "@tevm/voltaire/Address";

/**
 * Converts an Address to uppercase hex string.
 *
 * @param addr - The address to convert
 * @returns Uppercase hex string with "0x" prefix
 *
 * @example
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * const addr = S.decodeSync(Address.Hex)('0x742d35cc6634c0532925a3b844bc9e7595f251e3')
 * Address.toUppercase(addr) // "0X742D35CC6634C0532925A3B844BC9E7595F251E3"
 * ```
 *
 * @since 0.1.0
 */
export const toUppercase = (addr: AddressType): string =>
	Address.toUppercase(addr);
