/**
 * @module State
 * @description EVM state snapshots and storage.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as State from 'voltaire-effect/primitives/State'
 *
 * function readStorage(key: State.StorageKeyType) {
 *   // ...
 * }
 * ```
 *
 * @since 0.0.1
 */
export {
	Schema,
	type StorageKeyLike,
	StorageKeySchema,
	type StorageKeyType,
} from "./StateSchema.js";
