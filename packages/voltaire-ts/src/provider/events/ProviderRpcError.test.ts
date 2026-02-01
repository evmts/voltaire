/**
 * Provider RPC Error Tests
 */

import { describe, expect, it } from "vitest";
import {
	EIP1193ErrorCode,
	JsonRpcErrorCode,
	ProviderRpcError,
} from "./ProviderRpcError.js";

describe("ProviderRpcError", () => {
	it("constructs error with code and message", () => {
		const error = new ProviderRpcError(4001, "User rejected request");

		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(ProviderRpcError);
		expect(error.name).toBe("ProviderRpcError");
		expect(error.code).toBe(4001);
		expect(error.message).toBe("User rejected request");
		expect(error.data).toBeUndefined();
	});

	it("constructs error with optional data", () => {
		const data = { method: "eth_customMethod" };
		const error = new ProviderRpcError(4200, "Unsupported method", data);

		expect(error.code).toBe(4200);
		expect(error.message).toBe("Unsupported method");
		expect(error.data).toEqual(data);
	});

	it("supports standard EIP-1193 error codes", () => {
		expect(EIP1193ErrorCode.UserRejectedRequest).toBe(4001);
		expect(EIP1193ErrorCode.Unauthorized).toBe(4100);
		expect(EIP1193ErrorCode.UnsupportedMethod).toBe(4200);
		expect(EIP1193ErrorCode.Disconnected).toBe(4900);
		expect(EIP1193ErrorCode.ChainDisconnected).toBe(4901);
	});

	it("supports JSON-RPC 2.0 error codes", () => {
		expect(JsonRpcErrorCode.ParseError).toBe(-32700);
		expect(JsonRpcErrorCode.InvalidRequest).toBe(-32600);
		expect(JsonRpcErrorCode.MethodNotFound).toBe(-32601);
		expect(JsonRpcErrorCode.InvalidParams).toBe(-32602);
		expect(JsonRpcErrorCode.InternalError).toBe(-32603);
	});

	it("can be thrown and caught", () => {
		expect(() => {
			throw new ProviderRpcError(4001, "User rejected request");
		}).toThrow(ProviderRpcError);

		expect(() => {
			throw new ProviderRpcError(4001, "User rejected request");
		}).toThrow("User rejected request");
	});

	it("preserves stack trace", () => {
		const error = new ProviderRpcError(4001, "User rejected request");
		expect(error.stack).toBeDefined();
		expect(error.stack).toContain("ProviderRpcError");
	});

	it("can be serialized to JSON", () => {
		const error = new ProviderRpcError(4001, "User rejected request", {
			extra: "info",
		});
		const json = JSON.stringify(error);
		const parsed = JSON.parse(json);

		// Note: JSON.stringify on Error doesn't include message/code by default
		// but the data field should be preserved
		expect(parsed.data).toEqual({ extra: "info" });
	});
});
