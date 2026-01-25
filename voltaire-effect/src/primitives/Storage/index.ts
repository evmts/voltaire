/**
 * @fileoverview Effect-based module for EVM storage slot management.
 * @module Storage
 *
 * @description
 * This module provides Effect-based utilities for working with EVM storage slots.
 * Storage slots are 32-byte values that identify locations in contract storage,
 * part of Ethereum's key-value storage model.
 *
 * Key features:
 * - Type-safe storage slot creation with Effect error handling
 * - Schema-based validation using Effect Schema
 * - Support for multiple input formats (bigint, hex, bytes)
 *
 * EVM Storage Model:
 * - Each contract has 2^256 possible storage slots
 * - Each slot holds a 32-byte value
 * - Slots are accessed via SLOAD/SSTORE opcodes
 * - Solidity uses specific patterns for variable layout
 *
 * Solidity Storage Layout:
 * - State variables: sequential slots (0, 1, 2, ...)
 * - Mappings: keccak256(key . slot)
 * - Dynamic arrays: keccak256(slot) + index
 * - Structs: packed into consecutive slots
 *
 * @example
 * ```typescript
 * import { Storage } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // Access first storage slot (slot 0)
 *   const slot0 = yield* Storage.from(0n)
 *
 *   // Access slot 5
 *   const slot5 = yield* Storage.from(5n)
 *
 *   // From hex string
 *   const slotHex = yield* Storage.from('0x0')
 *
 *   console.log('Slot length:', slot0.length) // 32
 *   return slot0
 * })
 * ```
 *
 * @see {@link https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html} Solidity Storage Layout
 * @see {@link https://ethereum.org/en/developers/docs/evm/} EVM Documentation
 *
 * @since 0.0.1
 */

export { StorageSlotSchema } from "./StorageSchema.js";
