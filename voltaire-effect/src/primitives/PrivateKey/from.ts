/**
 * @fileoverview Effect-wrapped functions for creating PrivateKey instances.
 * Provides safe constructors that return Effect types for error handling.
 * @module PrivateKey/from
 * @since 0.0.1
 */

import { PrivateKey, type PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import { InvalidFormatError, InvalidLengthError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates a PrivateKey from a hex string using Effect for error handling.
 *
 * @description
 * Parses and validates a hexadecimal string representation of a private key.
 * The key must be exactly 32 bytes (64 hex characters) when decoded.
 * Supports both with and without '0x' prefix.
 *
 * @param hex - 64-character hex string (with or without 0x prefix)
 * @returns Effect that succeeds with PrivateKeyType or fails with InvalidFormatError/InvalidLengthError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 *
 * // With 0x prefix
 * const pk1 = PrivateKey.from('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')
 * const result = Effect.runSync(pk1)
 *
 * // Handle errors with Effect
 * const program = Effect.gen(function* () {
 *   const pk = yield* PrivateKey.from('0x...')
 *   return pk
 * })
 * ```
 *
 * @throws InvalidFormatError - When the hex string contains invalid characters
 * @throws InvalidLengthError - When the hex string is not exactly 64 characters
 * @see {@link fromBytes} for creating from raw bytes
 * @since 0.0.1
 */
export const from = (hex: string): Effect.Effect<PrivateKeyType, InvalidFormatError | InvalidLengthError> =>
  Effect.try({
    try: () => PrivateKey.from(hex),
    catch: (e) => e as InvalidFormatError | InvalidLengthError
  })

/**
 * Creates a PrivateKey from raw bytes using Effect for error handling.
 *
 * @description
 * Validates and creates a PrivateKeyType from a raw byte array.
 * The array must be exactly 32 bytes to be valid. This is useful
 * when working with binary data from files, network, or other sources.
 *
 * @param bytes - 32-byte Uint8Array containing the raw private key
 * @returns Effect that succeeds with PrivateKeyType or fails with InvalidFormatError/InvalidLengthError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 *
 * // Create from raw bytes
 * const bytes = new Uint8Array(32).fill(1)
 * const privateKey = PrivateKey.fromBytes(bytes)
 * const result = Effect.runSync(privateKey)
 *
 * // Chain with other operations
 * const program = Effect.gen(function* () {
 *   const pk = yield* PrivateKey.fromBytes(bytes)
 *   // Use pk for signing...
 *   return pk
 * })
 * ```
 *
 * @throws InvalidFormatError - When the bytes contain invalid data
 * @throws InvalidLengthError - When the array is not exactly 32 bytes
 * @see {@link from} for creating from hex strings
 * @since 0.0.1
 */
export const fromBytes = (bytes: Uint8Array): Effect.Effect<PrivateKeyType, InvalidFormatError | InvalidLengthError> =>
  Effect.try({
    try: () => PrivateKey.fromBytes(bytes),
    catch: (e) => e as InvalidFormatError | InvalidLengthError
  })
