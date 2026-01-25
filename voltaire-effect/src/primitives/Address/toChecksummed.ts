/**
 * @fileoverview Effect-based EIP-55 checksummed address conversion.
 * Provides a function that converts addresses to their checksummed hex representation.
 * 
 * @module toChecksummed
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'
import { KeccakService } from '../../crypto/Keccak256/KeccakService.js'

/**
 * Converts an Address to EIP-55 checksummed hex format.
 * 
 * @description
 * This function produces a checksummed hex string following the EIP-55
 * specification. The checksum encodes validity information in the casing
 * of the hex characters, allowing detection of typos in addresses.
 * 
 * The algorithm:
 * 1. Convert address to lowercase hex (without 0x prefix)
 * 2. Hash the lowercase hex with keccak256
 * 3. For each hex character, if the corresponding nibble in the hash is >= 8,
 *    uppercase the character; otherwise lowercase
 * 
 * This function requires {@link KeccakService} in the Effect context because
 * the checksum computation needs keccak256 hashing.
 * 
 * @param addr - The AddressType to convert to checksummed format.
 * @returns An Effect that yields the checksummed hex string (e.g., "0x5aAeb6...").
 *   Requires KeccakService in the Effect context. Never fails (error channel is `never`).
 * 
 * @example Basic usage with KeccakLive
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import { KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * 
 * const program = Effect.gen(function* () {
 *   const addr = yield* Address.from('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')
 *   return yield* Address.toChecksummed(addr)
 * })
 * 
 * const checksummed = await Effect.runPromise(
 *   program.pipe(Effect.provide(KeccakLive))
 * )
 * // checksummed is "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"
 * ```
 * 
 * @example With manual service provision
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import { KeccakService } from 'voltaire-effect/crypto/Keccak256'
 * 
 * const keccakImpl = KeccakService.of({
 *   hash: (data) => Effect.succeed(keccak256(data))
 * })
 * 
 * const checksummed = await Effect.runPromise(
 *   Address.toChecksummed(addr).pipe(
 *     Effect.provideService(KeccakService, keccakImpl)
 *   )
 * )
 * ```
 * 
 * @example Using in a pipeline
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Address from 'voltaire-effect/primitives/Address'
 * 
 * const formatAddress = (input: string) =>
 *   Address.from(input).pipe(
 *     Effect.flatMap(Address.toChecksummed),
 *     Effect.provide(KeccakLive)
 *   )
 * 
 * const display = await Effect.runPromise(formatAddress('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed'))
 * // "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"
 * ```
 * 
 * @example Validating an existing checksummed address
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Address from 'voltaire-effect/primitives/Address'
 * 
 * const isValidChecksum = (input: string) =>
 *   Effect.gen(function* () {
 *     const addr = yield* Address.from(input)
 *     const checksummed = yield* Address.toChecksummed(addr)
 *     return input === checksummed
 *   }).pipe(Effect.provide(KeccakLive))
 * ```
 * 
 * @see {@link ChecksummedAddressSchema} for Schema-based checksummed output
 * @see {@link toBytes} for byte array output
 * @see {@link https://eips.ethereum.org/EIPS/eip-55 | EIP-55} for checksum specification
 * 
 * @since 0.0.1
 */
export const toChecksummed = (addr: AddressType): Effect.Effect<string, never, KeccakService> =>
  Effect.gen(function* () {
    const keccak = yield* KeccakService
    const hex = Address.toHex(addr)
    const addrLower = hex.slice(2).toLowerCase()
    const hashResult = yield* keccak.hash(new TextEncoder().encode(addrLower))
    
    let checksummed = '0x'
    for (let i = 0; i < addrLower.length; i++) {
      const char = addrLower[i]!
      const hashByte = hashResult[Math.floor(i / 2)]!
      const hashNibble = i % 2 === 0 ? hashByte >> 4 : hashByte & 0x0f
      checksummed += hashNibble >= 8 ? char.toUpperCase() : char
    }
    return checksummed
  })
