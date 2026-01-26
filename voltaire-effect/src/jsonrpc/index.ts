export { JsonRpcParseError, JsonRpcErrorResponse } from "./errors.js";

export {
	Request,
	from as requestFrom,
	isNotification,
	withParams,
	type JsonRpcRequestType,
	type JsonRpcIdType,
} from "./Request.js";

export {
	Response,
	from as responseFrom,
	parse as responseParse,
	isSuccess,
	isError,
	unwrap,
	type JsonRpcResponseType,
	type JsonRpcSuccessResponseType,
	type JsonRpcErrorResponseType,
} from "./Response.js";

export {
	JsonRpcError,
	from as errorFrom,
	toString as errorToString,
	// Standard JSON-RPC
	PARSE_ERROR,
	INVALID_REQUEST,
	METHOD_NOT_FOUND,
	INVALID_PARAMS,
	INTERNAL_ERROR,
	// EIP-1474 Ethereum
	INVALID_INPUT,
	RESOURCE_NOT_FOUND,
	RESOURCE_UNAVAILABLE,
	TRANSACTION_REJECTED,
	METHOD_NOT_SUPPORTED,
	LIMIT_EXCEEDED,
	JSON_RPC_VERSION_NOT_SUPPORTED,
	// EIP-1193 Provider
	USER_REJECTED_REQUEST,
	UNAUTHORIZED,
	UNSUPPORTED_METHOD,
	DISCONNECTED,
	CHAIN_DISCONNECTED,
	type JsonRpcErrorType,
} from "./Error.js";

export {
	// Typed error classes
	ParseError,
	InvalidRequestError,
	MethodNotFoundError,
	InvalidParamsError,
	InternalError,
	InvalidInputError,
	ResourceNotFoundError,
	ResourceUnavailableError,
	TransactionRejectedError,
	MethodNotSupportedError,
	LimitExceededError,
	UserRejectedRequestError,
	UnauthorizedError,
	UnsupportedMethodError,
	DisconnectedError,
	ChainDisconnectedError,
	// Helper
	parseErrorCode,
	type RpcErrorCode,
} from "./errors.js";

export {
	BatchRequest,
	from as batchRequestFrom,
	add as batchAdd,
	size as batchSize,
	type BatchRequestType,
} from "./BatchRequest.js";

export {
	BatchResponse,
	from as batchResponseFrom,
	parse as batchResponseParse,
	findById,
	errors as batchErrors,
	results as batchResults,
	type BatchResponseType,
} from "./BatchResponse.js";

export * as Eth from "./Eth.js";
export * as Wallet from "./Wallet.js";
export * as Net from "./Net.js";
export * as Web3 from "./Web3.js";
export * as Txpool from "./Txpool.js";
export * as Anvil from "./Anvil.js";
export * as Hardhat from "./Hardhat.js";
