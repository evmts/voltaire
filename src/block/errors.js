/**
 * BlockStream module errors
 *
 * Re-exports from shared stream errors for backwards compatibility.
 *
 * @module block/errors
 */

export {
	BlockStreamAbortedError,
	UnrecoverableReorgError,
	BlockRangeTooLargeError,
} from "../stream/errors.js";
