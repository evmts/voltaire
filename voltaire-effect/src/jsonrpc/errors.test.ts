import { describe, expect, it } from "vitest";
import {
	JsonRpcParseError,
	JsonRpcErrorResponse,
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
	parseErrorCode,
} from "./errors.js";
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
		const error = new JsonRpcErrorResponse({ code: -32600, message: "Invalid Request" });
		expect(error._tag).toBe("JsonRpcError");
	});

	it("rpcCode matches input.code", () => {
		const error = new JsonRpcErrorResponse({ code: -32601, message: "Method not found" });
		expect(error.rpcCode).toBe(-32601);
	});

	it("message from input.message", () => {
		const error = new JsonRpcErrorResponse({ code: -32602, message: "Invalid params" });
		expect(error.message).toBe("Invalid params");
	});

	it("data preserved when provided", () => {
		const data = { details: "extra info" };
		const error = new JsonRpcErrorResponse({ code: -32603, message: "Internal error", data });
		expect(error.data).toBe(data);
	});

	it("data undefined when not provided", () => {
		const error = new JsonRpcErrorResponse({ code: -32700, message: "Parse error" });
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
