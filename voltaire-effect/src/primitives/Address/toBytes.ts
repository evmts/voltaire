/**
 * @fileoverview Converts addresses to their byte representation.
 * Provides a pure, synchronous function for extracting the 20-byte array from an address.
 * 
 * @module toBytes
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'

/**
 * Converts an Address to its 20-byte representation.
 * 
 * @description
 * This is a pure, synchronous function that extracts the underlying 20-byte
 * Uint8Array from an AddressType. Since AddressType is a branded Uint8Array,
 * this operation is always safe and never throws.
 * 
 * This function is useful when you need the raw bytes for:
 * - Hashing operations
 * - ABI encoding
 * - Binary serialization
 * - Comparison with other byte arrays
 * 
 * @param addr - The AddressType to convert. Must be a valid branded address.
 * @returns A 20-byte Uint8Array containing the address bytes.
 * 
 * @example Basic usage
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as Effect from 'effect/Effect'
 * 
 * const program = Effect.gen(function* () {
 *   const addr = yield* Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 *   const bytes = Address.toBytes(addr)
 *   // bytes is Uint8Array(20)
 * })
 * ```
 * 
 * @example Using with ABI encoding
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * 
 * function encodeTransfer(to: AddressType, amount: bigint): Uint8Array {
 *   const toBytes = Address.toBytes(to)
 *   // ... combine with other encoded parameters
 * }
 * ```
 * 
 * @example Round-trip conversion
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as Effect from 'effect/Effect'
 * 
 * const program = Effect.gen(function* () {
 *   const original = yield* Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 *   const bytes = Address.toBytes(original)
 *   const restored = yield* Address.fromBytes(bytes)
 *   // original and restored are equivalent
 * })
 * ```
 * 
 * @example Comparing addresses by bytes
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * 
 * function addressesEqual(a: AddressType, b: AddressType): boolean {
 *   const bytesA = Address.toBytes(a)
 *   const bytesB = Address.toBytes(b)
 *   return bytesA.every((byte, i) => byte === bytesB[i])
 * }
 * ```
 * 
 * @see {@link fromBytes} for the inverse operation
 * @see {@link AddressFromBytesSchema} for Schema-based byte conversion
 * @see {@link toChecksummed} for hex string output with checksum
 * 
 * @since 0.0.1
 */
export const toBytes = (addr: AddressType): Uint8Array => Address.toBytes(addr)
