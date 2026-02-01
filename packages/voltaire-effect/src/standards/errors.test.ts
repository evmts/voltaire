import { describe, expect, it } from "vitest";
import { StandardsError } from "./errors.js";

describe("StandardsError", () => {
	it("has correct _tag value", () => {
		const error = new StandardsError({
			operation: "transfer",
			message: "Transfer failed",
		});
		expect(error._tag).toBe("StandardsError");
	});

	it("preserves message", () => {
		const error = new StandardsError({
			operation: "approve",
			message: "Approval failed",
		});
		expect(error.message).toBe("Approval failed");
	});

	it("preserves operation", () => {
		const error = new StandardsError({
			operation: "balanceOf",
			message: "Balance query failed",
		});
		expect(error.operation).toBe("balanceOf");
	});

	it("propagates cause when provided", () => {
		const cause = new Error("Underlying error");
		const error = new StandardsError({
			operation: "transfer",
			message: "Transfer failed",
			cause,
		});
		expect(error.cause).toBe(cause);
	});

	it("has undefined cause when not provided", () => {
		const error = new StandardsError({
			operation: "transfer",
			message: "Transfer failed",
		});
		expect(error.cause).toBeUndefined();
	});

	it("is an instance of Error", () => {
		const error = new StandardsError({
			operation: "mint",
			message: "Mint failed",
		});
		expect(error).toBeInstanceOf(Error);
	});
});
