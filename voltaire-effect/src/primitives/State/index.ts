/**
 * @fileoverview Effect-based module for Ethereum state and storage keys.
 * @module State
 *
 * @description
 * This module provides Effect-based utilities for working with Ethereum
 * storage keys. Storage keys identify specific storage locations in
 * Ethereum account storage, combining an account address with a slot number.
 *
 * Key features:
 * - Type-safe storage key creation with Effect error handling
 * - Schema-based validation using Effect Schema
 * - Conversion utilities (toString, fromString)
 * - Equality comparison and hashing
 *
 * Storage keys are fundamental to accessing contract storage in the EVM.
 * Each storage slot is identified by a 256-bit key, and this module provides
 * utilities for working with these keys in a type-safe manner.
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create storage key from address and slot
 *   const key = yield* State.create(
 *     '0x1234567890123456789012345678901234567890',
 *     0n
 *   )
 *
 *   // Convert to string representation
 *   const str = State.toString(key)
 *   console.log(str) // "0x1234...:0"
 *
 *   // Parse back from string
 *   const parsed = State.fromString(str)
 *
 *   // Compare keys
 *   console.log(State.equals(key, parsed)) // true
 *
 *   return key
 * })
 * ```
 *
 * @see {@link https://ethereum.org/en/developers/docs/evm/} EVM Documentation
 *
 * @since 0.0.1
 */
export { Schema, StorageKeySchema, type StorageKeyType, type StorageKeyLike } from './StateSchema.js'
export { from, create, toString, fromString, equals, hashCode, is, StateError } from './from.js'
