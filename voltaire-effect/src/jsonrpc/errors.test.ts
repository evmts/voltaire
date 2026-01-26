import { describe, expect, it } from "vitest";
import {
	CHAIN_DISCONNECTED,
	DISCONNECTED,
	EXECUTION_REVERTED,
	INTERNAL_ERROR,
	INVALID_INPUT,
	INVALID_PARAMS,
	INVALID_REQUEST,
	isDisconnected,
	isProviderError,
	isUserRejected,
	LIMIT_EXCEEDED,
	METHOD_NOT_FOUND,
	METHOD_NOT_SUPPORTED,
	PARSE_ERROR,
	RESOURCE_NOT_FOUND,
	RESOURCE_UNAVAILABLE,
	TRANSACTION_REJECTED,
	UNAUTHORIZED,
	UNSUPPORTED_METHOD,
	USER_REJECTED_REQUEST,
} from "./Error.js";
import {
	ChainDisconnectedError,
	DisconnectedError,
	InternalError,
	InvalidInputError,
	InvalidParamsError,
	InvalidRequestError,
	JsonRpcErrorResponse,
	JsonRpcParseError,
	LimitExceededError,
	MethodNotFoundError,
	MethodNotSupportedError,
	ParseError,
	parseErrorCode,
	ResourceNotFoundError,
	ResourceUnavailableError,
	TransactionRejectedError,
	UnauthorizedError,
	UnsupportedMethodError,
	UserRejectedRequestError,
} from "./errors.js";

describe("JsonRpcParseError", () => {
	it("_tag is JsonRpcParseError", () => {
		const error = new JsonRpcParseError("invalid");
		expect(error._tag).toBe("JsonRpcParseError");
	});

	it("default message when none provided", () => {
		const error = new JsonRpcParseError("invalid");
		expect(error.message).toBe("Failed to parse JSON-RPC message");
	});

	it("custom message used when provided", () => {
		const error = new JsonRpcParseError("invalid", "Custom parse error");
		expect(error.message).toBe("Custom parse error");
	});

	it("input preservation", () => {
		const input = { foo: "bar" };
		const error = new JsonRpcParseError(input);
		expect(error.input).toBe(input);
	});

	it("cause propagation", () => {
		const cause = new Error("underlying error");
		const error = new JsonRpcParseError("invalid", undefined, { cause });
		expect(error.cause).toBe(cause);
	});
});

describe("JsonRpcErrorResponse", () => {
	it("_tag is JsonRpcError", () => {
		const error = new JsonRpcErrorResponse({
			code: -32600,
			message: "Invalid Request",
		});
		expect(error._tag).toBe("JsonRpcError");
	});

	it("rpcCode matches input.code", () => {
		const error = new JsonRpcErrorResponse({
			code: -32601,
			message: "Method not found",
		});
		expect(error.rpcCode).toBe(-32601);
	});

	it("message from input.message", () => {
		const error = new JsonRpcErrorResponse({
			code: -32602,
			message: "Invalid params",
		});
		expect(error.message).toBe("Invalid params");
	});

	it("data preserved when provided", () => {
		const data = { details: "extra info" };
		const error = new JsonRpcErrorResponse({
			code: -32603,
			message: "Internal error",
			data,
		});
		expect(error.data).toBe(data);
	});

	it("data undefined when not provided", () => {
		const error = new JsonRpcErrorResponse({
			code: -32700,
			message: "Parse error",
		});
		expect(error.data).toBeUndefined();
	});
});

