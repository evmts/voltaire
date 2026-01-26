import * as Schema from "effect/Schema";
import { describe, expect, it } from "@effect/vitest";
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
		type: "eip1559" as const,
	};

	it("parses post-Byzantium receipt with status", () => {
		const receipt = Schema.decodeSync(Receipt.Schema)({
			...baseReceipt,
			status: 1,
		});
		expect(receipt.status).toBe(1);
		expect(receipt.root).toBeUndefined();
	});

	it("parses pre-Byzantium receipt with root", () => {
		const receipt = Schema.decodeSync(Receipt.Schema)({
			...baseReceipt,
			root: new Uint8Array(32).fill(0xef),
		});
		expect(receipt.root).toBeInstanceOf(Uint8Array);
		expect(receipt.status).toBeUndefined();
	});

	it("rejects receipt with both status and root", () => {
		expect(() =>
			Schema.decodeSync(Receipt.Schema)({
				...baseReceipt,
				status: 1,
				root: new Uint8Array(32).fill(0xef),
			}),
		).toThrow();
	});
});
