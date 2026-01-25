/**
 * @fileoverview Address to U256 conversion.
 * @module toU256
 * @since 0.1.0
 */

import { Address, type AddressType } from "@tevm/voltaire/Address";

/**
 * Converts an Address to a bigint (U256).
 *
 * @param addr - The address to convert
 * @returns The bigint representation of the address
 *
 * @example
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * const addr = S.decodeSync(Address.Hex)('0x0000000000000000000000000000000000000001')
 * Address.toU256(addr) // 1n
 * ```
 *
 * @since 0.1.0
 */
export const toU256 = (addr: AddressType): bigint => Address.toU256(addr);
