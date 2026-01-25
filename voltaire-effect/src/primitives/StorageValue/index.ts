/**
 * @fileoverview Effect-based module for EVM storage value management.
 * @module StorageValue
 *
 * @description
 * This module provides Effect-based utilities for working with EVM storage values.
 * Storage values are 32-byte values that can be stored in contract storage slots.
 *
 * Key features:
 * - Type-safe storage value creation with Effect error handling
 * - Schema-based validation using Effect Schema
 * - Support for multiple input formats (bigint, hex, bytes)
 * - Zero value creation for cleared slots
 *
 * EVM Storage Values:
 * - Fixed 32 bytes (256 bits) per slot
 * - Big-endian byte ordering
 * - Commonly represent uint256, int256, addresses, booleans
 * - Zero indicates uninitialized or cleared
 *
 * Common use cases:
 * - Token balances (uint256)
 * - Contract state variables
 * - Mapping values
 * - Packed struct data
 *
 * @example
 * ```typescript
 * import { StorageValue } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create value from bigint (e.g., token balance)
 *   const balance = yield* StorageValue.from(1000000000000000000n)
 *
 *   // Create zero value (cleared slot)
 *   const cleared = StorageValue.zero()
 *
 *   // Create from hex string
 *   const fromHex = yield* StorageValue.from('0x...')
 *
 *   // Create from bigint specifically
 *   const fromBigInt = yield* StorageValue.fromBigInt(42n)
 *
 *   console.log('Balance length:', balance.length) // 32
 *   return balance
 * })
 * ```
 *
 * @see {@link https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html} Solidity Storage Layout
 * @see {@link https://ethereum.org/en/developers/docs/evm/} EVM Documentation
 *
 * @since 0.0.1
 */
import type { Bytes32Type } from "@tevm/voltaire/Bytes";

export {
	StorageValueSchema,
	type StorageValueType,
} from "./Hex.js";

/**
 * Union type for values that can be converted to a StorageValue.
 *
 * @description
 * Accepts various input formats that can be normalized into a StorageValueType:
 * - Hex strings (with or without 0x prefix)
 * - Uint8Array (must be 32 bytes)
 * - bigint (will be padded to 32 bytes)
 * - number (will be padded to 32 bytes)
 * - Existing StorageValueType values
 *
 * @since 0.0.1
 */
export type StorageValueLike =
	| StorageValueType
	| string
	| Uint8Array
	| bigint
	| number;

type StorageValueType = Bytes32Type & { readonly __tag: "StorageValue" };
