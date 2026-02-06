/**
 * @module StateDiff
 * @description State differences between blocks.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as StateDiff from 'voltaire-effect/primitives/StateDiff'
 *
 * function applyAccountChange(diff: StateDiff.AccountDiff) {
 *   // ...
 * }
 * ```
 *
 * @since 0.0.1
 */
export {
	type AccountDiff,
	AccountDiffSchema,
	type BalanceChange,
	BalanceChangeSchema,
	type CodeChange,
	CodeChangeSchema,
	type NonceChange,
	NonceChangeSchema,
	Schema,
	type StateDiffType,
} from "./StateDiffSchema.js";
