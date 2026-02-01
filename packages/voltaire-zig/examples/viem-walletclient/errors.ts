/**
 * Custom errors for viem-walletclient
 */

/**
 * Base error class for wallet client errors
 */
export class WalletClientError extends Error {
	readonly code: string;
	readonly docsPath?: string;
	readonly metaMessages?: string[];

	constructor(
		message: string,
		options?: {
			code?: string;
			docsPath?: string;
			metaMessages?: string[];
			cause?: Error;
		},
	) {
		super(message, { cause: options?.cause });
		this.name = "WalletClientError";
		this.code = options?.code ?? "WALLET_CLIENT_ERROR";
		this.docsPath = options?.docsPath;
		this.metaMessages = options?.metaMessages;
	}
}

/**
 * Error thrown when an account is required but not provided
 */
export class AccountNotFoundError extends WalletClientError {
	constructor(options?: { docsPath?: string }) {
		super(
			"Could not find an Account to execute with this Action.\nPlease provide an Account with the `account` argument on the Action, or by setting an `account` on the WalletClient.",
			{
				code: "ACCOUNT_NOT_FOUND",
				docsPath: options?.docsPath ?? "/docs/actions/wallet",
			},
		);
		this.name = "AccountNotFoundError";
	}
}

/**
 * Error thrown when an account type is not supported for an action
 */
export class AccountTypeNotSupportedError extends WalletClientError {
	readonly accountType: string;

	constructor(options: {
		type: string;
		docsPath?: string;
		metaMessages?: string[];
	}) {
		super(`Account type "${options.type}" is not supported.`, {
			code: "ACCOUNT_TYPE_NOT_SUPPORTED",
			docsPath: options.docsPath,
			metaMessages: options.metaMessages,
		});
		this.name = "AccountTypeNotSupportedError";
		this.accountType = options.type;
	}
}

/**
 * Error thrown when chain validation fails
 */
export class ChainMismatchError extends WalletClientError {
	readonly currentChainId: number;
	readonly expectedChainId: number;

	constructor(options: { currentChainId: number; expectedChainId: number }) {
		super(
			`The current chain (id: ${options.currentChainId}) does not match the expected chain (id: ${options.expectedChainId}).`,
			{
				code: "CHAIN_MISMATCH",
				docsPath: "/docs/clients/wallet",
				metaMessages: [
					`Current chain ID: ${options.currentChainId}`,
					`Expected chain ID: ${options.expectedChainId}`,
				],
			},
		);
		this.name = "ChainMismatchError";
		this.currentChainId = options.currentChainId;
		this.expectedChainId = options.expectedChainId;
	}
}

/**
 * Error thrown when transaction request validation fails
 */
export class InvalidTransactionError extends WalletClientError {
	constructor(
		message: string,
		options?: { code?: string; docsPath?: string; cause?: Error },
	) {
		super(message, {
			code: options?.code ?? "INVALID_TRANSACTION",
			docsPath: options?.docsPath ?? "/docs/actions/wallet/sendTransaction",
			cause: options?.cause,
		});
		this.name = "InvalidTransactionError";
	}
}

/**
 * Error thrown when fee estimation fails
 */
export class FeeEstimationError extends WalletClientError {
	constructor(
		message: string,
		options?: { code?: string; docsPath?: string; cause?: Error },
	) {
		super(message, {
			code: options?.code ?? "FEE_ESTIMATION_FAILED",
			docsPath: options?.docsPath ?? "/docs/actions/public/estimateGas",
			cause: options?.cause,
		});
		this.name = "FeeEstimationError";
	}
}

/**
 * Error thrown when transport/RPC request fails
 */
export class TransportError extends WalletClientError {
	readonly rpcCode?: number;

	constructor(
		message: string,
		options?: { code?: string; rpcCode?: number; cause?: Error },
	) {
		super(message, {
			code: options?.code ?? "TRANSPORT_ERROR",
			cause: options?.cause,
		});
		this.name = "TransportError";
		this.rpcCode = options?.rpcCode;
	}
}

/**
 * Error thrown when user rejects the request
 */
export class UserRejectedRequestError extends WalletClientError {
	constructor(options?: { cause?: Error }) {
		super("User rejected the request.", {
			code: "USER_REJECTED_REQUEST",
			docsPath: "/docs/errors#user-rejected-request",
			cause: options?.cause,
		});
		this.name = "UserRejectedRequestError";
	}
}

/**
 * Error thrown when wallet is not connected
 */
export class WalletNotConnectedError extends WalletClientError {
	constructor(options?: { cause?: Error }) {
		super("Wallet is not connected. Call `requestAddresses` first.", {
			code: "WALLET_NOT_CONNECTED",
			docsPath: "/docs/actions/wallet/requestAddresses",
			cause: options?.cause,
		});
		this.name = "WalletNotConnectedError";
	}
}

/**
 * Error thrown when transaction submission fails
 */
export class TransactionExecutionError extends WalletClientError {
	readonly transaction?: object;

	constructor(
		message: string,
		options?: {
			transaction?: object;
			cause?: Error;
			docsPath?: string;
		},
	) {
		super(message, {
			code: "TRANSACTION_EXECUTION_FAILED",
			docsPath: options?.docsPath ?? "/docs/actions/wallet/sendTransaction",
			cause: options?.cause,
		});
		this.name = "TransactionExecutionError";
		this.transaction = options?.transaction;
	}
}
