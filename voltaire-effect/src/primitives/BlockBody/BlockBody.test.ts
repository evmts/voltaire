/**
 * @fileoverview Tests for BlockBody Effect Schemas.
 * @module BlockBody/BlockBody.test
 */

import { BlockBody } from "@tevm/voltaire";
import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import { BlockBodySchema } from "./BlockBodySchema.js";

type BlockBodyType = BlockBody.BlockBodyType;

/**
 * Creates a valid withdrawal for testing.
 */
function createValidWithdrawal() {
	return {
		index: 0n,
		validatorIndex: 1n,
		address: new Uint8Array(20).fill(0xaa),
		amount: 1000000000n,
	};
}

/**
 * Creates a valid block body for testing.
 */
function createValidBody(): ReturnType<typeof BlockBody.from> {
	return BlockBody.from({
		transactions: [],
		ommers: [],
	});
}

describe("BlockBodySchema", () => {
	it("validates body with transactions and ommers", () => {
		const body = createValidBody();
		const result = S.decodeSync(BlockBodySchema)(body);
		expect(result.transactions).toEqual([]);
		expect(result.ommers).toEqual([]);
	});

	it("validates body with withdrawals (post-Shanghai)", () => {
		const body = BlockBody.from({
			transactions: [],
			ommers: [],
			withdrawals: [createValidWithdrawal()],
		});
		const result = S.decodeSync(BlockBodySchema)(body);
		expect(result.withdrawals?.length).toBe(1);
	});

	it("validates body with empty withdrawals array", () => {
		const body = BlockBody.from({
			transactions: [],
			ommers: [],
			withdrawals: [],
		});
		const result = S.decodeSync(BlockBodySchema)(body);
		expect(result.withdrawals).toEqual([]);
	});

	it("rejects body missing transactions", () => {
		const invalid = { ommers: [] } as unknown as BlockBodyType;
		expect(() => S.decodeSync(BlockBodySchema)(invalid)).toThrow();
	});

	it("rejects body missing ommers", () => {
		const invalid = { transactions: [] } as unknown as BlockBodyType;
		expect(() => S.decodeSync(BlockBodySchema)(invalid)).toThrow();
	});

	it("rejects body with non-array transactions", () => {
		const invalid = { transactions: "not-array", ommers: [] } as unknown as BlockBodyType;
		expect(() => S.decodeSync(BlockBodySchema)(invalid)).toThrow();
	});

	it("rejects body with non-array ommers", () => {
		const invalid = { transactions: [], ommers: {} } as unknown as BlockBodyType;
		expect(() => S.decodeSync(BlockBodySchema)(invalid)).toThrow();
	});

	it("rejects body with non-array withdrawals", () => {
		const invalid = { transactions: [], ommers: [], withdrawals: "not-array" } as unknown as BlockBodyType;
		expect(() => S.decodeSync(BlockBodySchema)(invalid)).toThrow();
	});

	it("rejects withdrawal with missing index", () => {
		const invalidWithdrawal = {
			validatorIndex: 1n,
			address: new Uint8Array(20).fill(0xaa),
			amount: 1000000000n,
		};
		const invalid = {
			transactions: [],
			ommers: [],
			withdrawals: [invalidWithdrawal],
		} as unknown as BlockBodyType;
		expect(() => S.decodeSync(BlockBodySchema)(invalid)).toThrow();
	});

	it("rejects withdrawal with non-bigint index", () => {
		const invalidWithdrawal = {
			index: 0, // number instead of bigint
			validatorIndex: 1n,
			address: new Uint8Array(20).fill(0xaa),
			amount: 1000000000n,
		};
		const invalid = {
			transactions: [],
			ommers: [],
			withdrawals: [invalidWithdrawal],
		} as unknown as BlockBodyType;
		expect(() => S.decodeSync(BlockBodySchema)(invalid)).toThrow();
	});

	it("rejects withdrawal with wrong address length", () => {
		const invalidWithdrawal = {
			index: 0n,
			validatorIndex: 1n,
			address: new Uint8Array(32).fill(0xaa), // 32 bytes instead of 20
			amount: 1000000000n,
		};
		const invalid = {
			transactions: [],
			ommers: [],
			withdrawals: [invalidWithdrawal],
		} as unknown as BlockBodyType;
		expect(() => S.decodeSync(BlockBodySchema)(invalid)).toThrow();
	});

	it("rejects withdrawal with string address", () => {
		const invalidWithdrawal = {
			index: 0n,
			validatorIndex: 1n,
			address: "0x" + "aa".repeat(20), // string instead of Uint8Array
			amount: 1000000000n,
		};
		const invalid = {
			transactions: [],
			ommers: [],
			withdrawals: [invalidWithdrawal],
		} as unknown as BlockBodyType;
		expect(() => S.decodeSync(BlockBodySchema)(invalid)).toThrow();
	});

	it("rejects withdrawal with non-bigint amount", () => {
		const invalidWithdrawal = {
			index: 0n,
			validatorIndex: 1n,
			address: new Uint8Array(20).fill(0xaa),
			amount: 1000000000, // number instead of bigint
		};
		const invalid = {
			transactions: [],
			ommers: [],
			withdrawals: [invalidWithdrawal],
		} as unknown as BlockBodyType;
		expect(() => S.decodeSync(BlockBodySchema)(invalid)).toThrow();
	});

	it("rejects withdrawal with missing validatorIndex", () => {
		const invalidWithdrawal = {
			index: 0n,
			address: new Uint8Array(20).fill(0xaa),
			amount: 1000000000n,
		};
		const invalid = {
			transactions: [],
			ommers: [],
			withdrawals: [invalidWithdrawal],
		} as unknown as BlockBodyType;
		expect(() => S.decodeSync(BlockBodySchema)(invalid)).toThrow();
	});

	it("rejects non-object input", () => {
		expect(() => S.decodeSync(BlockBodySchema)("not-an-object" as unknown as BlockBodyType)).toThrow();
		expect(() => S.decodeSync(BlockBodySchema)(null as unknown as BlockBodyType)).toThrow();
		expect(() => S.decodeSync(BlockBodySchema)(undefined as unknown as BlockBodyType)).toThrow();
	});

	it("validates multiple withdrawals", () => {
		const body = BlockBody.from({
			transactions: [],
			ommers: [],
			withdrawals: [
				{ index: 0n, validatorIndex: 1n, address: new Uint8Array(20).fill(0xaa), amount: 100n },
				{ index: 1n, validatorIndex: 2n, address: new Uint8Array(20).fill(0xbb), amount: 200n },
				{ index: 2n, validatorIndex: 3n, address: new Uint8Array(20).fill(0xcc), amount: 300n },
			],
		});
		const result = S.decodeSync(BlockBodySchema)(body);
		expect(result.withdrawals?.length).toBe(3);
	});
});
