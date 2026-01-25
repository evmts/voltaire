/**
 * @module BlockNumber
 * @description Effect Schemas for Ethereum block numbers (non-negative integers).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as BlockNumber from 'voltaire-effect/primitives/BlockNumber'
 *
 * function getBlockByNumber(num: BlockNumber.BlockNumberType): Block {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `BlockNumber.Number` | number | BlockNumberType |
 * | `BlockNumber.BigInt` | bigint | BlockNumberType |
 * | `BlockNumber.Hex` | hex string | BlockNumberType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as BlockNumber from 'voltaire-effect/primitives/BlockNumber'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const blockNum = S.decodeSync(BlockNumber.Number)(12345)
 *
 * // Encode (format output)
 * const num = S.encodeSync(BlockNumber.Number)(blockNum)
 * const hex = S.encodeSync(BlockNumber.Hex)(blockNum)
 * ```
 *
 * ## Pure Functions
 *
 * - `equals(a, b)` - Compare two block numbers
 * - `toBigInt(bn)` - Convert to bigint
 * - `toNumber(bn)` - Convert to number
 *
 * @since 0.1.0
 */

// Schemas
export { BigInt } from "./BigInt.js";
export { Hex } from "./Hex.js";
export { Number } from "./Number.js";

// Re-export pure functions from voltaire
import { BlockNumber } from "@tevm/voltaire";

export const equals = BlockNumber.equals;
export const toBigInt = BlockNumber.toBigInt;
export const toNumber = BlockNumber.toNumber;

// Type export
import { BlockNumber as _BlockNumber } from "@tevm/voltaire";
export type BlockNumberType = _BlockNumber.BlockNumberType;
