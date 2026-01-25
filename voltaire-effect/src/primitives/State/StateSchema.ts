/**
 * @fileoverview Effect Schema definitions for Ethereum storage keys.
 * Provides validation schemas for storage key structures.
 * @module State/StateSchema
 * @since 0.0.1
 */

import type { State } from "@tevm/voltaire";
import * as S from "effect/Schema";

/**
 * Branded type representing a storage key (address + slot combination).
 * Used to identify a specific storage location in an Ethereum account.
 *
 * @description
 * A StorageKey uniquely identifies a storage slot by combining:
 * - address: The 20-byte account address
 * - slot: The storage slot number as a bigint
 *
 * This is the primary type for referencing storage locations in the EVM.
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 *
 * // StorageKeyType contains address and slot
 * const key: StorageKeyType = {
 *   address: new Uint8Array(20),
 *   slot: 0n
 * }
 * ```
 *
 * @since 0.0.1
 */
export type StorageKeyType = State.StorageKeyType;

/**
 * Union type for values that can be converted to a StorageKey.
 *
 * @description
 * Accepts various input formats that can be normalized into a StorageKeyType:
 * - Direct StorageKeyType objects
 * - Objects with address and slot properties in various formats
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 *
 * // All of these are valid StorageKeyLike values
 * const key1: StorageKeyLike = { address: new Uint8Array(20), slot: 0n }
 * const key2: StorageKeyLike = { address: '0x...', slot: 5n }
 * ```
 *
 * @since 0.0.1
 */
export type StorageKeyLike = State.StorageKeyLike;

/**
 * Effect Schema for validating storage key structure.
 * A storage key consists of an address and a slot number.
 *
 * @description
 * This schema validates that a storage key has the correct structure:
 * - address: Must be a Uint8Array (typically 20 bytes)
 * - slot: Must be a bigint representing the storage slot number
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { StorageKeySchema } from 'voltaire-effect/primitives/State'
 *
 * const validate = S.is(StorageKeySchema)
 * const isValid = validate({
 *   address: new Uint8Array(20),
 *   slot: 0n
 * })
 * console.log(isValid) // true
 * ```
 *
 * @throws {ParseError} When the input doesn't match the expected structure
 *
 * @see {@link StorageKeyType} for the validated type
 * @see {@link from} for Effect-based creation
 *
 * @since 0.0.1
 */
export const StorageKeySchema = S.Struct({
	address: S.Uint8ArrayFromSelf,
	slot: S.BigIntFromSelf,
}).annotations({ identifier: "StorageKey" });

/**
 * Effect Schema for validating storage keys.
 * Alias for StorageKeySchema for consistent API.
 *
 * @description
 * This is an alias export that provides a consistent naming pattern
 * across all primitive modules. Use `Schema` or `StorageKeySchema`
 * interchangeably.
 *
 * @example
 * ```typescript
 * import { Schema } from 'voltaire-effect/primitives/State'
 * import * as S from 'effect/Schema'
 *
 * const parse = S.decodeSync(Schema)
 * const key = parse({ address: new Uint8Array(20), slot: 0n })
 * ```
 *
 * @since 0.0.1
 */
export const Schema = StorageKeySchema;
