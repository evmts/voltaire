/**
 * Base error for HD Wallet operations
 */
export class HDWalletError extends Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "HDWalletError";
	}
}

/**
 * Error for invalid BIP-32 paths
 */
export class InvalidPathError extends HDWalletError {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "InvalidPathError";
	}
}

/**
 * Error for invalid seed data
 */
export class InvalidSeedError extends HDWalletError {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
		this.name = "InvalidSeedError";
	}
}
