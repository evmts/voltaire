import { InvalidFormatError } from "../../errors/ValidationError.js";

/**
 * Invalid label extension error (double-dash at positions 2-3)
 *
 * @throws {InvalidLabelExtensionError}
 */
export class InvalidLabelExtensionError extends InvalidFormatError {
	constructor(
		options: {
			value: string;
			code?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super("Invalid label extension: double-dash at positions 2-3", {
			...options,
			expected: "Valid ENS label without double-dash at positions 2-3",
			code: options.code || "ENS_INVALID_LABEL_EXTENSION",
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
	constructor(
		options: {
			value: string;
			code?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super("Illegal mixture: incompatible script combinations", {
			...options,
			expected: "Valid ENS name without mixed scripts",
			code: options.code || "ENS_ILLEGAL_MIXTURE",
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
	constructor(
		options: {
			value: string;
			code?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super("Whole confusable: name resembles different script", {
			...options,
			expected: "Valid ENS name without confusable characters",
			code: options.code || "ENS_WHOLE_CONFUSABLE",
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
	constructor(
		options: {
			value: string;
			code?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super("Disallowed character: prohibited ENS character", {
			...options,
			expected: "Valid ENS name with allowed characters only",
			code: options.code || "ENS_DISALLOWED_CHARACTER",
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
	constructor(
		options: {
			value: string;
			code?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super("Empty label: zero-length label segment", {
			...options,
			expected: "Valid ENS name without empty labels",
			code: options.code || "ENS_EMPTY_LABEL",
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
	constructor(
		options: {
			value: string;
			code?: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super("Invalid UTF-8: malformed UTF-8 encoding", {
			...options,
			expected: "Valid UTF-8 encoded ENS name",
			code: options.code || "ENS_INVALID_UTF8",
		});
		this.name = "InvalidUtf8Error";
	}
}
