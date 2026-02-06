import { InvalidFormatError } from "../errors/ValidationError.js";
/**
 * Invalid label extension error (double-dash at positions 2-3)
 *
 * @throws {InvalidLabelExtensionError}
 */
export declare class InvalidLabelExtensionError extends InvalidFormatError {
    constructor(options: {
        value: string;
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Illegal mixture error (incompatible script combinations)
 *
 * @throws {IllegalMixtureError}
 */
export declare class IllegalMixtureError extends InvalidFormatError {
    constructor(options: {
        value: string;
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Whole confusable error (name resembles different script)
 *
 * @throws {WholeConfusableError}
 */
export declare class WholeConfusableError extends InvalidFormatError {
    constructor(options: {
        value: string;
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Disallowed character error (prohibited ENS character)
 *
 * @throws {DisallowedCharacterError}
 */
export declare class DisallowedCharacterError extends InvalidFormatError {
    constructor(options: {
        value: string;
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Empty label error (zero-length label segment)
 *
 * @throws {EmptyLabelError}
 */
export declare class EmptyLabelError extends InvalidFormatError {
    constructor(options: {
        value: string;
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Invalid UTF-8 error (malformed UTF-8 encoding)
 *
 * @throws {InvalidUtf8Error}
 */
export declare class InvalidUtf8Error extends InvalidFormatError {
    constructor(options: {
        value: string;
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=errors.d.ts.map