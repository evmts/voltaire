/**
 * @fileoverview Address cloning.
 * @module clone
 * @since 0.1.0
 */

import { Address, type AddressType } from "@tevm/voltaire/Address";

/**
 * Creates a copy of an Address.
 *
 * @param addr - The address to clone
 * @returns A new AddressType with the same value
 *
 * @example
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * const addr = S.decodeSync(Address.Hex)('0x742d35cc6634c0532925a3b844bc9e7595f251e3')
 * const cloned = Address.clone(addr)
 * ```
 *
 * @since 0.1.0
 */
export const clone = (addr: AddressType): AddressType => Address.clone(addr);