describe("Standard JSON-RPC error classes", () => {
	it("ParseError has correct rpcCode and _tag", () => {
		const error = new ParseError();
		expect(error._tag).toBe("ParseError");
		expect(error.rpcCode).toBe(PARSE_ERROR);
		expect(error.message).toBe("Parse error");
	});

	it("InvalidRequestError has correct rpcCode and _tag", () => {
		const error = new InvalidRequestError();
		expect(error._tag).toBe("InvalidRequestError");
		expect(error.rpcCode).toBe(INVALID_REQUEST);
		expect(error.message).toBe("Invalid request");
	});

	it("MethodNotFoundError has correct rpcCode and _tag", () => {
		const error = new MethodNotFoundError();
		expect(error._tag).toBe("MethodNotFoundError");
		expect(error.rpcCode).toBe(METHOD_NOT_FOUND);
		expect(error.message).toBe("Method not found");
	});

	it("InvalidParamsError has correct rpcCode and _tag", () => {
		const error = new InvalidParamsError();
		expect(error._tag).toBe("InvalidParamsError");
		expect(error.rpcCode).toBe(INVALID_PARAMS);
		expect(error.message).toBe("Invalid params");
	});

	it("InternalError has correct rpcCode and _tag", () => {
		const error = new InternalError();
		expect(error._tag).toBe("InternalError");
		expect(error.rpcCode).toBe(INTERNAL_ERROR);
		expect(error.message).toBe("Internal error");
	});

	it("custom message is used", () => {
		const error = new ParseError("Custom parse error");
		expect(error.message).toBe("Custom parse error");
	});

	it("data is preserved", () => {
		const data = { extra: "info" };
		const error = new ParseError(undefined, { data });
		expect(error.data).toBe(data);
	});
});

describe("EIP-1474 Ethereum error classes", () => {
	it("InvalidInputError has correct rpcCode", () => {
		const error = new InvalidInputError();
		expect(error._tag).toBe("InvalidInputError");
		expect(error.rpcCode).toBe(INVALID_INPUT);
	});

	it("ResourceNotFoundError has correct rpcCode", () => {
		const error = new ResourceNotFoundError();
		expect(error._tag).toBe("ResourceNotFoundError");
		expect(error.rpcCode).toBe(RESOURCE_NOT_FOUND);
	});

	it("ResourceUnavailableError has correct rpcCode", () => {
		const error = new ResourceUnavailableError();
		expect(error._tag).toBe("ResourceUnavailableError");
		expect(error.rpcCode).toBe(RESOURCE_UNAVAILABLE);
	});

	it("TransactionRejectedError has correct rpcCode", () => {
		const error = new TransactionRejectedError();
		expect(error._tag).toBe("TransactionRejectedError");
		expect(error.rpcCode).toBe(TRANSACTION_REJECTED);
	});

	it("MethodNotSupportedError has correct rpcCode", () => {
		const error = new MethodNotSupportedError();
		expect(error._tag).toBe("MethodNotSupportedError");
		expect(error.rpcCode).toBe(METHOD_NOT_SUPPORTED);
	});

	it("LimitExceededError has correct rpcCode", () => {
		const error = new LimitExceededError();
		expect(error._tag).toBe("LimitExceededError");
		expect(error.rpcCode).toBe(LIMIT_EXCEEDED);
	});
});

describe("EIP-1193 Provider error classes", () => {
	it("UserRejectedRequestError has correct rpcCode", () => {
		const error = new UserRejectedRequestError();
		expect(error._tag).toBe("UserRejectedRequestError");
		expect(error.rpcCode).toBe(USER_REJECTED_REQUEST);
	});

	it("UnauthorizedError has correct rpcCode", () => {
		const error = new UnauthorizedError();
		expect(error._tag).toBe("UnauthorizedError");
		expect(error.rpcCode).toBe(UNAUTHORIZED);
	});

	it("UnsupportedMethodError has correct rpcCode", () => {
		const error = new UnsupportedMethodError();
		expect(error._tag).toBe("UnsupportedMethodError");
		expect(error.rpcCode).toBe(UNSUPPORTED_METHOD);
	});

	it("DisconnectedError has correct rpcCode", () => {
		const error = new DisconnectedError();
		expect(error._tag).toBe("DisconnectedError");
		expect(error.rpcCode).toBe(DISCONNECTED);
	});

	it("ChainDisconnectedError has correct rpcCode", () => {
		const error = new ChainDisconnectedError();
		expect(error._tag).toBe("ChainDisconnectedError");
		expect(error.rpcCode).toBe(CHAIN_DISCONNECTED);
	});
});

