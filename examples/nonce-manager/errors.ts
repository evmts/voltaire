/**
 * NonceManager error classes
 *
 * @module errors
 */

/**
 * Base error for all nonce-related errors
 */
export class NonceError extends Error {
	override readonly name = "NonceError";

	constructor(
		message: string,
		public readonly context?: {
			address?: string;
			chainId?: number;
			nonce?: number;
			[key: string]: unknown;
		},
	) {
		super(message);
		Object.setPrototypeOf(this, NonceError.prototype);
	}
}

/**
 * Thrown when nonce is already used or lower than expected
 */
export class NonceTooLowError extends NonceError {
	override readonly name = "NonceTooLowError";

	constructor(
		public readonly expected: number,
		public readonly actual: number,
		context?: { address?: string; chainId?: number },
	) {
		super(`Nonce too low: expected >= ${expected}, got ${actual}`, {
			...context,
			expected,
			actual,
		});
		Object.setPrototypeOf(this, NonceTooLowError.prototype);
	}
}

/**
 * Thrown when nonce gap is detected (non-sequential nonces)
 */
export class NonceGapError extends NonceError {
	override readonly name = "NonceGapError";

	constructor(
		public readonly expected: number,
		public readonly actual: number,
		context?: { address?: string; chainId?: number },
	) {
		super(`Nonce gap detected: expected ${expected}, got ${actual}`, {
			...context,
			expected,
			actual,
		});
		Object.setPrototypeOf(this, NonceGapError.prototype);
	}
}

/**
 * Thrown when nonce sync with chain fails
 */
export class NonceSyncError extends NonceError {
	override readonly name = "NonceSyncError";

	constructor(
		message: string,
		public readonly cause?: Error,
		context?: { address?: string; chainId?: number },
	) {
		super(message, context);
		Object.setPrototypeOf(this, NonceSyncError.prototype);
	}
}

/**
 * Thrown when nonce manager is in invalid state
 */
export class NonceStateError extends NonceError {
	override readonly name = "NonceStateError";

	constructor(
		message: string,
		context?: { address?: string; chainId?: number; delta?: number },
	) {
		super(message, context);
		Object.setPrototypeOf(this, NonceStateError.prototype);
	}
}

/**
 * Thrown when trying to recycle a nonce that wasn't consumed
 */
export class NonceRecycleError extends NonceError {
	override readonly name = "NonceRecycleError";

	constructor(
		public readonly nonce: number,
		context?: { address?: string; chainId?: number },
	) {
		super(`Cannot recycle nonce ${nonce}: not in pending state`, {
			...context,
			nonce,
		});
		Object.setPrototypeOf(this, NonceRecycleError.prototype);
	}
}

/**
 * Thrown when provider fails to return nonce
 */
export class NonceProviderError extends NonceError {
	override readonly name = "NonceProviderError";

	constructor(
		message: string,
		public readonly cause?: Error,
		context?: { address?: string; chainId?: number },
	) {
		super(message, context);
		Object.setPrototypeOf(this, NonceProviderError.prototype);
	}
}
