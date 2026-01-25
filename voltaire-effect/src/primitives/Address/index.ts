/**
 * @fileoverview Address module for Ethereum addresses.
 * Provides Effect-based schemas and functions for address validation, parsing,
 * and format conversion including EIP-55 checksum support.
 * 
 * @module Address
 * @since 0.0.1
 * 
 * @description
 * This module wraps Voltaire's Address primitives with Effect.ts integration,
 * providing type-safe schemas for validation and Effect-based functions that
 * return errors in the Effect channel instead of throwing.
 * 
 * ## Key Features
 * 
 * - **Schema Validation**: Use Effect Schema for parsing and validating addresses
 * - **Multiple Input Formats**: Parse from hex strings, bytes, numbers, or bigints
 * - **EIP-55 Checksums**: Convert to and validate checksummed address format
 * - **Never-Throw Functions**: All fallible operations return Effects
 * 
 * ## Schemas
 * 
 * | Schema | From | To | Description |
 * |--------|------|-----|-------------|
 * | {@link AddressSchema} | `string` | `AddressType` | Hex string to address |
 * | {@link AddressFromBytesSchema} | `Uint8Array` | `AddressType` | Bytes to address |
 * | {@link ChecksummedAddressSchema} | `AddressType` | `string` | Address to checksummed hex |
 * 
 * ## Functions
 * 
 * | Function | Description |
 * |----------|-------------|
 * | {@link from} | Create address from string, bytes, number, or bigint |
 * | {@link fromBytes} | Create address from 20-byte array |
 * | {@link toBytes} | Convert address to 20-byte array |
 * | {@link toChecksummed} | Convert address to EIP-55 checksummed hex |
 * 
 * @example Basic address creation
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as Effect from 'effect/Effect'
 * 
 * const addr = await Effect.runPromise(
 *   Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 * )
 * ```
 * 
 * @example Schema-based validation
 * ```typescript
 * import { AddressSchema } from 'voltaire-effect/primitives/Address'
 * import * as Schema from 'effect/Schema'
 * 
 * const addr = Schema.decodeSync(AddressSchema)('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 * ```
 * 
 * @example Checksummed output
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as Effect from 'effect/Effect'
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
 * // "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"
 * ```
 * 
 * @example Error handling
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as Effect from 'effect/Effect'
 * 
 * const result = await Effect.runPromiseExit(Address.from('invalid'))
 * if (result._tag === 'Failure') {
 *   console.error('Invalid address:', result.cause)
 * }
 * ```
 * 
 * @example Round-trip conversion
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as Effect from 'effect/Effect'
 * 
 * const program = Effect.gen(function* () {
 *   const addr = yield* Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 *   const bytes = Address.toBytes(addr)
 *   const restored = yield* Address.fromBytes(bytes)
 *   return restored
 * })
 * ```
 * 
 * @see {@link https://eips.ethereum.org/EIPS/eip-55 | EIP-55} for checksum specification
 * @see {@link https://ethereum.org/en/developers/docs/accounts/ | Ethereum Accounts} for address format
 */

/**
 * Schema for validating and parsing Ethereum addresses from hex strings.
 * @see {@link ./AddressSchema.ts} for full documentation
 */
export { AddressSchema } from './AddressSchema.js'

/**
 * Schema for validating and parsing Ethereum addresses from byte arrays.
 * @see {@link ./AddressFromBytesSchema.ts} for full documentation
 */
export { AddressFromBytesSchema } from './AddressFromBytesSchema.js'

/**
 * Schema for converting addresses to EIP-55 checksummed format.
 * @see {@link ./ChecksummedAddressSchema.ts} for full documentation
 */
export { ChecksummedAddressSchema } from './ChecksummedAddressSchema.js'

/**
 * Creates an address from various input formats (string, bytes, number, bigint).
 * @see {@link ./from.ts} for full documentation
 */
export { from } from './from.js'

/**
 * Creates an address from a 20-byte Uint8Array.
 * @see {@link ./fromBytes.ts} for full documentation
 */
export { fromBytes } from './fromBytes.js'

/**
 * Converts an address to its 20-byte representation.
 * @see {@link ./toBytes.ts} for full documentation
 */
export { toBytes } from './toBytes.js'

/**
 * Converts an address to EIP-55 checksummed hex format.
 * @see {@link ./toChecksummed.ts} for full documentation
 */
export { toChecksummed } from './toChecksummed.js'

/**
 * Creates an address from a hex string.
 * @see {@link ./fromHex.ts} for full documentation
 */
export { fromHex } from './fromHex.js'

/**
 * Creates an address from a number or bigint.
 * @see {@link ./fromNumber.ts} for full documentation
 */
export { fromNumber } from './fromNumber.js'

/**
 * Creates an address from a base64-encoded string.
 * @see {@link ./fromBase64.ts} for full documentation
 */
export { fromBase64 } from './fromBase64.js'

/**
 * Creates an address from a secp256k1 public key.
 * @see {@link ./fromPublicKey.ts} for full documentation
 */
export { fromPublicKey } from './fromPublicKey.js'

/**
 * Creates an address from a secp256k1 private key.
 * @see {@link ./fromPrivateKey.ts} for full documentation
 */
export { fromPrivateKey } from './fromPrivateKey.js'

/**
 * Creates an address from ABI-encoded bytes.
 * @see {@link ./fromAbiEncoded.ts} for full documentation
 */
export { fromAbiEncoded } from './fromAbiEncoded.js'

/**
 * Converts an address to hex string.
 * @see {@link ./toHex.ts} for full documentation
 */
export { toHex } from './toHex.js'

/**
 * Converts an address to lowercase hex string.
 * @see {@link ./toLowercase.ts} for full documentation
 */
export { toLowercase } from './toLowercase.js'

/**
 * Converts an address to uppercase hex string.
 * @see {@link ./toUppercase.ts} for full documentation
 */
export { toUppercase } from './toUppercase.js'

/**
 * Converts an address to bigint (U256).
 * @see {@link ./toU256.ts} for full documentation
 */
export { toU256 } from './toU256.js'

/**
 * Converts an address to ABI-encoded bytes.
 * @see {@link ./toAbiEncoded.ts} for full documentation
 */
export { toAbiEncoded } from './toAbiEncoded.js'

/**
 * Converts an address to shortened hex format.
 * @see {@link ./toShortHex.ts} for full documentation
 */
export { toShortHex } from './toShortHex.js'

/**
 * Checks if an address is the zero address.
 * @see {@link ./isZero.ts} for full documentation
 */
export { isZero } from './isZero.js'

/**
 * Checks if two addresses are equal.
 * @see {@link ./equals.ts} for full documentation
 */
export { equals } from './equals.js'

/**
 * Compares two addresses.
 * @see {@link ./compare.ts} for full documentation
 */
export { compare } from './compare.js'

/**
 * Checks if first address is less than second.
 * @see {@link ./lessThan.ts} for full documentation
 */
export { lessThan } from './lessThan.js'

/**
 * Checks if first address is greater than second.
 * @see {@link ./greaterThan.ts} for full documentation
 */
export { greaterThan } from './greaterThan.js'

/**
 * Creates a copy of an address.
 * @see {@link ./clone.ts} for full documentation
 */
export { clone } from './clone.js'

/**
 * Checks if a value is a valid address.
 * @see {@link ./isValid.ts} for full documentation
 */
export { isValid } from './isValid.js'

/**
 * Checks if a string has valid EIP-55 checksum.
 * @see {@link ./isValidChecksum.ts} for full documentation
 */
export { isValidChecksum } from './isValidChecksum.js'
