import { describe, expect, it } from "@effect/vitest";
import { EventStreamError } from "./EventStreamError.js";

describe("EventStreamError", () => {
	describe("constructor", () => {
		it("creates error with message", () => {
			const error = new EventStreamError("Event stream failed");
			expect(error.message).toBe("Event stream failed");
			expect(error.name).toBe("EventStreamError");
			expect(error._tag).toBe("EventStreamError");
		});

		it("creates error with cause", () => {
			const originalError = new Error("Connection lost");
			const error = new EventStreamError("Event stream disconnected", {
				cause: originalError,
			});
			expect(error.cause).toBe(originalError);
		});

		it("creates error with context", () => {
			const context = {
				contractAddress: "0x1234",
				eventName: "Transfer",
				fromBlock: 12345,
			};
			const error = new EventStreamError("Failed to subscribe", { context });
			expect(
				(error as unknown as { context: Record<string, unknown> }).context,
			).toEqual(context);
		});

		it("creates error with both cause and context", () => {
			const originalError = new Error("RPC error");
			const context = { blockRange: "100-200" };
			const error = new EventStreamError("Event fetch failed", {
				cause: originalError,
				context,
			});
			expect(error.cause).toBe(originalError);
			expect(
				(error as unknown as { context: Record<string, unknown> }).context,
			).toEqual(context);
		});
	});

	describe("instanceof checks", () => {
		it("EventStreamError is instanceof Error", () => {
			const error = new EventStreamError("Error");
			expect(error instanceof Error).toBe(true);
		});

		it("EventStreamError is instanceof EventStreamError", () => {
			const error = new EventStreamError("Error");
			expect(error instanceof EventStreamError).toBe(true);
		});
	});

	describe("stack trace", () => {
		it("has stack trace", () => {
			const error = new EventStreamError("Error");
			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("EventStreamError");
		});
	});

	describe("edge cases", () => {
		it("handles empty message", () => {
			const error = new EventStreamError("");
			expect(error.message).toBe("");
		});

		it("handles long error messages", () => {
			const longMessage = "A".repeat(1000);
			const error = new EventStreamError(longMessage);
			expect(error.message).toBe(longMessage);
			expect(error.message.length).toBe(1000);
		});

		it("handles special characters in message", () => {
			const specialMessage = "Error: <script>alert('xss')</script>";
			const error = new EventStreamError(specialMessage);
			expect(error.message).toBe(specialMessage);
		});

		it("handles newlines in message", () => {
			const multilineMessage = "Line 1\nLine 2\nLine 3";
			const error = new EventStreamError(multilineMessage);
			expect(error.message).toBe(multilineMessage);
		});
	});
});
