export class InvalidBytesLengthError extends Error {
	constructor(message, details) {
		super(message);
		this.name = "InvalidBytesLengthError";
		this.details = details;
	}
}

export class InvalidBytesFormatError extends Error {
	constructor(message, details) {
		super(message);
		this.name = "InvalidBytesFormatError";
		this.details = details;
	}
}

export class InvalidValueError extends Error {
	constructor(message, details) {
		super(message);
		this.name = "InvalidValueError";
		this.details = details;
	}
}
