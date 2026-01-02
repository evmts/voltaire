import { describe, expect, test } from "vitest";
import { method, SubmitHashrateRequest } from "./eth_submitHashrate.js";

describe("eth_submitHashrate", () => {
	describe("Request Creation", () => {
		test("creates request with hashrate and id", () => {
			const hashrate =
				"0x0000000000000000000000000000000000000000000000000000000000500000";
			const id =
				"0x59daa26581d0acd1fce254fb7e85952f4c09d0915afd33d3886cd914bc7d283c";
			const req = SubmitHashrateRequest(hashrate, id);
			expect(req).toEqual({
				method: "eth_submitHashrate",
				params: [hashrate, id],
			});
		});

		test("creates request with different values", () => {
			const hashrate =
				"0x0000000000000000000000000000000000000000000000000000000000a00000";
			const id =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const req = SubmitHashrateRequest(hashrate, id);
			expect(req).toEqual({
				method: "eth_submitHashrate",
				params: [hashrate, id],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_submitHashrate");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const hashrate =
				"0x0000000000000000000000000000000000000000000000000000000000500000";
			const id =
				"0x59daa26581d0acd1fce254fb7e85952f4c09d0915afd33d3886cd914bc7d283c";
			const req = SubmitHashrateRequest(hashrate, id);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(2);
		});

		test("method matches constant", () => {
			const hashrate =
				"0x0000000000000000000000000000000000000000000000000000000000500000";
			const id =
				"0x59daa26581d0acd1fce254fb7e85952f4c09d0915afd33d3886cd914bc7d283c";
			const req = SubmitHashrateRequest(hashrate, id);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles 32-byte hashrate", () => {
			const hashrate =
				"0x0000000000000000000000000000000000000000000000000000000000000001";
			const id =
				"0x59daa26581d0acd1fce254fb7e85952f4c09d0915afd33d3886cd914bc7d283c";
			const req = SubmitHashrateRequest(hashrate, id);
			expect(req.params?.[0]).toBe(hashrate);
		});

		test("handles 32-byte client id", () => {
			const hashrate =
				"0x0000000000000000000000000000000000000000000000000000000000500000";
			const id =
				"0x0000000000000000000000000000000000000000000000000000000000000001";
			const req = SubmitHashrateRequest(hashrate, id);
			expect(req.params?.[1]).toBe(id);
		});

		test("handles zero hashrate", () => {
			const hashrate =
				"0x0000000000000000000000000000000000000000000000000000000000000000";
			const id =
				"0x59daa26581d0acd1fce254fb7e85952f4c09d0915afd33d3886cd914bc7d283c";
			const req = SubmitHashrateRequest(hashrate, id);
			expect(req.params?.[0]).toBe(hashrate);
		});

		test("handles high hashrate", () => {
			const hashrate =
				"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
			const id =
				"0x59daa26581d0acd1fce254fb7e85952f4c09d0915afd33d3886cd914bc7d283c";
			const req = SubmitHashrateRequest(hashrate, id);
			expect(req.params?.[0]).toBe(hashrate);
		});
	});
});
