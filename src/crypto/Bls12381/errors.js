/**
 * BLS12-381 Error Types
 *
 * Error classes for BLS12-381 operations.
 *
 * @since 0.0.0
 */

/**
 * Base error class for BLS12-381 operations
 */
export class Bls12381Error extends Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "Bls12381Error";
	}
}

/**
 * Error thrown when a point is not on the curve
 */
export class InvalidPointError extends Bls12381Error {
	constructor() {
		super("Point is not on the BLS12-381 curve");
		this.name = "InvalidPointError";
	}
}

/**
 * Error thrown when a point is not in the correct subgroup
 */
export class InvalidSubgroupError extends Bls12381Error {
	constructor() {
		super("Point is not in the correct subgroup");
		this.name = "InvalidSubgroupError";
	}
}

/**
 * Error thrown when a scalar is invalid
 */
export class InvalidScalarError extends Bls12381Error {
	/**
	 * @param {string} [reason]
	 */
	constructor(reason) {
		super(reason ?? "Invalid scalar value");
		this.name = "InvalidScalarError";
	}
}

/**
 * Error thrown when field element is invalid
 */
export class InvalidFieldElementError extends Bls12381Error {
	/**
	 * @param {string} [reason]
	 */
	constructor(reason) {
		super(reason ?? "Invalid field element");
		this.name = "InvalidFieldElementError";
	}
}

/**
 * Error thrown when pairing check fails
 */
export class PairingError extends Bls12381Error {
	/**
	 * @param {string} [reason]
	 */
	constructor(reason) {
		super(reason ?? "Pairing operation failed");
		this.name = "PairingError";
	}
}

/**
 * Error thrown when signature operation fails
 */
export class SignatureError extends Bls12381Error {
	/**
	 * @param {string} [reason]
	 */
	constructor(reason) {
		super(reason ?? "Signature operation failed");
		this.name = "SignatureError";
	}
}
