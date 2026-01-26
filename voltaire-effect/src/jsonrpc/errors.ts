import { AbstractError } from "@tevm/voltaire/errors";
import {
	PARSE_ERROR,
	INVALID_REQUEST,
	METHOD_NOT_FOUND,
	INVALID_PARAMS,
	INTERNAL_ERROR,
	INVALID_INPUT,
	RESOURCE_NOT_FOUND,
	RESOURCE_UNAVAILABLE,
	TRANSACTION_REJECTED,
	METHOD_NOT_SUPPORTED,
	LIMIT_EXCEEDED,
	USER_REJECTED_REQUEST,
	UNAUTHORIZED,
	UNSUPPORTED_METHOD,
	DISCONNECTED,
	CHAIN_DISCONNECTED,
} from "./Error.js";

export class JsonRpcParseError extends AbstractError {
	readonly _tag = "JsonRpcParseError" as const;
	readonly input: unknown;

	constructor(
		input: unknown,
		message?: string,
		options?: { cause?: Error; context?: Record<string, unknown> },
	) {
		super(message ?? "Failed to parse JSON-RPC message", options);
		this.name = "JsonRpcParseError";
		this.input = input;
	}
}

export class JsonRpcErrorResponse extends AbstractError {
	readonly _tag = "JsonRpcError" as const;
	readonly rpcCode: number;
	readonly data?: unknown;

	constructor(
		input: { code: number; message: string; data?: unknown },
		options?: { cause?: Error; context?: Record<string, unknown> },
	) {
		super(input.message, { ...options, code: input.code });
		this.name = "JsonRpcError";
		this.rpcCode = input.code;
		this.data = input.data;
	}
}

type ErrorOptions = { cause?: Error; context?: Record<string, unknown>; data?: unknown };

// Standard JSON-RPC error classes

export class ParseError extends AbstractError {
	readonly _tag = "ParseError" as const;
	readonly rpcCode = PARSE_ERROR;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Parse error", { ...options, code: PARSE_ERROR });
		this.name = "ParseError";
		this.data = options?.data;
	}
}

export class InvalidRequestError extends AbstractError {
	readonly _tag = "InvalidRequestError" as const;
	readonly rpcCode = INVALID_REQUEST;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Invalid request", { ...options, code: INVALID_REQUEST });
		this.name = "InvalidRequestError";
		this.data = options?.data;
	}
}

export class MethodNotFoundError extends AbstractError {
	readonly _tag = "MethodNotFoundError" as const;
	readonly rpcCode = METHOD_NOT_FOUND;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Method not found", { ...options, code: METHOD_NOT_FOUND });
		this.name = "MethodNotFoundError";
		this.data = options?.data;
	}
}

export class InvalidParamsError extends AbstractError {
	readonly _tag = "InvalidParamsError" as const;
	readonly rpcCode = INVALID_PARAMS;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Invalid params", { ...options, code: INVALID_PARAMS });
		this.name = "InvalidParamsError";
		this.data = options?.data;
	}
}

export class InternalError extends AbstractError {
	readonly _tag = "InternalError" as const;
	readonly rpcCode = INTERNAL_ERROR;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Internal error", { ...options, code: INTERNAL_ERROR });
		this.name = "InternalError";
		this.data = options?.data;
	}
}

// EIP-1474 Ethereum error classes

export class InvalidInputError extends AbstractError {
	readonly _tag = "InvalidInputError" as const;
	readonly rpcCode = INVALID_INPUT;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Invalid input", { ...options, code: INVALID_INPUT });
		this.name = "InvalidInputError";
		this.data = options?.data;
	}
}

export class ResourceNotFoundError extends AbstractError {
	readonly _tag = "ResourceNotFoundError" as const;
	readonly rpcCode = RESOURCE_NOT_FOUND;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Resource not found", { ...options, code: RESOURCE_NOT_FOUND });
		this.name = "ResourceNotFoundError";
		this.data = options?.data;
	}
}

export class ResourceUnavailableError extends AbstractError {
	readonly _tag = "ResourceUnavailableError" as const;
	readonly rpcCode = RESOURCE_UNAVAILABLE;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Resource unavailable", { ...options, code: RESOURCE_UNAVAILABLE });
		this.name = "ResourceUnavailableError";
		this.data = options?.data;
	}
}

export class TransactionRejectedError extends AbstractError {
	readonly _tag = "TransactionRejectedError" as const;
	readonly rpcCode = TRANSACTION_REJECTED;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Transaction rejected", { ...options, code: TRANSACTION_REJECTED });
		this.name = "TransactionRejectedError";
		this.data = options?.data;
	}
}

export class MethodNotSupportedError extends AbstractError {
	readonly _tag = "MethodNotSupportedError" as const;
	readonly rpcCode = METHOD_NOT_SUPPORTED;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Method not supported", { ...options, code: METHOD_NOT_SUPPORTED });
		this.name = "MethodNotSupportedError";
		this.data = options?.data;
	}
}

export class LimitExceededError extends AbstractError {
	readonly _tag = "LimitExceededError" as const;
	readonly rpcCode = LIMIT_EXCEEDED;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Limit exceeded", { ...options, code: LIMIT_EXCEEDED });
		this.name = "LimitExceededError";
		this.data = options?.data;
	}
}

// EIP-1193 Provider error classes

export class UserRejectedRequestError extends AbstractError {
	readonly _tag = "UserRejectedRequestError" as const;
	readonly rpcCode = USER_REJECTED_REQUEST;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "User rejected request", { ...options, code: USER_REJECTED_REQUEST });
		this.name = "UserRejectedRequestError";
		this.data = options?.data;
	}
}

export class UnauthorizedError extends AbstractError {
	readonly _tag = "UnauthorizedError" as const;
	readonly rpcCode = UNAUTHORIZED;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Unauthorized", { ...options, code: UNAUTHORIZED });
		this.name = "UnauthorizedError";
		this.data = options?.data;
	}
}

export class UnsupportedMethodError extends AbstractError {
	readonly _tag = "UnsupportedMethodError" as const;
	readonly rpcCode = UNSUPPORTED_METHOD;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Unsupported method", { ...options, code: UNSUPPORTED_METHOD });
		this.name = "UnsupportedMethodError";
		this.data = options?.data;
	}
}

export class DisconnectedError extends AbstractError {
	readonly _tag = "DisconnectedError" as const;
	readonly rpcCode = DISCONNECTED;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Disconnected", { ...options, code: DISCONNECTED });
		this.name = "DisconnectedError";
		this.data = options?.data;
	}
}

export class ChainDisconnectedError extends AbstractError {
	readonly _tag = "ChainDisconnectedError" as const;
	readonly rpcCode = CHAIN_DISCONNECTED;
	readonly data?: unknown;

	constructor(message?: string, options?: ErrorOptions) {
		super(message ?? "Chain disconnected", { ...options, code: CHAIN_DISCONNECTED });
		this.name = "ChainDisconnectedError";
		this.data = options?.data;
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
	| typeof CHAIN_DISCONNECTED;

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
} as const;

export function parseErrorCode(input: {
	code: number;
	message?: string;
	data?: unknown;
}): AbstractError {
	const ErrorClass = errorCodeToClass[input.code as RpcErrorCode];
	if (ErrorClass) {
		return new ErrorClass(input.message, { data: input.data });
	}
	return new JsonRpcErrorResponse({
		code: input.code,
		message: input.message ?? "Unknown error",
		data: input.data,
	});
}
