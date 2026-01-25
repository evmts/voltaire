/**
 * @fileoverview Effect-based module for EVM storage diff management.
 * @module StorageDiff
 *
 * @description
 * This module provides Effect-based utilities for working with storage diffs.
 * Storage diffs track changes to contract storage slots, recording the before
 * and after values for modified slots.
 *
 * Key features:
 * - Type-safe storage diff creation with Effect error handling
 * - Schema-based validation using Effect Schema
 * - Tracks changes at the per-slot level
 *
 * Storage diffs are essential for:
 * - Transaction simulation and analysis
 * - State synchronization between nodes
 * - Debugging storage modifications
 * - Generating storage proofs
 *
 * Change tracking patterns:
 * - { from: null, to: value } - Slot created
 * - { from: value, to: null } - Slot deleted (zeroed)
 * - { from: val1, to: val2 } - Slot modified
 *
 * @example
 * ```typescript
 * import { StorageDiff, Storage, StorageValue } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create storage slot and values
 *   const slot = yield* Storage.from(0n)
 *   const oldValue = yield* StorageValue.from(100n)
 *   const newValue = yield* StorageValue.from(200n)
 *
 *   // Create storage diff tracking the change
 *   const diff = yield* StorageDiff.from(
 *     addressBytes,
 *     new Map([
 *       [slot, { from: oldValue, to: newValue }]
 *     ])
 *   )
 *
 *   // Inspect changes
 *   console.log('Address:', diff.address)
 *   console.log('Number of changes:', diff.changes.size)
 *
 *   return diff
 * })
 * ```
 *
 * @see {@link https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html} Solidity Storage Layout
 * @see {@link https://ethereum.org/en/developers/docs/evm/} EVM Documentation
 *
 * @since 0.0.1
 */

export { StorageDiffSchema } from "./StorageDiffSchema.js";