describe("Error code constants", () => {
	it("Standard JSON-RPC error codes have correct values", () => {
		expect(PARSE_ERROR).toBe(-32700);
		expect(INVALID_REQUEST).toBe(-32600);
		expect(METHOD_NOT_FOUND).toBe(-32601);
		expect(INVALID_PARAMS).toBe(-32602);
		expect(INTERNAL_ERROR).toBe(-32603);
	});

	it("EIP-1474 Ethereum error codes have correct values", () => {
		expect(INVALID_INPUT).toBe(-32000);
		expect(RESOURCE_NOT_FOUND).toBe(-32001);
		expect(RESOURCE_UNAVAILABLE).toBe(-32002);
		expect(TRANSACTION_REJECTED).toBe(-32003);
		expect(METHOD_NOT_SUPPORTED).toBe(-32004);
		expect(LIMIT_EXCEEDED).toBe(-32005);
	});

	it("EIP-1193 Provider error codes have correct values", () => {
		expect(USER_REJECTED_REQUEST).toBe(4001);
		expect(UNAUTHORIZED).toBe(4100);
		expect(UNSUPPORTED_METHOD).toBe(4200);
		expect(DISCONNECTED).toBe(4900);
		expect(CHAIN_DISCONNECTED).toBe(4901);
	});

	it("EXECUTION_REVERTED has correct value", () => {
		expect(EXECUTION_REVERTED).toBe(3);
	});
});

describe("isUserRejected", () => {
	it("returns true for USER_REJECTED_REQUEST", () => {
		expect(isUserRejected(USER_REJECTED_REQUEST)).toBe(true);
		expect(isUserRejected(4001)).toBe(true);
	});

	it("returns false for other codes", () => {
		expect(isUserRejected(4100)).toBe(false);
		expect(isUserRejected(-32600)).toBe(false);
		expect(isUserRejected(0)).toBe(false);
	});
});

describe("isDisconnected", () => {
	it("returns true for DISCONNECTED", () => {
		expect(isDisconnected(DISCONNECTED)).toBe(true);
		expect(isDisconnected(4900)).toBe(true);
	});

	it("returns true for CHAIN_DISCONNECTED", () => {
		expect(isDisconnected(CHAIN_DISCONNECTED)).toBe(true);
		expect(isDisconnected(4901)).toBe(true);
	});

	it("returns false for other codes", () => {
		expect(isDisconnected(4001)).toBe(false);
		expect(isDisconnected(-32600)).toBe(false);
	});
});

describe("isProviderError", () => {
	it("returns true for codes in 4000-4999 range", () => {
		expect(isProviderError(4000)).toBe(true);
		expect(isProviderError(4001)).toBe(true);
		expect(isProviderError(4500)).toBe(true);
		expect(isProviderError(4999)).toBe(true);
	});

	it("returns false for codes outside 4000-4999 range", () => {
		expect(isProviderError(3999)).toBe(false);
		expect(isProviderError(5000)).toBe(false);
		expect(isProviderError(-32600)).toBe(false);
		expect(isProviderError(0)).toBe(false);
	});
});

describe("parseErrorCode", () => {
	it("returns ParseError for -32700", () => {
		const error = parseErrorCode({ code: PARSE_ERROR });
		expect(error).toBeInstanceOf(ParseError);
	});

	it("returns InvalidRequestError for -32600", () => {
		const error = parseErrorCode({ code: INVALID_REQUEST });
		expect(error).toBeInstanceOf(InvalidRequestError);
	});

	it("returns MethodNotFoundError for -32601", () => {
		const error = parseErrorCode({ code: METHOD_NOT_FOUND });
		expect(error).toBeInstanceOf(MethodNotFoundError);
	});

	it("returns UserRejectedRequestError for 4001", () => {
		const error = parseErrorCode({ code: USER_REJECTED_REQUEST });
		expect(error).toBeInstanceOf(UserRejectedRequestError);
	});

	it("returns DisconnectedError for 4900", () => {
		const error = parseErrorCode({ code: DISCONNECTED });
		expect(error).toBeInstanceOf(DisconnectedError);
	});

	it("preserves custom message", () => {
		const error = parseErrorCode({ code: PARSE_ERROR, message: "Custom" });
		expect(error.message).toBe("Custom");
	});

	it("preserves data", () => {
		const data = { detail: "extra" };
		const error = parseErrorCode({ code: PARSE_ERROR, data }) as ParseError;
		expect(error.data).toBe(data);
	});

	it("returns JsonRpcErrorResponse for unknown codes", () => {
		const error = parseErrorCode({ code: 9999, message: "Unknown" });
		expect(error).toBeInstanceOf(JsonRpcErrorResponse);
	});
});
