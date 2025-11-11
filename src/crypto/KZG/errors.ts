/**
 * Base KZG error
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class KzgError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "KzgError";
	}
}

/**
 * Trusted setup not initialized error
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class KzgNotInitializedError extends Error {
	constructor(message = "KZG trusted setup not initialized") {
		super(message);
		this.name = "KzgNotInitializedError";
	}
}

/**
 * Invalid blob error
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class KzgInvalidBlobError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "KzgInvalidBlobError";
	}
}

/**
 * Verification error
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class KzgVerificationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "KzgVerificationError";
	}
}
