/**
 * ERC-7751: Wrapped Execution Error
 *
 * Provides encoding/decoding for wrapped errors that preserve context about
 * the failing contract, function, and original revert reason.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7751
 * @since 0.0.0
 */

export type { WrappedErrorType } from "./WrappedErrorType.js";

export { WRAPPED_ERROR_SELECTOR } from "./constants.js";
export { encodeWrappedError } from "./encodeWrappedError.js";
export { decodeWrappedError } from "./decodeWrappedError.js";

// Namespace export
import { WRAPPED_ERROR_SELECTOR } from "./constants.js";
import { encodeWrappedError } from "./encodeWrappedError.js";
import { decodeWrappedError } from "./decodeWrappedError.js";

export const WrappedError = {
	WRAPPED_ERROR_SELECTOR,
	encodeWrappedError,
	decodeWrappedError,
};
