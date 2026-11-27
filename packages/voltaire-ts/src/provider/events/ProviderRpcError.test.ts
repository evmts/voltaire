import { describe, expect, it } from "vitest";
import {
	EIP1193ErrorCode,
	JsonRpcErrorCode,
	ProviderRpcError,
} from "./ProviderRpcError.js";

describe("ProviderRpcError", () => {
	it("constructs an Error subclass with code, message, and optional data", () => {
		const err = new ProviderRpcError(
			EIP1193ErrorCode.UserRejectedRequest,
			"User rejected the request",
			{ origin: "https://playground.tevm.sh" },
		);

		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(ProviderRpcError);
		expect(err.name).toBe("ProviderRpcError");
		expect(err.code).toBe(4001);
		expect(err.message).toBe("User rejected the request");
		expect(err.data).toEqual({ origin: "https://playground.tevm.sh" });
	});

	it("leaves data undefined when omitted", () => {
		const err = new ProviderRpcError(
			JsonRpcErrorCode.MethodNotFound,
			"Method not found",
		);
		expect(err.code).toBe(-32601);
		expect(err.data).toBeUndefined();
	});

	it("exposes standard EIP-1193 error codes", () => {
		expect(EIP1193ErrorCode.UserRejectedRequest).toBe(4001);
		expect(EIP1193ErrorCode.Unauthorized).toBe(4100);
		expect(EIP1193ErrorCode.UnsupportedMethod).toBe(4200);
		expect(EIP1193ErrorCode.Disconnected).toBe(4900);
		expect(EIP1193ErrorCode.ChainDisconnected).toBe(4901);
	});

	it("exposes standard JSON-RPC 2.0 error codes", () => {
		expect(JsonRpcErrorCode.ParseError).toBe(-32700);
		expect(JsonRpcErrorCode.InvalidRequest).toBe(-32600);
		expect(JsonRpcErrorCode.MethodNotFound).toBe(-32601);
		expect(JsonRpcErrorCode.InvalidParams).toBe(-32602);
		expect(JsonRpcErrorCode.InternalError).toBe(-32603);
	});
});
