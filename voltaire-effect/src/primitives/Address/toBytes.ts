/**
 * @fileoverview Address to bytes conversion.
 * @module toBytes
 * @since 0.1.0
 */

import { Address, type AddressType } from "@tevm/voltaire/Address";

/**
 * Converts an Address to its 20-byte representation.
 *
 * @param addr - The AddressType to convert
 * @returns A 20-byte Uint8Array
 *
 * @example
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * const addr = S.decodeSync(Address.Hex)('0x742d35cc6634c0532925a3b844bc9e7595f251e3')
 * const bytes = Address.toBytes(addr) // Uint8Array(20)
 * ```
 *
 * @since 0.1.0
 */
export const toBytes = (addr: AddressType): Uint8Array => Address.toBytes(addr);
