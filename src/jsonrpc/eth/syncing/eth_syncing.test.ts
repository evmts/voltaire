import { describe, test, expect } from "vitest";
import { method, SyncingRequest } from "./eth_syncing.js";

describe("eth_syncing", () => {
	describe("Request Creation", () => {
		test("creates request with no parameters", () => {
			const req = SyncingRequest();
			expect(req).toEqual({
				method: "eth_syncing",
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_syncing");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type", () => {
			const req = SyncingRequest();
			expect(req).toHaveProperty("method");
			expect(req.params).toBeUndefined();
		});

		test("method matches constant", () => {
			const req = SyncingRequest();
			expect(req.method).toBe(method);
		});
	});
});
