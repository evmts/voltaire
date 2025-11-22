import { describe, test, expect } from "vitest";
import { method, ProtocolVersionRequest } from "./eth_protocolVersion.js";

describe("eth_protocolVersion", () => {
	describe("Request Creation", () => {
		test("creates request with no parameters", () => {
			const req = ProtocolVersionRequest();
			expect(req).toEqual({
				method: "eth_protocolVersion",
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_protocolVersion");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type", () => {
			const req = ProtocolVersionRequest();
			expect(req).toHaveProperty("method");
			expect(req.params).toBeUndefined();
		});

		test("method matches constant", () => {
			const req = ProtocolVersionRequest();
			expect(req.method).toBe(method);
		});
	});
});
