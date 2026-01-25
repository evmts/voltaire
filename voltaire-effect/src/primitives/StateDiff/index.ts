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
	Schema,
	AccountDiffSchema,
	type AccountDiff,
	BalanceChangeSchema,
	type BalanceChange,
	NonceChangeSchema,
	type NonceChange,
	CodeChangeSchema,
	type CodeChange,
	type StateDiffType,
} from "./StateDiffSchema.js";
