import { describe, expect, it } from "vitest";
import { toU256 as weiToU256 } from "../Denomination/Wei.js";
import { Hash } from "../Hash/index.js";
import { toBigInt as nonceToBigInt } from "../Nonce/index.js";
import * as StateRoot from "../StateRoot/index.js";
import { EMPTY_CODE_HASH, EMPTY_TRIE_HASH } from "./AccountStateType.js";
import { createEmpty } from "./createEmpty.js";

describe("AccountState.createEmpty", () => {
	describe("constructor tests", () => {
		it("creates empty AccountState", () => {
			const state = createEmpty();

			expect(state).toBeDefined();
			expect(state.nonce).toBeDefined();
			expect(state.balance).toBeDefined();
			expect(state.storageRoot).toBeDefined();
			expect(state.codeHash).toBeDefined();
		});

		it("creates new instance each time", () => {
			const state1 = createEmpty();
			const state2 = createEmpty();

			expect(state1).not.toBe(state2);
		});

		it("creates identical states", async () => {
			const state1 = createEmpty();
			const state2 = createEmpty();

			const { equals } = await import("./equals.js");
			expect(equals(state1, state2)).toBe(true);
		});
	});

	describe("nonce tests", () => {
		it("has zero nonce", () => {
			const state = createEmpty();
			expect(nonceToBigInt(state.nonce)).toBe(0n);
		});

		it("nonce is defined", () => {
			const state = createEmpty();
			expect(state.nonce).toBeDefined();
			expect(state.nonce).not.toBeNull();
		});
	});

	describe("balance tests", () => {
		it("has zero balance", () => {
			const state = createEmpty();
			expect(weiToU256(state.balance)).toBe(0n);
		});

		it("balance is defined", () => {
			const state = createEmpty();
			expect(state.balance).toBeDefined();
			expect(state.balance).not.toBeNull();
		});
	});

	describe("storageRoot tests", () => {
		it("has empty trie hash", () => {
			const state = createEmpty();
			expect(StateRoot.toHex(state.storageRoot)).toBe(EMPTY_TRIE_HASH);
		});

		it("storageRoot matches constant", () => {
			const state = createEmpty();
			const expectedRoot = StateRoot.from(EMPTY_TRIE_HASH);
			expect(StateRoot.equals(state.storageRoot, expectedRoot)).toBe(true);
		});

		it("storageRoot is defined", () => {
			const state = createEmpty();
			expect(state.storageRoot).toBeDefined();
			expect(state.storageRoot).not.toBeNull();
		});
	});

	describe("codeHash tests", () => {
		it("has empty code hash", () => {
			const state = createEmpty();
			expect(Hash.toHex(state.codeHash)).toBe(EMPTY_CODE_HASH);
		});

		it("codeHash matches constant", () => {
			const state = createEmpty();
			const expectedHash = Hash(EMPTY_CODE_HASH);
			expect(Hash.equals(state.codeHash, expectedHash)).toBe(true);
		});

		it("codeHash is defined", () => {
			const state = createEmpty();
			expect(state.codeHash).toBeDefined();
			expect(state.codeHash).not.toBeNull();
		});
	});

	describe("state classification tests", () => {
		it("is an EOA", async () => {
			const state = createEmpty();
			const { isEOA } = await import("./isEOA.js");
			expect(isEOA(state)).toBe(true);
		});

		it("is not a contract", async () => {
			const state = createEmpty();
			const { isContract } = await import("./isContract.js");
			expect(isContract(state)).toBe(false);
		});
	});

	describe("immutability tests", () => {
		it("returns frozen object", () => {
			const state = createEmpty();
			expect(Object.isFrozen(state)).toBe(true);
		});

		it("cannot modify nonce", async () => {
			const state = createEmpty();
			const { from: nonceFrom } = await import("../Nonce/from.js");

			expect(() => {
				state.nonce = nonceFrom(5n);
			}).toThrow();
		});

		it("cannot modify balance", async () => {
			const state = createEmpty();
			const { from: weiFrom } = await import("../Denomination/Wei.js");

			expect(() => {
				state.balance = weiFrom(100n);
			}).toThrow();
		});

		it("cannot modify storageRoot", () => {
			const state = createEmpty();

			expect(() => {
				state.storageRoot = StateRoot.from(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				);
			}).toThrow();
		});

		it("cannot modify codeHash", () => {
			const state = createEmpty();

			expect(() => {
				state.codeHash = Hash(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				);
			}).toThrow();
		});
	});

	describe("constant validation", () => {
		it("EMPTY_CODE_HASH is keccak256 of empty string", () => {
			expect(EMPTY_CODE_HASH).toBe(
				"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
			);
		});

		it("EMPTY_TRIE_HASH is keccak256 of RLP empty array", () => {
			expect(EMPTY_TRIE_HASH).toBe(
				"0x56e81f171bcc55a6ff8345e692c0f86e5b47e5b60e2d8c5ab6c7c9fa0e32d3c5",
			);
		});
	});

	describe("integration tests", () => {
		it("can be used with from function", async () => {
			const emptyState = createEmpty();
			const { from } = await import("./from.js");

			const reconstructed = from({
				nonce: emptyState.nonce,
				balance: emptyState.balance,
				storageRoot: emptyState.storageRoot,
				codeHash: emptyState.codeHash,
			});

			const { equals } = await import("./equals.js");
			expect(equals(emptyState, reconstructed)).toBe(true);
		});

		it("can be compared with equals", async () => {
			const state1 = createEmpty();
			const state2 = createEmpty();
			const { equals } = await import("./equals.js");

			expect(equals(state1, state2)).toBe(true);
		});
	});
});
