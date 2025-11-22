import { describe, test, expect } from "vitest";
import { method, SendRawTransactionRequest } from "./eth_sendRawTransaction.js";

describe("eth_sendRawTransaction", () => {
	describe("Request Creation", () => {
		test("creates request with signed transaction", () => {
			const signedTx = "0xf869018203e882520894f17f52151ebef6c7334fad080c5704d77216b732881bc16d674ec80000801ba02da1c48b670996dcb1f447ef9ef00b33033c48a4fe938f420bec3e56bfd24071a062e0aa78a81bf0290afbc3a9d8e9a068e6d74caa66c5e0fa8a46deaae96b0833";
			const req = SendRawTransactionRequest(signedTx);
			expect(req).toEqual({
				method: "eth_sendRawTransaction",
				params: [signedTx],
			});
		});

		test("method constant is correct", () => {
			expect(method).toBe("eth_sendRawTransaction");
		});
	});

	describe("Request Structure", () => {
		test("returns RequestArguments type with params", () => {
			const signedTx = "0xf869018203e882520894f17f52151ebef6c7334fad080c5704d77216b732881bc16d674ec80000801ba02da1c48b670996dcb1f447ef9ef00b33033c48a4fe938f420bec3e56bfd24071a062e0aa78a81bf0290afbc3a9d8e9a068e6d74caa66c5e0fa8a46deaae96b0833";
			const req = SendRawTransactionRequest(signedTx);
			expect(req).toHaveProperty("method");
			expect(req).toHaveProperty("params");
			expect(Array.isArray(req.params)).toBe(true);
			expect(req.params).toHaveLength(1);
		});

		test("method matches constant", () => {
			const signedTx = "0xf869018203e882520894f17f52151ebef6c7334fad080c5704d77216b732881bc16d674ec80000801ba02da1c48b670996dcb1f447ef9ef00b33033c48a4fe938f420bec3e56bfd24071a062e0aa78a81bf0290afbc3a9d8e9a068e6d74caa66c5e0fa8a46deaae96b0833";
			const req = SendRawTransactionRequest(signedTx);
			expect(req.method).toBe(method);
		});
	});

	describe("Edge Cases", () => {
		test("handles legacy transaction", () => {
			const signedTx = "0xf86c808504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83";
			const req = SendRawTransactionRequest(signedTx);
			expect(req.params?.[0]).toBe(signedTx);
		});

		test("handles EIP-1559 transaction", () => {
			const signedTx = "0x02f873011a8405f5e10085010e87e48082520894743d35cc6634c0532925a3b844bc9e7595f0beb0880de0b6b3a7640000c001a04e6b9b0e1e2c8b5f1e7e9e3f8e7e6e5e4e3e2e1e0e9e8e7e6e5e4e3e2e1e0e9a01e2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2";
			const req = SendRawTransactionRequest(signedTx);
			expect(req.params?.[0]).toBe(signedTx);
		});

		test("handles EIP-4844 blob transaction", () => {
			const signedTx = "0x03f9034501820a3c843b9aca00843b9aca07830186a094743d35cc6634c0532925a3b844bc9e7595f0beb08080c0";
			const req = SendRawTransactionRequest(signedTx);
			expect(req.params?.[0]).toBe(signedTx);
		});
	});
});
