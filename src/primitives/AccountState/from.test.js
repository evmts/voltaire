import { describe, expect, it } from "vitest";
import { from as weiFrom } from "../Denomination/Wei.js";
import { Hash } from "../Hash/index.js";
import { from as nonceFrom } from "../Nonce/from.js";
import * as StateRoot from "../StateRoot/index.js";
import { EMPTY_CODE_HASH, EMPTY_TRIE_HASH } from "./AccountStateType.js";
import { from } from "./from.js";

describe("AccountState.from", () => {
	describe("constructor tests", () => {
		it("creates AccountState from valid object", () => {
			const state = from({
				nonce: nonceFrom(5n),
				balance: weiFrom(1000000000000000000n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(state).toBeDefined();
			expect(state.nonce).toBeDefined();
			expect(state.balance).toBeDefined();
			expect(state.storageRoot).toBeDefined();
			expect(state.codeHash).toBeDefined();
		});

		it("creates AccountState with zero values", () => {
			const state = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(state.nonce).toBeDefined();
			expect(state.balance).toBeDefined();
		});

		it("creates AccountState with maximum nonce", () => {
			const state = from({
				nonce: nonceFrom(2n ** 64n - 1n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(state.nonce).toBeDefined();
		});

		it("creates AccountState with maximum balance", () => {
			const maxWei = 2n ** 256n - 1n;
			const state = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(maxWei),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(state.balance).toBeDefined();
		});

		it("creates contract account with custom storage root", () => {
			const customRoot =
				"0x1234567890123456789012345678901234567890123456789012345678901234";
			const state = from({
				nonce: nonceFrom(1n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(customRoot),
				codeHash: Hash(
					"0xabcdef1234567890123456789012345678901234567890123456789012345678",
				),
			});

			expect(state.storageRoot).toBeDefined();
			expect(state.codeHash).toBeDefined();
		});
	});

	describe("immutability tests", () => {
		it("returns frozen object", () => {
			const state = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(Object.isFrozen(state)).toBe(true);
		});

		it("cannot modify nonce", () => {
			const state = from({
				nonce: nonceFrom(5n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(() => {
				state.nonce = nonceFrom(10n);
			}).toThrow();
		});

		it("cannot modify balance", () => {
			const state = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(100n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(() => {
				state.balance = weiFrom(200n);
			}).toThrow();
		});

		it("cannot modify storageRoot", () => {
			const state = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(() => {
				state.storageRoot = StateRoot.from(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				);
			}).toThrow();
		});

		it("cannot modify codeHash", () => {
			const state = from({
				nonce: nonceFrom(0n),
				balance: weiFrom(0n),
				storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				codeHash: Hash(EMPTY_CODE_HASH),
			});

			expect(() => {
				state.codeHash = Hash(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				);
			}).toThrow();
		});
	});

	describe("error cases", () => {
		it("throws on missing nonce", () => {
			expect(() =>
				from({
					balance: weiFrom(0n),
					storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
					codeHash: Hash(EMPTY_CODE_HASH),
				}),
			).toThrow("nonce is required");
		});

		it("throws on missing balance", () => {
			expect(() =>
				from({
					nonce: nonceFrom(0n),
					storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
					codeHash: Hash(EMPTY_CODE_HASH),
				}),
			).toThrow("balance is required");
		});

		it("throws on missing storageRoot", () => {
			expect(() =>
				from({
					nonce: nonceFrom(0n),
					balance: weiFrom(0n),
					codeHash: Hash(EMPTY_CODE_HASH),
				}),
			).toThrow("storageRoot is required");
		});

		it("throws on missing codeHash", () => {
			expect(() =>
				from({
					nonce: nonceFrom(0n),
					balance: weiFrom(0n),
					storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
				}),
			).toThrow("codeHash is required");
		});

		it("throws on null input", () => {
			expect(() => from(null)).toThrow(
				"AccountState must be an object with nonce, balance, storageRoot, and codeHash",
			);
		});

		it("throws on undefined input", () => {
			expect(() => from(undefined)).toThrow(
				"AccountState must be an object with nonce, balance, storageRoot, and codeHash",
			);
		});

		it("throws on string input", () => {
			expect(() => from("not an object")).toThrow(
				"AccountState must be an object with nonce, balance, storageRoot, and codeHash",
			);
		});

		it("throws on number input", () => {
			expect(() => from(42)).toThrow(
				"AccountState must be an object with nonce, balance, storageRoot, and codeHash",
			);
		});

		it("throws on array input", () => {
			expect(() => from([])).toThrow("nonce is required");
		});
	});
});
