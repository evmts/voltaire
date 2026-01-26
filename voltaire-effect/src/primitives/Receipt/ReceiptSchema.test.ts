import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as Receipt from "./index.js";

describe("Receipt.Schema", () => {
	const baseReceipt = {
		transactionHash: new Uint8Array(32).fill(0xab),
		blockNumber: 1n,
		blockHash: new Uint8Array(32).fill(0xcd),
		transactionIndex: 0,
		from: `0x${"11".repeat(20)}`,
		to: `0x${"22".repeat(20)}`,
		cumulativeGasUsed: 21000n,
		gasUsed: 21000n,
		effectiveGasPrice: 1000000000n,
		contractAddress: null,
		logs: [],
		logsBloom: new Uint8Array(256),
		type: "eip1559",
	};

	it("parses post-Byzantium receipt with status", () => {
		const receipt = Schema.decodeUnknownSync(Receipt.Schema)({
			...baseReceipt,
			status: 1,
		});
		expect(receipt.status).toBe(1);
		expect(receipt.root).toBeUndefined();
	});

	it("parses pre-Byzantium receipt with root", () => {
		const receipt = Schema.decodeUnknownSync(Receipt.Schema)({
			...baseReceipt,
			root: new Uint8Array(32).fill(0xef),
		});
		expect(receipt.root).toBeInstanceOf(Uint8Array);
		expect(receipt.status).toBeUndefined();
	});

	it("rejects receipt with both status and root", () => {
		expect(() =>
			Schema.decodeUnknownSync(Receipt.Schema)({
				...baseReceipt,
				status: 1,
				root: new Uint8Array(32).fill(0xef),
			}),
		).toThrow();
	});

	it("parses EIP-4844 blob gas fields", () => {
		const receipt = Schema.decodeUnknownSync(Receipt.Schema)({
			...baseReceipt,
			status: 1,
			type: "eip4844",
			blobGasUsed: 131072n,
			blobGasPrice: 1000000000n,
		});
		expect(receipt.blobGasUsed).toBe(131072n);
		expect(receipt.blobGasPrice).toBe(1000000000n);
		expect(receipt.type).toBe("eip4844");
	});

	it("requires effectiveGasPrice", () => {
		const { effectiveGasPrice, ...receiptWithoutGasPrice } = baseReceipt;
		expect(() =>
			Schema.decodeUnknownSync(Receipt.Schema)({
				...receiptWithoutGasPrice,
				status: 1,
			}),
		).toThrow();
	});

	it("requires type field", () => {
		const { type, ...receiptWithoutType } = baseReceipt;
		expect(() =>
			Schema.decodeUnknownSync(Receipt.Schema)({
				...receiptWithoutType,
				status: 1,
			}),
		).toThrow();
	});

	it("accepts all transaction types", () => {
		const types = ["legacy", "eip2930", "eip1559", "eip4844", "eip7702"];
		for (const txType of types) {
			const receipt = Schema.decodeUnknownSync(Receipt.Schema)({
				...baseReceipt,
				status: 1,
				type: txType,
			});
			expect(receipt.type).toBe(txType);
		}
	});
});
