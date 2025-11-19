import { describe, expect, it } from "vitest";
import * as BlockBody from "./index.js";
import type { Any as Transaction } from "../Transaction/types.js";

describe("BlockBody", () => {
	// Mock minimal transaction
	const mockTransaction: Transaction = {
		type: 0x00,
		nonce: 0n,
		gasPrice: 1000000000n,
		gasLimit: 21000n,
		to: null,
		value: 0n,
		data: new Uint8Array(0),
		v: 27n,
		r: new Uint8Array(32),
		s: new Uint8Array(32),
	};

	describe("from", () => {
		it("creates body with transactions and ommers", () => {
			const body = BlockBody.from({
				transactions: [mockTransaction],
				ommers: [],
			});

			expect(body.transactions).toHaveLength(1);
			expect(body.ommers).toHaveLength(0);
			expect(body.withdrawals).toBeUndefined();
		});

		it("creates body with empty arrays", () => {
			const body = BlockBody.from({
				transactions: [],
				ommers: [],
			});

			expect(body.transactions).toHaveLength(0);
			expect(body.ommers).toHaveLength(0);
		});

		it("includes optional withdrawals", () => {
			const body = BlockBody.from({
				transactions: [],
				ommers: [],
				withdrawals: [
					{
						index: 0n,
						validatorIndex: 12345n,
						address: new Uint8Array(20),
						amount: 1000000000n,
					},
				],
			});

			expect(body.withdrawals).toHaveLength(1);
		});

		it("creates body with multiple transactions", () => {
			const body = BlockBody.from({
				transactions: [mockTransaction, mockTransaction, mockTransaction],
				ommers: [],
			});

			expect(body.transactions).toHaveLength(3);
		});
	});
});
