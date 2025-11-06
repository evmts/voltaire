export class EnsError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "EnsError";
	}
}

export class InvalidLabelExtensionError extends EnsError {
	constructor() {
		super("Invalid label extension: double-dash at positions 2-3");
		this.name = "InvalidLabelExtensionError";
	}
}

export class IllegalMixtureError extends EnsError {
	constructor() {
		super("Illegal mixture: incompatible script combinations");
		this.name = "IllegalMixtureError";
	}
}

export class WholeConfusableError extends EnsError {
	constructor() {
		super("Whole confusable: name resembles different script");
		this.name = "WholeConfusableError";
	}
}

export class DisallowedCharacterError extends EnsError {
	constructor() {
		super("Disallowed character: prohibited ENS character");
		this.name = "DisallowedCharacterError";
	}
}

export class EmptyLabelError extends EnsError {
	constructor() {
		super("Empty label: zero-length label segment");
		this.name = "EmptyLabelError";
	}
}

export class InvalidUtf8Error extends EnsError {
	constructor() {
		super("Invalid UTF-8: malformed UTF-8 encoding");
		this.name = "InvalidUtf8Error";
	}
}
