/**
 * @fileoverview Stream module for Effect-wrapped streaming error types.
 *
 * @module stream
 * @since 0.2.12
 *
 * @description
 * Re-exports stream error types from voltaire core for use in Effect programs.
 * These errors are used by EventStream and BlockStream for consistent error handling.
 *
 * @example
 * ```typescript
 * import * as Stream from 'voltaire-effect/stream';
 *
 * const error = new Stream.BlockRangeTooLargeError(18000000n, 19000000n);
 * ```
 */

export {
	BlockRangeTooLargeError,
	BlockStreamAbortedError,
	EventStreamAbortedError,
	StreamAbortedError,
	UnrecoverableReorgError,
} from "@tevm/voltaire/stream";

/**
 * Union type of all stream errors for exhaustive pattern matching.
 *
 * @since 0.2.12
 */
export type StreamError =
	| import("@tevm/voltaire/stream").StreamAbortedError
	| import("@tevm/voltaire/stream").EventStreamAbortedError
	| import("@tevm/voltaire/stream").BlockStreamAbortedError
	| import("@tevm/voltaire/stream").BlockRangeTooLargeError
	| import("@tevm/voltaire/stream").UnrecoverableReorgError;
