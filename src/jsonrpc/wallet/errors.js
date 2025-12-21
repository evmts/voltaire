/**
 * Standard wallet error codes
 */
export const WalletErrorCode = {
	/** User rejected the request */
	USER_REJECTED: 4001,
	/** Requested method not supported */
	UNAUTHORIZED: 4100,
	/** Provider not authorized for requested method */
	UNSUPPORTED_METHOD: 4200,
	/** Provider disconnected from all chains */
	DISCONNECTED: 4900,
	/** Provider disconnected from specified chain */
	CHAIN_DISCONNECTED: 4901,
	/** Unrecognized chain ID */
	UNRECOGNIZED_CHAIN: 4902,
};

/**
 * @param {number} code - Error code
 * @param {string} message - Error message
 * @param {any} [data] - Optional error data
 * @returns {{ code: number, message: string, data?: any }}
 */
export function createWalletError(code, message, data) {
	/** @type {{ code: number; message: string; data?: * }} */
	const error = { code, message };
	if (data !== undefined) error.data = data;
	return error;
}

/**
 * @param {string} [message] - Optional custom message
 * @returns {{ code: number, message: string }}
 */
export function userRejectedError(message = "User rejected the request") {
	return createWalletError(WalletErrorCode.USER_REJECTED, message);
}

/**
 * @param {string} [message] - Optional custom message
 * @returns {{ code: number, message: string }}
 */
export function unauthorizedError(message = "Unauthorized") {
	return createWalletError(WalletErrorCode.UNAUTHORIZED, message);
}

/**
 * @param {string} method - Method name
 * @returns {{ code: number, message: string, data?: * }}
 */
export function unsupportedMethodError(method) {
	return createWalletError(
		WalletErrorCode.UNSUPPORTED_METHOD,
		"Unsupported method",
		{ method },
	);
}

/**
 * @param {string} chainId - Chain ID
 * @returns {{ code: number, message: string, data?: * }}
 */
export function unrecognizedChainError(chainId) {
	return createWalletError(
		WalletErrorCode.UNRECOGNIZED_CHAIN,
		"Unrecognized chain ID",
		{ chainId },
	);
}
