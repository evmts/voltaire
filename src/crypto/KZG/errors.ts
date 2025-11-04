/**
 * Base KZG error
 */
export class KzgError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "KzgError";
	}
}

/**
 * Trusted setup not initialized error
 */
export class KzgNotInitializedError extends Error {
	constructor(message = "KZG trusted setup not initialized") {
		super(message);
		this.name = "KzgNotInitializedError";
	}
}

/**
 * Invalid blob error
 */
export class KzgInvalidBlobError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "KzgInvalidBlobError";
	}
}

/**
 * Verification error
 */
export class KzgVerificationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "KzgVerificationError";
	}
}
