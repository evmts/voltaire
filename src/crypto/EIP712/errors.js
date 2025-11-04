/**
 * Base EIP-712 error
 */
export class Eip712Error extends Error {
	constructor(message) {
		super(message);
		this.name = "Eip712Error";
	}
}

/**
 * EIP-712 encoding error
 */
export class Eip712EncodingError extends Eip712Error {
	constructor(message) {
		super(message);
		this.name = "Eip712EncodingError";
	}
}

/**
 * EIP-712 type not found error
 */
export class Eip712TypeNotFoundError extends Eip712Error {
	constructor(message) {
		super(message);
		this.name = "Eip712TypeNotFoundError";
	}
}

/**
 * EIP-712 invalid message error
 */
export class Eip712InvalidMessageError extends Eip712Error {
	constructor(message) {
		super(message);
		this.name = "Eip712InvalidMessageError";
	}
}
