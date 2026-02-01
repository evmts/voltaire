/**
 * @module ForkId
 *
 * @description
 * EIP-2124 fork identifier for chain compatibility checks.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as ForkId from 'voltaire-effect/primitives/ForkId'
 *
 * function validateFork(forkId: ForkId.ForkIdType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Schema` | ForkIdInput | ForkIdType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as ForkId from 'voltaire-effect/primitives/ForkId'
 * import * as S from 'effect/Schema'
 *
 * const forkId = S.decodeSync(ForkId.Schema)(input)
 * ```
 *
 * @since 0.1.0
 */
export { type ForkIdInput, type ForkIdType, Schema } from "./ForkIdSchema.js";
