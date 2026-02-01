/**
 * ERC-7751: Wrapped Execution Error
 *
 * Provides encoding/decoding for wrapped errors that preserve context about
 * the failing contract, function, and original revert reason.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7751
 * @since 0.0.0
 */
export { WRAPPED_ERROR_SELECTOR } from "./constants.js";
export { decodeWrappedError } from "./decodeWrappedError.js";
export { encodeWrappedError } from "./encodeWrappedError.js";
export type { WrappedErrorType } from "./WrappedErrorType.js";
import { decodeWrappedError } from "./decodeWrappedError.js";
import { encodeWrappedError } from "./encodeWrappedError.js";
export declare const WrappedError: {
    WRAPPED_ERROR_SELECTOR: import("../../../Selector/SelectorType.js").SelectorType;
    encodeWrappedError: typeof encodeWrappedError;
    decodeWrappedError: typeof decodeWrappedError;
};
//# sourceMappingURL=index.d.ts.map