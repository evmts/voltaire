import { describe, expect, it } from "vitest";
import { from as weiFrom } from "../Denomination/Wei.js";
import { Hash } from "../Hash/index.js";
import { from as nonceFrom } from "../Nonce/from.js";
import * as StateRoot from "../StateRoot/index.js";
import { EMPTY_CODE_HASH, EMPTY_TRIE_HASH } from "./AccountStateType.js";
import { equals } from "./equals.js";
import { from } from "./from.js";

describe("AccountState.equals", () => {
	describe("equality tests", () => {
		it("returns true for identical empty states", () => {
			const state1 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});
			const state2 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(equals(state1, state2)).toBe(true);
		});

		it("returns true for identical non-empty states", () => {
			const state1 = from({
				nonce: nonceFrom(5n),
				balance: weiFrom(1000000000000000000n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});
			const state2 = from({
				nonce: nonceFrom(5n),
				balance: weiFrom(1000000000000000000n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(equals(state1, state2)).toBe(true);
		});

		it("returns true for identical contract states", () => {
			const customRoot =
				"0x1234567890123456789012345678901234567890123456789012345678901234";
			const customCode =
				"0xabcdef1234567890123456789012345678901234567890123456789012345678";
			const state1 = from({
				nonce: nonceFrom(1n),
				balance: weiFrom(500000000000000000n),
				storageRoot: StateRoot.from(customRoot),
				codeHash: Hash(customCode),
			});
			const state2 = from({
				nonce: nonceFrom(1n),
				balance: weiFrom(500000000000000000n),
				storageRoot: StateRoot.from(customRoot),
				codeHash: Hash(customCode),
			});

			expect(equals(state1, state2)).toBe(true);
		});

		it("returns true when comparing same reference", () => {
			const state = from({
				nonce: nonceFrom(5n),
				balance: weiFrom(100n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(equals(state, state)).toBe(true);
		});
	});

	describe("inequality tests - nonce", () => {
		it("returns false for different nonces", () => {
			const state1 = from({
				nonce: nonceFrom(5n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});
			const state2 = from({
				nonce: nonceFrom(6n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(equals(state1, state2)).toBe(false);
		});

		it("returns false when nonce differs by 1", () => {
			const state1 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});
			const state2 = from({
				nonce: nonceFrom(1n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(equals(state1, state2)).toBe(false);
		});

		it("returns false for large nonce difference", () => {
			const state1 = from({
				nonce: nonceFrom(1n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});
			const state2 = from({
				nonce: nonceFrom(1000000n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(equals(state1, state2)).toBe(false);
		});
	});

	describe("inequality tests - balance", () => {
		it("returns false for different balances", () => {
			const state1 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(100n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});
			const state2 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(200n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(equals(state1, state2)).toBe(false);
		});

		it("returns false when balance differs by 1 wei", () => {
			const state1 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(1000000000000000000n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});
			const state2 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(1000000000000000001n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(equals(state1, state2)).toBe(false);
		});

		it("returns false for large balance difference", () => {
			const state1 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});
			const state2 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(2n ** 256n - 1n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(equals(state1, state2)).toBe(false);
		});
	});

	describe("inequality tests - storageRoot", () => {
		it("returns false for different storage roots", () => {
			const state1 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});
			const state2 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(equals(state1, state2)).toBe(false);
		});

		it("returns false when storage roots differ by one byte", () => {
			const state1 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				),
				codeHash: Hash(EMPTY_CODE_HASH),
			});
			const state2 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(
					"0x1234567890123456789012345678901234567890123456789012345678901235",
				),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(equals(state1, state2)).toBe(false);
		});
	});

	describe("inequality tests - codeHash", () => {
		it("returns false for different code hashes", () => {
			const state1 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});
			const state2 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				),
			});

			expect(equals(state1, state2)).toBe(false);
		});

		it("returns false when code hashes differ by one byte", () => {
			const state1 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				),
			});
			const state2 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(
					"0x1234567890123456789012345678901234567890123456789012345678901235",
				),
			});

			expect(equals(state1, state2)).toBe(false);
		});
	});

	describe("inequality tests - multiple fields", () => {
		it("returns false when all fields differ", () => {
			const state1 = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});
			const state2 = from({
				nonce: nonceFrom(5n),
				balance: weiFrom(1000n),
				storageRoot: StateRoot.from(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				),
				codeHash: Hash(
					"0xabcdef1234567890123456789012345678901234567890123456789012345678",
				),
			});

			expect(equals(state1, state2)).toBe(false);
		});

		it("returns false when only nonce matches", () => {
			const state1 = from({
				nonce: nonceFrom(5n),
				balance: weiFrom(100n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});
			const state2 = from({
				nonce: nonceFrom(5n),
				balance: weiFrom(200n),
				storageRoot: StateRoot.from(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				),
				codeHash: Hash(
					"0xabcdef1234567890123456789012345678901234567890123456789012345678",
				),
			});

			expect(equals(state1, state2)).toBe(false);
		});
	});
});
