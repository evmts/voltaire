import { describe, expect, test } from "vitest";
import { method, SubmitWorkRequest } from "./eth_submitWork.js";

describe("eth_submitWork", () => {
	describe("Request Creation", () => {
		test("creates request with nonce, powHash and mixDigest", () => {
			const nonce = "0x0000000000000001";
			const powHash =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const mixDigest =
				"0xd1fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c";
			const req = SubmitWorkRequest(nonce, powHash, mixDigest);
			expect(req).toEqual({
				method: "eth_submitWork",
				params: [nonce, powHash, mixDigest],
			});
		});

		test("creates request with different values", () => {
			const nonce = "0x0000000000000abc";
			const powHash =
				"0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";
			const mixDigest =
				"0x1234123412341234123412341234123412341234123412341234123412341234";
			const req = SubmitWorkRequest(nonce, powHash, mixDigest);
			expect(req).toEqual({
				method: "eth_submitWork",
				params: [nonce, powHash, mixDigest],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_submitWork");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const nonce = "0x0000000000000001";
			const powHash =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const mixDigest =
				"0xd1fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c";
			const req = SubmitWorkRequest(nonce, powHash, mixDigest);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(3);
		});

		test("method matches constant", () => {
			const nonce = "0x0000000000000001";
			const powHash =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const mixDigest =
				"0xd1fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c";
			const req = SubmitWorkRequest(nonce, powHash, mixDigest);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles 8-byte nonce", () => {
			const nonce = "0x0000000000000000";
			const powHash =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const mixDigest =
				"0xd1fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c";
			const req = SubmitWorkRequest(nonce, powHash, mixDigest);
			expect(req.params?.[0]).toBe(nonce);
		});

		test("handles 32-byte powHash", () => {
			const nonce = "0x0000000000000001";
			const powHash =
				"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
			const mixDigest =
				"0xd1fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c3fe1d1c";
			const req = SubmitWorkRequest(nonce, powHash, mixDigest);
			expect(req.params?.[1]).toBe(powHash);
		});

		test("handles 32-byte mixDigest", () => {
			const nonce = "0x0000000000000001";
			const powHash =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const mixDigest =
				"0x0000000000000000000000000000000000000000000000000000000000000000";
			const req = SubmitWorkRequest(nonce, powHash, mixDigest);
			expect(req.params?.[2]).toBe(mixDigest);
		});
	});
});
