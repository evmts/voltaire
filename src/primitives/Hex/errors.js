export class InvalidFormatError extends Error {
	constructor(message = "Invalid hex format: missing 0x prefix") {
		super(message);
		this.name = "InvalidHexFormatError";
	}
}

export class InvalidLengthError extends Error {
	constructor(message = "Invalid hex length") {
		super(message);
		this.name = "InvalidHexLengthError";
	}
}

export class InvalidCharacterError extends Error {
	constructor(message = "Invalid hex character") {
		super(message);
		this.name = "InvalidHexCharacterError";
	}
}

export class OddLengthError extends Error {
	constructor(message = "Odd length hex string") {
		super(message);
		this.name = "OddLengthHexError";
	}
}

// Re-export for backward compatibility
export const InvalidHexFormatError = InvalidFormatError;
export const InvalidHexCharacterError = InvalidCharacterError;
export const OddLengthHexError = OddLengthError;
export const InvalidHexLengthError = InvalidLengthError;
