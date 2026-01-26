import * as Data from "effect/Data";
import {
	CHAIN_DISCONNECTED,
	DISCONNECTED,
	EXECUTION_REVERTED,
	INSUFFICIENT_FUNDS,
	INTERNAL_ERROR,
	INVALID_INPUT,
	INVALID_PARAMS,
	INVALID_REQUEST,
	LIMIT_EXCEEDED,
	METHOD_NOT_FOUND,
	METHOD_NOT_SUPPORTED,
	NONCE_TOO_HIGH,
	NONCE_TOO_LOW,
	PARSE_ERROR,
	RESOURCE_NOT_FOUND,
	RESOURCE_UNAVAILABLE,
	TRANSACTION_REJECTED,
	UNAUTHORIZED,
	UNSUPPORTED_METHOD,
	USER_REJECTED_REQUEST,
} from "./Error.js";

export class JsonRpcParseError extends Data.TaggedError("JsonRpcParseError")<{
	readonly input: unknown;
	readonly message: string;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		input: unknown,
		message?: string,
		options?: { cause?: unknown; context?: Record<string, unknown> },
	) {
		super({
			input,
			message: message ?? "Failed to parse JSON-RPC message",
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class JsonRpcErrorResponse extends Data.TaggedError("JsonRpcError")<{
	readonly rpcCode: number;
	readonly message: string;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		input: { code: number; message: string; data?: unknown },
		options?: { cause?: unknown; context?: Record<string, unknown> },
	) {
		super({
			rpcCode: input.code,
			message: input.message,
			data: input.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

// Standard JSON-RPC error classes

export class ParseError extends Data.TaggedError("ParseError")<{
	readonly message: string;
	readonly rpcCode: typeof PARSE_ERROR;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Parse error",
			rpcCode: PARSE_ERROR,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class InvalidRequestError extends Data.TaggedError(
	"InvalidRequestError",
)<{
	readonly message: string;
	readonly rpcCode: typeof INVALID_REQUEST;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Invalid request",
			rpcCode: INVALID_REQUEST,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class MethodNotFoundError extends Data.TaggedError(
	"MethodNotFoundError",
)<{
	readonly message: string;
	readonly rpcCode: typeof METHOD_NOT_FOUND;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Method not found",
			rpcCode: METHOD_NOT_FOUND,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class InvalidParamsError extends Data.TaggedError("InvalidParamsError")<{
	readonly message: string;
	readonly rpcCode: typeof INVALID_PARAMS;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Invalid params",
			rpcCode: INVALID_PARAMS,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class InternalError extends Data.TaggedError("InternalError")<{
	readonly message: string;
	readonly rpcCode: typeof INTERNAL_ERROR;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Internal error",
			rpcCode: INTERNAL_ERROR,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

// EIP-1474 Ethereum error classes

export class InvalidInputError extends Data.TaggedError("InvalidInputError")<{
	readonly message: string;
	readonly rpcCode: typeof INVALID_INPUT;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Invalid input",
			rpcCode: INVALID_INPUT,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class ResourceNotFoundError extends Data.TaggedError(
	"ResourceNotFoundError",
)<{
	readonly message: string;
	readonly rpcCode: typeof RESOURCE_NOT_FOUND;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Resource not found",
			rpcCode: RESOURCE_NOT_FOUND,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class ResourceUnavailableError extends Data.TaggedError(
	"ResourceUnavailableError",
)<{
	readonly message: string;
	readonly rpcCode: typeof RESOURCE_UNAVAILABLE;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Resource unavailable",
			rpcCode: RESOURCE_UNAVAILABLE,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class TransactionRejectedError extends Data.TaggedError(
	"TransactionRejectedError",
)<{
	readonly message: string;
	readonly rpcCode: typeof TRANSACTION_REJECTED;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Transaction rejected",
			rpcCode: TRANSACTION_REJECTED,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class MethodNotSupportedError extends Data.TaggedError(
	"MethodNotSupportedError",
)<{
	readonly message: string;
	readonly rpcCode: typeof METHOD_NOT_SUPPORTED;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Method not supported",
			rpcCode: METHOD_NOT_SUPPORTED,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class LimitExceededError extends Data.TaggedError("LimitExceededError")<{
	readonly message: string;
	readonly rpcCode: typeof LIMIT_EXCEEDED;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Limit exceeded",
			rpcCode: LIMIT_EXCEEDED,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

// EIP-1193 Provider error classes

export class UserRejectedRequestError extends Data.TaggedError(
	"UserRejectedRequestError",
)<{
	readonly message: string;
	readonly rpcCode: typeof USER_REJECTED_REQUEST;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "User rejected request",
			rpcCode: USER_REJECTED_REQUEST,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
	readonly message: string;
	readonly rpcCode: typeof UNAUTHORIZED;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Unauthorized",
			rpcCode: UNAUTHORIZED,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class UnsupportedMethodError extends Data.TaggedError(
	"UnsupportedMethodError",
)<{
	readonly message: string;
	readonly rpcCode: typeof UNSUPPORTED_METHOD;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Unsupported method",
			rpcCode: UNSUPPORTED_METHOD,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class DisconnectedError extends Data.TaggedError("DisconnectedError")<{
	readonly message: string;
	readonly rpcCode: typeof DISCONNECTED;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Disconnected",
			rpcCode: DISCONNECTED,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class ChainDisconnectedError extends Data.TaggedError(
	"ChainDisconnectedError",
)<{
	readonly message: string;
	readonly rpcCode: typeof CHAIN_DISCONNECTED;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Chain disconnected",
			rpcCode: CHAIN_DISCONNECTED,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

// Node-specific error classes (geth/erigon)

export class ExecutionRevertedError extends Data.TaggedError(
	"ExecutionRevertedError",
)<{
	readonly message: string;
	readonly rpcCode: typeof EXECUTION_REVERTED;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Execution reverted",
			rpcCode: EXECUTION_REVERTED,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class InsufficientFundsError extends Data.TaggedError(
	"InsufficientFundsError",
)<{
	readonly message: string;
	readonly rpcCode: typeof INSUFFICIENT_FUNDS;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Insufficient funds for gas * price + value",
			rpcCode: INSUFFICIENT_FUNDS,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class NonceTooLowError extends Data.TaggedError("NonceTooLowError")<{
	readonly message: string;
	readonly rpcCode: typeof NONCE_TOO_LOW;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Nonce too low",
			rpcCode: NONCE_TOO_LOW,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

export class NonceTooHighError extends Data.TaggedError("NonceTooHighError")<{
	readonly message: string;
	readonly rpcCode: typeof NONCE_TOO_HIGH;
	readonly data?: unknown;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}> {
	constructor(
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
			data?: unknown;
		},
	) {
		super({
			message: message ?? "Nonce too high",
			rpcCode: NONCE_TOO_HIGH,
			data: options?.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}

// All known RPC error codes
export type RpcErrorCode =
	| typeof PARSE_ERROR
	| typeof INVALID_REQUEST
	| typeof METHOD_NOT_FOUND
	| typeof INVALID_PARAMS
	| typeof INTERNAL_ERROR
	| typeof INVALID_INPUT
	| typeof RESOURCE_NOT_FOUND
	| typeof RESOURCE_UNAVAILABLE
	| typeof TRANSACTION_REJECTED
	| typeof METHOD_NOT_SUPPORTED
	| typeof LIMIT_EXCEEDED
	| typeof USER_REJECTED_REQUEST
	| typeof UNAUTHORIZED
	| typeof UNSUPPORTED_METHOD
	| typeof DISCONNECTED
	| typeof CHAIN_DISCONNECTED
	| typeof EXECUTION_REVERTED
	| typeof INSUFFICIENT_FUNDS
	| typeof NONCE_TOO_LOW
	| typeof NONCE_TOO_HIGH;

// Union type for all RPC errors
export type RpcError =
	| ParseError
	| InvalidRequestError
	| MethodNotFoundError
	| InvalidParamsError
	| InternalError
	| InvalidInputError
	| ResourceNotFoundError
	| ResourceUnavailableError
	| TransactionRejectedError
	| MethodNotSupportedError
	| LimitExceededError
	| UserRejectedRequestError
	| UnauthorizedError
	| UnsupportedMethodError
	| DisconnectedError
	| ChainDisconnectedError
	| ExecutionRevertedError
	| InsufficientFundsError
	| NonceTooLowError
	| NonceTooHighError
	| JsonRpcErrorResponse;

const errorCodeToClass = {
	[PARSE_ERROR]: ParseError,
	[INVALID_REQUEST]: InvalidRequestError,
	[METHOD_NOT_FOUND]: MethodNotFoundError,
	[INVALID_PARAMS]: InvalidParamsError,
	[INTERNAL_ERROR]: InternalError,
	[INVALID_INPUT]: InvalidInputError,
	[RESOURCE_NOT_FOUND]: ResourceNotFoundError,
	[RESOURCE_UNAVAILABLE]: ResourceUnavailableError,
	[TRANSACTION_REJECTED]: TransactionRejectedError,
	[METHOD_NOT_SUPPORTED]: MethodNotSupportedError,
	[LIMIT_EXCEEDED]: LimitExceededError,
	[USER_REJECTED_REQUEST]: UserRejectedRequestError,
	[UNAUTHORIZED]: UnauthorizedError,
	[UNSUPPORTED_METHOD]: UnsupportedMethodError,
	[DISCONNECTED]: DisconnectedError,
	[CHAIN_DISCONNECTED]: ChainDisconnectedError,
	[EXECUTION_REVERTED]: ExecutionRevertedError,
	[INSUFFICIENT_FUNDS]: InsufficientFundsError,
	[NONCE_TOO_LOW]: NonceTooLowError,
	[NONCE_TOO_HIGH]: NonceTooHighError,
} as const;

export function parseErrorCode(input: {
	code: number;
	message?: string;
	data?: unknown;
}): RpcError {
	const ErrorClass = errorCodeToClass[input.code as RpcErrorCode];
	if (ErrorClass) {
		return new ErrorClass(input.message, { data: input.data });
	}
	return new JsonRpcErrorResponse({
		rpcCode: input.code,
		message: input.message ?? "Unknown error",
		data: input.data,
	});
}
