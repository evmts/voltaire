/**
 * @fileoverview Address to lowercase hex conversion.
 * @module toLowercase
 * @since 0.1.0
 */

import { Address, type AddressType } from "@tevm/voltaire/Address";

/**
 * Converts an Address to lowercase hex string.
 *
 * @param addr - The address to convert
 * @returns Lowercase hex string with "0x" prefix
 *
 * @example
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * const addr = S.decodeSync(Address.Hex)('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 * Address.toLowercase(addr) // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 *
 * @since 0.1.0
 */
export const toLowercase = (addr: AddressType): string =>
	Address.toLowercase(addr);
