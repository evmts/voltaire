import { describe, expect, it } from "vitest";
import { JsonRpcParseError, JsonRpcErrorResponse } from "./errors.js";

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
