/**
 * @fileoverview Effect Schema for EIP-55 checksummed Ethereum addresses.
 * Provides transformation from AddressType to checksummed hex string format.
 * 
 * @module ChecksummedAddressSchema
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as Schema from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import * as Effect from 'effect/Effect'
import { KeccakService } from '../../crypto/Keccak256/KeccakService.js'

/**
 * Internal schema declaration for AddressType.
 * Validates that a value is a 20-byte Uint8Array with the Address brand.
 * 
 * @internal
 */
const AddressTypeSchema = Schema.declare<AddressType>(
  (u): u is AddressType => u instanceof Uint8Array && u.length === 20,
  { identifier: 'AddressType' }
)

/**
 * Effect Schema for converting addresses to EIP-55 checksummed format.
 * 
 * @description
 * Transforms AddressType to a checksummed hex string following the EIP-55
 * specification. The checksum is computed by hashing the lowercase hex
 * representation and using the hash to determine character casing.
 * 
 * This schema requires {@link KeccakService} in the Effect context for
 * computing the keccak256 hash used in the checksum algorithm.
 * 
 * The schema is bidirectional:
 * - **Decode**: Converts AddressType to checksummed hex string (e.g., "0x5aAeb6...C2B2Db")
 * - **Encode**: Parses a hex string back to AddressType (validates address format)
 * 
 * @example Basic usage with Effect context
 * ```typescript
 * import { ChecksummedAddressSchema } from 'voltaire-effect/primitives/Address'
 * import { KeccakService, KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * import * as Schema from 'effect/Schema'
 * import * as Effect from 'effect/Effect'
 * 
 * const program = Schema.decode(ChecksummedAddressSchema)(addressBytes)
 * const checksummed = await Effect.runPromise(
 *   program.pipe(Effect.provide(KeccakLive))
 * )
 * // checksummed is "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"
 * ```
 * 
 * @example With manual service provision
 * ```typescript
 * import { ChecksummedAddressSchema } from 'voltaire-effect/primitives/Address'
 * import { KeccakService } from 'voltaire-effect/crypto/Keccak256'
 * import * as Schema from 'effect/Schema'
 * import * as Effect from 'effect/Effect'
 * 
 * const keccakImpl = {
 *   hash: (data: Uint8Array) => Effect.succeed(keccak256(data))
 * }
 * 
 * const checksummed = await Effect.runPromise(
 *   Schema.decode(ChecksummedAddressSchema)(addressBytes).pipe(
 *     Effect.provideService(KeccakService, keccakImpl)
 *   )
 * )
 * ```
 * 
 * @example Encoding (parsing checksummed string to AddressType)
 * ```typescript
 * import { ChecksummedAddressSchema } from 'voltaire-effect/primitives/Address'
 * import * as Schema from 'effect/Schema'
 * 
 * const addr = Schema.encodeSync(ChecksummedAddressSchema)('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')
 * // addr is AddressType
 * ```
 * 
 * @throws {ParseError} When encoding and the input string is not a valid address.
 * 
 * @see {@link AddressSchema} for basic address parsing without checksum
 * @see {@link toChecksummed} for Effect-based checksum conversion
 * @see {@link https://eips.ethereum.org/EIPS/eip-55 | EIP-55} for checksum specification
 * 
 * @since 0.0.1
 */
export const ChecksummedAddressSchema: Schema.Schema<
  string,
  AddressType,
  KeccakService
> = Schema.transformOrFail(
  AddressTypeSchema,
  Schema.String,
  {
    strict: true,
    decode: (addr, _options, _ast) => {
      return Effect.gen(function* () {
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
    },
    encode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(Address(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    }
  }
)
