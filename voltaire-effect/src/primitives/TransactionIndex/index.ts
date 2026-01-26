/**
 * @module TransactionIndex
 * @description Effect Schemas for transaction indices (zero-based position within a block).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as TransactionIndex from 'voltaire-effect/primitives/TransactionIndex'
 *
 * function findTransaction(index: TransactionIndex.TransactionIndexType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `TransactionIndex.Number` | number | TransactionIndexType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as TransactionIndex from 'voltaire-effect/primitives/TransactionIndex'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const index = S.decodeSync(TransactionIndex.Number)(5)
 *
 * // Encode (format output)
 * const num = S.encodeSync(TransactionIndex.Number)(index)
 * ```
 *
 * ## Pure Functions
 *
 * - `equals(a, b)` - Compare two transaction indices
 * - `toNumber(idx)` - Convert to number
 *
 * @since 0.1.0
 */

// Schemas
export { Number } from "./Number.js";

// Re-export pure functions from voltaire
import { TransactionIndex } from "@tevm/voltaire";

export const equals = TransactionIndex.equals;
export const toNumber = TransactionIndex.toNumber;

// Type export
import type { TransactionIndex as _TransactionIndex } from "@tevm/voltaire";
export type TransactionIndexType = ReturnType<typeof _TransactionIndex.from>;
