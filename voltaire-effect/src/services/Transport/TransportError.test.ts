import { describe, expect, it } from "@effect/vitest";
import { TransportError } from "./TransportError.js";

describe("TransportError", () => {
	describe("constructor", () => {
		it("creates error with code and message", () => {
			const error = new TransportError({
				code: -32603,
				message: "Internal error",
			});

			expect(error.code).toBe(-32603);
			expect(error.message).toBe("Internal error");
			expect(error.name).toBe("TransportError");
			expect(error._tag).toBe("TransportError");
		});

		it("stores data", () => {
			const errorData = {
				revertReason: "0x08c379a0...",
				details: { gas: 21000 },
			};
			const error = new TransportError({
				code: -32000,
				message: "reverted",
				data: errorData,
			});

			expect(error.data).toEqual(errorData);
		});

		it("stores context object", () => {
			const context = { method: "eth_call", params: ["0x123"] };
			const error = new TransportError(
				{ code: -32603, message: "Error" },
				undefined,
				{ context },
			);

			expect(error.context).toEqual(context);
		});

		it("stores cause", () => {
			const originalError = new Error("Original error");
			const error = new TransportError(
				{ code: -32603, message: "Wrapped error" },
				undefined,
				{ cause: originalError },
			);

			expect(error.cause).toBe(originalError);
		});
	});

	describe("instanceof checks", () => {
		it("is instanceof Error", () => {
			const error = new TransportError({ code: -32603, message: "Error" });
			expect(error instanceof Error).toBe(true);
		});

		it("is instanceof TransportError", () => {
			const error = new TransportError({ code: -32603, message: "Error" });
			expect(error instanceof TransportError).toBe(true);
		});
	});

	describe("standard JSON-RPC error codes", () => {
		it("handles parse error -32700", () => {
			const error = new TransportError({
				code: -32700,
				message: "Parse error",
			});
			expect(error.code).toBe(-32700);
		});

		it("handles invalid request -32600", () => {
			const error = new TransportError({
				code: -32600,
				message: "Invalid Request",
			});
			expect(error.code).toBe(-32600);
		});

		it("handles method not found -32601", () => {
			const error = new TransportError({
				code: -32601,
				message: "Method not found",
			});
			expect(error.code).toBe(-32601);
		});

		it("handles invalid params -32602", () => {
			const error = new TransportError({
				code: -32602,
				message: "Invalid params",
			});
			expect(error.code).toBe(-32602);
		});

		it("handles internal error -32603", () => {
			const error = new TransportError({
				code: -32603,
				message: "Internal error",
			});
			expect(error.code).toBe(-32603);
		});

		it("handles server error range -32000 to -32099", () => {
			const error32000 = new TransportError({
				code: -32000,
				message: "Server error",
			});
			const error32099 = new TransportError({
				code: -32099,
				message: "Server error",
			});
			expect(error32000.code).toBe(-32000);
			expect(error32099.code).toBe(-32099);
		});
	});

	describe("stack trace", () => {
		it("has stack trace", () => {
			const error = new TransportError({ code: -32603, message: "Error" });
			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("TransportError");
		});
	});

	describe("edge cases", () => {
		it("handles empty message", () => {
			const error = new TransportError({ code: -32603, message: "" });
			expect(error.message).toBe("");
		});

		it("handles undefined data", () => {
			const error = new TransportError({ code: -32603, message: "Error" });
			expect(error.data).toBeUndefined();
		});

		it("handles null data", () => {
			const error = new TransportError({
				code: -32603,
				message: "Error",
				data: null,
			});
			expect(error.data).toBeNull();
		});

		it("handles complex nested data", () => {
			const nestedData = {
				level1: {
					level2: {
						array: [1, 2, { nested: true }],
					},
				},
			};
			const error = new TransportError({
				code: -32603,
				message: "Error",
				data: nestedData,
			});
			expect(error.data).toEqual(nestedData);
		});
	});
});
