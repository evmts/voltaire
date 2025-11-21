import { describe, it, expect } from "vitest";
import * as StateProof from "./index.js";
import * as StorageProof from "../StorageProof/index.js";
import { Address } from "../Address/index.js";
import { Wei } from "../Denomination/Wei.js";
import { Hash } from "../Hash/index.js";
import { Nonce } from "../Nonce/index.js";
import * as StateRoot from "../StateRoot/index.js";
import * as StorageKey from "../State/index.js";
import * as StorageValue from "../StorageValue/index.js";
import * as AccountState from "../AccountState/index.js";

describe("StateProof", () => {
	const createTestAddress = () =>
		Address("0x1234567890123456789012345678901234567890");

	const createTestAccountProof = () => [
		new Uint8Array([1, 2, 3, 4]),
		new Uint8Array([5, 6, 7, 8]),
	];

	const createTestStorageProof = () => {
		const key = StorageKey.create(createTestAddress(), 0n);
		const value = StorageValue.from(123n);
		return StorageProof.from({
			key,
			value,
			proof: [new Uint8Array([9, 10, 11, 12])],
		});
	};

	const createBasicStateProof = () =>
		StateProof.from({
			address: createTestAddress(),
			accountProof: createTestAccountProof(),
			balance: weiFrom(1000000000000000000n),
			codeHash: Hash(AccountState.EMPTY_CODE_HASH),
			nonce: nonceFrom(5n),
			storageHash: StateRoot.from(AccountState.EMPTY_TRIE_HASH),
			storageProof: [],
		});

	describe("from", () => {
		it("creates StateProof from object", () => {
			const proof = createBasicStateProof();

			expect(proof).toBeDefined();
			expect(proof.address).toBeDefined();
			expect(proof.accountProof).toHaveLength(2);
			expect(proof.balance).toBeDefined();
			expect(proof.codeHash).toBeDefined();
			expect(proof.nonce).toBeDefined();
			expect(proof.storageHash).toBeDefined();
			expect(proof.storageProof).toHaveLength(0);
		});

		it("accepts storage proofs", () => {
			const storageProof = createTestStorageProof();

			const proof = StateProof.from({
				address: createTestAddress(),
				accountProof: createTestAccountProof(),
				balance: weiFrom(0n),
				codeHash: Hash(
					"0xabcdef1234567890123456789012345678901234567890123456789012345678",
				),
				nonce: nonceFrom(1n),
				storageHash: StateRoot.from(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				),
				storageProof: [storageProof],
			});

			expect(proof.storageProof).toHaveLength(1);
			expect(proof.storageProof[0]).toBe(storageProof);
		});

		it("returns immutable object", () => {
			const proof = createBasicStateProof();

			expect(Object.isFrozen(proof)).toBe(true);
			expect(Object.isFrozen(proof.accountProof)).toBe(true);
			expect(Object.isFrozen(proof.storageProof)).toBe(true);
		});

		it("throws on invalid address", () => {
			expect(() =>
				StateProof.from({
					// @ts-expect-error - testing invalid type
					address: "not an address",
					accountProof: [],
					balance: weiFrom(0n),
					codeHash: Hash(AccountState.EMPTY_CODE_HASH),
					nonce: nonceFrom(0n),
					storageHash: StateRoot.from(AccountState.EMPTY_TRIE_HASH),
					storageProof: [],
				}),
			).toThrow("address must be an Address");
		});

		it("throws on invalid accountProof type", () => {
			expect(() =>
				StateProof.from({
					address: createTestAddress(),
					// @ts-expect-error - testing invalid type
					accountProof: "not an array",
					balance: weiFrom(0n),
					codeHash: Hash(AccountState.EMPTY_CODE_HASH),
					nonce: nonceFrom(0n),
					storageHash: StateRoot.from(AccountState.EMPTY_TRIE_HASH),
					storageProof: [],
				}),
			).toThrow("accountProof must be an array");
		});

		it("throws on invalid accountProof element", () => {
			expect(() =>
				StateProof.from({
					address: createTestAddress(),
					// @ts-expect-error - testing invalid element
					accountProof: [new Uint8Array([1, 2]), "invalid"],
					balance: weiFrom(0n),
					codeHash: Hash(AccountState.EMPTY_CODE_HASH),
					nonce: nonceFrom(0n),
					storageHash: StateRoot.from(AccountState.EMPTY_TRIE_HASH),
					storageProof: [],
				}),
			).toThrow("accountProof[1] must be a Uint8Array");
		});

		it("throws on invalid balance", () => {
			expect(() =>
				StateProof.from({
					address: createTestAddress(),
					accountProof: [],
					// @ts-expect-error - testing invalid type
					balance: "not wei",
					codeHash: Hash(AccountState.EMPTY_CODE_HASH),
					nonce: nonceFrom(0n),
					storageHash: StateRoot.from(AccountState.EMPTY_TRIE_HASH),
					storageProof: [],
				}),
			).toThrow("balance must be a Wei");
		});

		it("throws on invalid codeHash", () => {
			expect(() =>
				StateProof.from({
					address: createTestAddress(),
					accountProof: [],
					balance: weiFrom(0n),
					// @ts-expect-error - testing invalid type
					codeHash: "not a hash",
					nonce: nonceFrom(0n),
					storageHash: StateRoot.from(AccountState.EMPTY_TRIE_HASH),
					storageProof: [],
				}),
			).toThrow("codeHash must be a Hash");
		});

		it("throws on invalid storageProof", () => {
			expect(() =>
				StateProof.from({
					address: createTestAddress(),
					accountProof: [],
					balance: weiFrom(0n),
					codeHash: Hash(AccountState.EMPTY_CODE_HASH),
					nonce: nonceFrom(0n),
					storageHash: StateRoot.from(AccountState.EMPTY_TRIE_HASH),
					// @ts-expect-error - testing invalid element
					storageProof: [{ invalid: "proof" }],
				}),
			).toThrow("storageProof[0] must have key, value, and proof");
		});
	});

	describe("equals", () => {
		it("returns true for equal StateProofs", () => {
			const proof1 = createBasicStateProof();
			const proof2 = createBasicStateProof();

			expect(StateProof.equals(proof1, proof2)).toBe(true);
		});

		it("returns false for different addresses", () => {
			const proof1 = createBasicStateProof();
			const proof2 = StateProof.from({
				address: Address("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"),
				accountProof: createTestAccountProof(),
				balance: weiFrom(1000000000000000000n),
				codeHash: Hash(AccountState.EMPTY_CODE_HASH),
				nonce: nonceFrom(5n),
				storageHash: StateRoot.from(AccountState.EMPTY_TRIE_HASH),
				storageProof: [],
			});

			expect(StateProof.equals(proof1, proof2)).toBe(false);
		});

		it("returns false for different balances", () => {
			const proof1 = createBasicStateProof();
			const proof2 = StateProof.from({
				address: createTestAddress(),
				accountProof: createTestAccountProof(),
				balance: weiFrom(2000000000000000000n), // Different balance
				codeHash: Hash(AccountState.EMPTY_CODE_HASH),
				nonce: nonceFrom(5n),
				storageHash: StateRoot.from(AccountState.EMPTY_TRIE_HASH),
				storageProof: [],
			});

			expect(StateProof.equals(proof1, proof2)).toBe(false);
		});

		it("returns false for different storage proofs", () => {
			const storageProof1 = createTestStorageProof();
			const storageProof2 = StorageProof.from({
				key: StorageKey.create(createTestAddress(), 1n), // Different slot
				value: StorageValue.from(456n),
				proof: [new Uint8Array([13, 14, 15, 16])],
			});

			const proof1 = StateProof.from({
				address: createTestAddress(),
				accountProof: createTestAccountProof(),
				balance: weiFrom(0n),
				codeHash: Hash(AccountState.EMPTY_CODE_HASH),
				nonce: nonceFrom(0n),
				storageHash: StateRoot.from(AccountState.EMPTY_TRIE_HASH),
				storageProof: [storageProof1],
			});

			const proof2 = StateProof.from({
				address: createTestAddress(),
				accountProof: createTestAccountProof(),
				balance: weiFrom(0n),
				codeHash: Hash(AccountState.EMPTY_CODE_HASH),
				nonce: nonceFrom(0n),
				storageHash: StateRoot.from(AccountState.EMPTY_TRIE_HASH),
				storageProof: [storageProof2],
			});

			expect(StateProof.equals(proof1, proof2)).toBe(false);
		});
	});

	describe("integration", () => {
		it("represents EOA with no storage", () => {
			const proof = StateProof.from({
				address: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"),
				accountProof: [
					new Uint8Array([0xf8, 0x51]), // RLP-encoded node
				],
				balance: weiFrom(1000000000000000000n), // 1 ETH
				codeHash: Hash(AccountState.EMPTY_CODE_HASH),
				nonce: nonceFrom(5n),
				storageHash: StateRoot.from(AccountState.EMPTY_TRIE_HASH),
				storageProof: [],
			});

			expect(proof.storageProof).toHaveLength(0);
			expect(Hash.toHex(proof.codeHash)).toBe(AccountState.EMPTY_CODE_HASH);
		});

		it("represents contract with storage proofs", () => {
			const storageProof = createTestStorageProof();

			const proof = StateProof.from({
				address: Address("0x1234567890123456789012345678901234567890"),
				accountProof: [new Uint8Array([0xf8, 0x51])],
				balance: weiFrom(0n),
				codeHash: Hash(
					"0xabcdef1234567890123456789012345678901234567890123456789012345678",
				),
				nonce: nonceFrom(1n),
				storageHash: StateRoot.from(
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				),
				storageProof: [storageProof],
			});

			expect(proof.storageProof).toHaveLength(1);
			expect(Hash.toHex(proof.codeHash)).not.toBe(AccountState.EMPTY_CODE_HASH);
		});
	});
});
