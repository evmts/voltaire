import { InvalidFormatError } from "../errors/ValidationError.js";
/**
 * Invalid label extension error (double-dash at positions 2-3)
 *
 * @throws {InvalidLabelExtensionError}
 */
export class InvalidLabelExtensionError extends InvalidFormatError {
    constructor(options) {
        super("Invalid label extension: double-dash at positions 2-3", {
            ...options,
            expected: "Valid ENS label without double-dash at positions 2-3",
            code: options.code ?? -32602,
        });
        this.name = "InvalidLabelExtensionError";
    }
}
/**
 * Illegal mixture error (incompatible script combinations)
 *
 * @throws {IllegalMixtureError}
 */
export class IllegalMixtureError extends InvalidFormatError {
    constructor(options) {
        super("Illegal mixture: incompatible script combinations", {
            ...options,
            expected: "Valid ENS name without mixed scripts",
            code: options.code ?? -32602,
        });
        this.name = "IllegalMixtureError";
    }
}
/**
 * Whole confusable error (name resembles different script)
 *
 * @throws {WholeConfusableError}
 */
export class WholeConfusableError extends InvalidFormatError {
    constructor(options) {
        super("Whole confusable: name resembles different script", {
            ...options,
            expected: "Valid ENS name without confusable characters",
            code: options.code ?? -32602,
        });
        this.name = "WholeConfusableError";
    }
}
/**
 * Disallowed character error (prohibited ENS character)
 *
 * @throws {DisallowedCharacterError}
 */
export class DisallowedCharacterError extends InvalidFormatError {
    constructor(options) {
        super("Disallowed character: prohibited ENS character", {
            ...options,
            expected: "Valid ENS name with allowed characters only",
            code: options.code ?? -32602,
        });
        this.name = "DisallowedCharacterError";
    }
}
/**
 * Empty label error (zero-length label segment)
 *
 * @throws {EmptyLabelError}
 */
export class EmptyLabelError extends InvalidFormatError {
    constructor(options) {
        super("Empty label: zero-length label segment", {
            ...options,
            expected: "Valid ENS name without empty labels",
            code: options.code ?? -32602,
        });
        this.name = "EmptyLabelError";
    }
}
/**
 * Invalid UTF-8 error (malformed UTF-8 encoding)
 *
 * @throws {InvalidUtf8Error}
 */
export class InvalidUtf8Error extends InvalidFormatError {
    constructor(options) {
        super("Invalid UTF-8: malformed UTF-8 encoding", {
            ...options,
            expected: "Valid UTF-8 encoded ENS name",
            code: options.code ?? -32602,
        });
        this.name = "InvalidUtf8Error";
    }
}
