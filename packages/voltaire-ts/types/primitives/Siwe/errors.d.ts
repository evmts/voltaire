/**
 * SIWE message format is invalid
 *
 * @throws {InvalidFormatError}
 */
export class InvalidSiweMessageError extends InvalidFormatError {
    /**
     * @param {string} message - Description of the format issue
     * @param {object} [options]
     * @param {unknown} [options.value]
     * @param {Error} [options.cause]
     */
    constructor(message: string, options?: {
        value?: unknown;
        cause?: Error | undefined;
    });
}
/**
 * SIWE message missing required field
 *
 * @throws {InvalidFormatError}
 */
export class MissingFieldError extends InvalidFormatError {
    /**
     * @param {string} field - Name of the missing field
     * @param {object} [options]
     * @param {Error} [options.cause]
     */
    constructor(field: string, options?: {
        cause?: Error | undefined;
    });
}
/**
 * SIWE message field has invalid value
 *
 * @throws {InvalidFormatError}
 */
export class InvalidFieldError extends InvalidFormatError {
    /**
     * @param {string} field - Name of the invalid field
     * @param {string} reason - Why the field is invalid
     * @param {object} [options]
     * @param {unknown} [options.value]
     * @param {Error} [options.cause]
     */
    constructor(field: string, reason: string, options?: {
        value?: unknown;
        cause?: Error | undefined;
    });
}
/**
 * SIWE nonce length is invalid
 *
 * @throws {InvalidLengthError}
 */
export class InvalidNonceLengthError extends InvalidLengthError {
    /**
     * @param {number} length - Requested nonce length
     * @param {object} [options]
     * @param {Error} [options.cause]
     */
    constructor(length: number, options?: {
        cause?: Error | undefined;
    });
}
/**
 * SIWE message parsing failed
 *
 * @throws {DecodingError}
 */
export class SiweParseError extends DecodingError {
    /**
     * @param {string} message - Description of the parse error
     * @param {object} [options]
     * @param {unknown} [options.value]
     * @param {Error} [options.cause]
     */
    constructor(message: string, options?: {
        value?: unknown;
        cause?: Error | undefined;
    });
}
import { InvalidFormatError } from "../errors/index.js";
import { InvalidLengthError } from "../errors/index.js";
import { DecodingError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map