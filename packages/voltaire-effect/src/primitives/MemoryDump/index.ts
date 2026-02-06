/**
 * MemoryDump module for working with EVM memory state in Effect.
 * Memory dumps capture the state of EVM memory during execution or debugging.
 *
 * @example
 * ```typescript
 * import * as MemoryDump from 'voltaire-effect/MemoryDump'
 * import * as Effect from 'effect/Effect'
 *
 * // Create a memory dump
 * const dump = Effect.runSync(MemoryDump.from(new Uint8Array([0, 1, 2, 3])))
 *
 * // Using the Schema for validation
 * import * as S from 'effect/Schema'
 * const parsed = S.decodeSync(MemoryDump.MemoryDumpSchema)(new Uint8Array(32))
 * ```
 *
 * @since 0.0.1
 * @module
 */

export { MemoryDumpSchema } from "./MemoryDumpSchema.js";
