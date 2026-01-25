/**
 * @module RevertReason
 * @description Effect Schemas for EVM revert reason parsing.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as RevertReason from 'voltaire-effect/primitives/RevertReason'
 *
 * function handleRevert(reason: RevertReason.RevertReasonType) {
 *   // ...
 * }
 * ```
 *
 * Parses revert data into typed reasons: Error(string), Panic(uint256),
 * Custom errors, or Unknown.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `RevertReason.Hex` | hex string | RevertReasonType |
 * | `RevertReason.Bytes` | Uint8Array | RevertReasonType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as RevertReason from 'voltaire-effect/primitives/RevertReason'
 * import * as S from 'effect/Schema'
 *
 * const reason = S.decodeSync(RevertReason.Hex)('0x08c379a0...')
 *
 * switch (reason.type) {
 *   case 'Error':
 *     console.log('Revert:', reason.message)
 *     break
 *   case 'Panic':
 *     console.log('Panic code:', reason.code)
 *     break
 *   case 'Custom':
 *     console.log('Custom error:', reason.selector)
 *     break
 *   case 'Unknown':
 *     console.log('Unknown revert data')
 *     break
 * }
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * RevertReason.toString(reason)  // human-readable string
 * ```
 *
 * @since 0.1.0
 */

export { Bytes } from "./Bytes.js";
export { Hex } from "./Hex.js";
export {
	type CustomRevertReason,
	type ErrorRevertReason,
	type PanicRevertReason,
	type RevertReasonType,
	type UnknownRevertReason,
} from "./RevertReasonSchema.js";
export { toString } from "./toString.js";
