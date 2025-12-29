/**
 * Stream Module
 *
 * Shared utilities and errors for EventStream and BlockStream.
 *
 * @module stream
 */

export {
	StreamAbortedError,
	EventStreamAbortedError,
	BlockStreamAbortedError,
	BlockRangeTooLargeError,
	UnrecoverableReorgError,
} from "./errors.js";
