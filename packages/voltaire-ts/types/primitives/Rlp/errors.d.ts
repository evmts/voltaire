/**
 * @typedef {"InputTooShort" | "InputTooLong" | "LeadingZeros" | "NonCanonicalSize" | "InvalidLength" | "UnexpectedInput" | "InvalidRemainder" | "ExtraZeros" | "RecursionDepthExceeded"} ErrorType
 */
/**
 * Legacy RLP error class for backwards compatibility
 * @deprecated Use RlpEncodingError or RlpDecodingError instead
 */
export class Error extends RlpDecodingError {
    /**
     * @param {ErrorType} type
     * @param {string} [message]
     */
    constructor(type: ErrorType, message?: string);
    /** @type {ErrorType} */
    type: ErrorType;
}
export const RlpError: typeof Error;
export type ErrorType = "InputTooShort" | "InputTooLong" | "LeadingZeros" | "NonCanonicalSize" | "InvalidLength" | "UnexpectedInput" | "InvalidRemainder" | "ExtraZeros" | "RecursionDepthExceeded";
export { RlpDecodingError, RlpEncodingError } from "./RlpError.js";
//# sourceMappingURL=errors.d.ts.map