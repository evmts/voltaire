import { describe, expect, test } from "vitest";
import { BlobBaseFeeRequest, method } from "./eth_blobBaseFee.js";

describe("eth_blobBaseFee", () => {
	describe("Request Creation", () => {
		test("creates request with no parameters", () => {
			const req = BlobBaseFeeRequest();
			expect(req).toEqual({
				method: "eth_blobBaseFee",
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_blobBaseFee");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type", () => {
			const req = BlobBaseFeeRequest();
			expect(req).toHaveProperty("method");
			expect(req.params).toBeUndefined();
		});

		test("method matches constant", () => {
			const req = BlobBaseFeeRequest();
			expect(req.method).toBe(method);
		});
	});
});
