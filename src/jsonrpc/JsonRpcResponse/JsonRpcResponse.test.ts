import { describe, expect, it } from "vitest";
import {
	JsonRpcResponse,
	error,
	from,
	isError,
	isSuccess,
	success,
	unwrap,
} from "./index.js";

describe("JsonRpcResponse", () => {
	describe("from", () => {
		it("creates success response from object", () => {
			const res = from({
				id: 1,
				result: "0x123456",
			});
			expect(res).toEqual({
				jsonrpc: "2.0",
				id: 1,
				result: "0x123456",
			});
		});

		it("creates error response from object", () => {
			const res = from({
				id: 2,
				error: {
					code: -32601,
					message: "Method not found",
				},
			});
			expect(res).toEqual({
				jsonrpc: "2.0",
				id: 2,
				error: {
					code: -32601,
					message: "Method not found",
				},
			});
		});

		it("creates response with string id", () => {
			const res = from({
				id: "test-123",
				result: true,
			});
			expect(res.id).toBe("test-123");
		});

		it("creates response with null id", () => {
			const res = from({
				id: null,
				result: 42,
			});
			expect(res.id).toBe(null);
		});

		it("defaults undefined id to null", () => {
			const res = from({
				result: "data",
			});
			expect(res.id).toBe(null);
		});

		it("includes error data if present", () => {
			const res = from({
				id: 1,
				error: {
					code: -32602,
					message: "Invalid params",
					data: { expected: "number" },
				},
			});
			expect(res).toEqual({
				jsonrpc: "2.0",
				id: 1,
				error: {
					code: -32602,
					message: "Invalid params",
					data: { expected: "number" },
				},
			});
		});

		it("throws on invalid response type", () => {
			// @ts-expect-error - Testing invalid input
			expect(() => from(null)).toThrow(TypeError);
			// @ts-expect-error - Testing invalid input
			expect(() => from("invalid")).toThrow(TypeError);
		});

		it("throws on invalid id type", () => {
			expect(() =>
				from({
					// @ts-expect-error - Testing invalid input
					id: {},
					result: "test",
				}),
			).toThrow(TypeError);
		});

		it("throws if missing both result and error", () => {
			expect(() =>
				from({
					id: 1,
				}),
			).toThrow(TypeError);
		});

		it("throws if has both result and error", () => {
			expect(() =>
				from({
					id: 1,
					result: "data",
					error: { code: -32601, message: "test" },
				}),
			).toThrow(TypeError);
		});

		it("throws on invalid error object", () => {
			expect(() =>
				from({
					id: 1,
					// @ts-expect-error - Testing invalid input
					error: "invalid",
				}),
			).toThrow(TypeError);
		});

		it("throws on invalid error code", () => {
			expect(() =>
				from({
					id: 1,
					error: {
						// @ts-expect-error - Testing invalid input
						code: "invalid",
						message: "test",
					},
				}),
			).toThrow(TypeError);
		});

		it("throws on invalid error message", () => {
			expect(() =>
				from({
					id: 1,
					error: {
						code: -32601,
						// @ts-expect-error - Testing invalid input
						message: 123,
					},
				}),
			).toThrow(TypeError);
		});
	});

	describe("success", () => {
		it("creates success response", () => {
			const res = success(1, "0x123456");
			expect(res).toEqual({
				jsonrpc: "2.0",
				id: 1,
				result: "0x123456",
			});
		});

		it("creates success with null id", () => {
			const res = success(null, 42);
			expect(res.id).toBe(null);
		});

		it("creates success with string id", () => {
			const res = success("abc", true);
			expect(res.id).toBe("abc");
		});
	});

	describe("error", () => {
		it("creates error response", () => {
			const res = error(1, {
				code: -32601,
				message: "Method not found",
			});
			expect(res).toEqual({
				jsonrpc: "2.0",
				id: 1,
				error: {
					code: -32601,
					message: "Method not found",
				},
			});
		});

		it("creates error with data", () => {
			const res = error(2, {
				code: -32602,
				message: "Invalid params",
				data: { field: "amount" },
			});
			expect(res.error.data).toEqual({ field: "amount" });
		});
	});

	describe("isSuccess", () => {
		it("returns true for success response", () => {
			const res = success(1, "data");
			expect(isSuccess(res)).toBe(true);
		});

		it("returns false for error response", () => {
			const res = error(1, { code: -32601, message: "test" });
			expect(isSuccess(res)).toBe(false);
		});
	});

	describe("isError", () => {
		it("returns true for error response", () => {
			const res = error(1, { code: -32601, message: "test" });
			expect(isError(res)).toBe(true);
		});

		it("returns false for success response", () => {
			const res = success(1, "data");
			expect(isError(res)).toBe(false);
		});
	});

	describe("unwrap", () => {
		it("returns result for success response", () => {
			const res = success(1, "0x123456");
			expect(unwrap(res)).toBe("0x123456");
		});

		it("throws for error response", () => {
			const res = error(1, {
				code: -32601,
				message: "Method not found",
			});
			expect(() => unwrap(res)).toThrow("Method not found");
		});

		it("thrown error includes code", () => {
			const res = error(1, {
				code: -32601,
				message: "Method not found",
			});
			try {
				unwrap(res);
				expect.fail("Should have thrown");
				// biome-ignore lint/suspicious/noExplicitAny: testing error properties
		} catch (err: any) {
				expect(err.code).toBe(-32601);
			}
		});

		it("thrown error includes data", () => {
			const res = error(1, {
				code: -32602,
				message: "Invalid params",
				data: { field: "amount" },
			});
			try {
				unwrap(res);
				expect.fail("Should have thrown");
				// biome-ignore lint/suspicious/noExplicitAny: testing error properties
		} catch (err: any) {
				expect(err.data).toEqual({ field: "amount" });
			}
		});
	});

	describe("namespace", () => {
		it("JsonRpcResponse.from() works", () => {
			const res = JsonRpcResponse.from({ id: 1, result: "data" });
			expect(res.result).toBe("data");
		});

		it("JsonRpcResponse.success() works", () => {
			const res = JsonRpcResponse.success(1, "data");
			expect(res.result).toBe("data");
		});

		it("JsonRpcResponse.error() works", () => {
			const res = JsonRpcResponse.error(1, {
				code: -32601,
				message: "test",
			});
			expect(res.error.code).toBe(-32601);
		});

		it("JsonRpcResponse.isSuccess() works", () => {
			const res = JsonRpcResponse.success(1, "data");
			expect(JsonRpcResponse.isSuccess(res)).toBe(true);
		});

		it("JsonRpcResponse.isError() works", () => {
			const res = JsonRpcResponse.error(1, { code: -32601, message: "test" });
			expect(JsonRpcResponse.isError(res)).toBe(true);
		});

		it("JsonRpcResponse.unwrap() works", () => {
			const res = JsonRpcResponse.success(1, "data");
			expect(JsonRpcResponse.unwrap(res)).toBe("data");
		});
	});

	describe("real-world scenarios", () => {
		it("handles eth_blockNumber success", () => {
			const res = from({
				id: 1,
				result: "0x1234567",
			});
			expect(isSuccess(res)).toBe(true);
			if (isSuccess(res)) {
				expect(res.result).toBe("0x1234567");
			}
		});

		it("handles method not found error", () => {
			const res = from({
				id: 2,
				error: {
					code: -32601,
					message: "Method not found",
				},
			});
			expect(isError(res)).toBe(true);
			if (isError(res)) {
				expect(res.error.code).toBe(-32601);
			}
		});

		it("type guards work correctly", () => {
			const res = from({ id: 1, result: "data" });

			if (isSuccess(res)) {
				// TypeScript should know res.result exists
				expect(res.result).toBe("data");
			} else {
				// TypeScript should know res.error exists
				expect.fail("Should be success");
			}
		});
	});
});
