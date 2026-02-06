/**
 * @fileoverview Address to short hex conversion.
 * @module toShortHex
 * @since 0.1.0
 */

import { Address, type AddressType } from "@tevm/voltaire/Address";

/**
 * Converts an Address to shortened hex format (e.g., "0x742d...51e3").
 *
 * @param addr - The address to convert
 * @returns Shortened hex string
 *
 * @example
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * const addr = S.decodeSync(Address.Hex)('0x742d35cc6634c0532925a3b844bc9e7595f251e3')
 * Address.toShortHex(addr) // "0x742d...51e3"
 * ```
 *
 * @since 0.1.0
 */
export const toShortHex = (addr: AddressType): string =>
	Address.toShortHex(addr);
