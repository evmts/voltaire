/**
 * Custom error classes for ethers-compatible HD wallet
 * @module errors
 */

/**
 * Base error for HD wallet operations
 */
export class HDWalletError extends Error {
	readonly code: string;
	readonly context?: Record<string, unknown>;

	constructor(
		message: string,
		options?: { code?: string; context?: Record<string, unknown> },
	) {
		super(message);
		this.name = "HDWalletError";
		this.code = options?.code ?? "HD_WALLET_ERROR";
		this.context = options?.context;
	}
}

/**
 * Invalid mnemonic phrase
 */
export class InvalidMnemonicError extends HDWalletError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, { code: "INVALID_MNEMONIC", context });
		this.name = "InvalidMnemonicError";
	}
}

/**
 * Invalid seed bytes
 */
export class InvalidSeedError extends HDWalletError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, { code: "INVALID_SEED", context });
		this.name = "InvalidSeedError";
	}
}

/**
 * Invalid derivation path
 */
export class InvalidPathError extends HDWalletError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, { code: "INVALID_PATH", context });
		this.name = "InvalidPathError";
	}
}

/**
 * Invalid child index
 */
export class InvalidIndexError extends HDWalletError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, { code: "INVALID_INDEX", context });
		this.name = "InvalidIndexError";
	}
}

/**
 * Unsupported operation (e.g., hardened derivation on public key)
 */
export class UnsupportedOperationError extends HDWalletError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, { code: "UNSUPPORTED_OPERATION", context });
		this.name = "UnsupportedOperationError";
	}
}

/**
 * Invalid extended key format
 */
export class InvalidExtendedKeyError extends HDWalletError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, { code: "INVALID_EXTENDED_KEY", context });
		this.name = "InvalidExtendedKeyError";
	}
}

/**
 * Invalid entropy bytes
 */
export class InvalidEntropyError extends HDWalletError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, { code: "INVALID_ENTROPY", context });
		this.name = "InvalidEntropyError";
	}
}
