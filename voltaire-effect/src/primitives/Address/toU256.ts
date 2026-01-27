/**
 * @fileoverview Address to U256 conversion.
 * @module toU256
 * @since 0.1.0
 */

import { Address, type AddressType } from "@tevm/voltaire/Address";
import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Converts an Address to a Uint256.
 *
 * @param addr - The address to convert
 * @returns The Uint256 representation of the address
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
export const toU256 = (addr: AddressType): Uint256Type =>
	Uint256.fromBigInt(Address.toU256(addr));
