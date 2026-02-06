import { describe, expect, it } from "@effect/vitest";
import * as Schema from "effect/Schema";
import * as Siwe from "./index.js";

describe("Siwe.MessageStruct", () => {
	it("validates message structure", () => {
		const input = {
			domain: "example.com",
			address: new Uint8Array(20),
			uri: "https://example.com",
			version: "1",
			chainId: 1,
			nonce: "abc123",
			issuedAt: new Date().toISOString(),
		};
		const isValid = Schema.is(Siwe.MessageStruct)(input);
		expect(isValid).toBe(true);
	});

	it("rejects invalid structure", () => {
		const input = {
			domain: "example.com",
		};
		const isValid = Schema.is(Siwe.MessageStruct)(input);
		expect(isValid).toBe(false);
	});
});

describe("pure functions", () => {
	it("generateNonce creates random nonce", () => {
		const nonce1 = Siwe.generateNonce();
		const nonce2 = Siwe.generateNonce();
		expect(typeof nonce1).toBe("string");
		expect(nonce1.length).toBeGreaterThan(0);
		expect(nonce1).not.toBe(nonce2);
	});

	it("generateNonce respects length parameter", () => {
		const nonce = Siwe.generateNonce(8);
		expect(nonce.length).toBe(8);
	});
});
