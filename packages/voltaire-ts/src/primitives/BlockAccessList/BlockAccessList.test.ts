import { describe, expect, it } from "vitest";
import * as Hash from "../Hash/index.js";
import * as Hex from "../Hex/index.js";
import * as Primitives from "../index.js";
import * as Rlp from "../Rlp/index.js";
import * as BlockAccessList from "./index.js";

const A1 = "0x0000000000000000000000000000000000000001";
const AA = "0x00000000000000000000000000000000000000aa";
const BB = "0x00000000000000000000000000000000000000bb";

// Hand-assembled from the EIP-7928 RLP rules. The Zig implementation asserts
// the same bytes and hash, so the two encoders cross-check each other.
const FULL_RLP =
	"0xf877" +
	// AccountChanges 0xaa
	"f85a94" +
	"00000000000000000000000000000000000000aa" +
	// storage_changes: [[1, [[1, 42], [2, 0]]], [0x0100, [[3, 2^255]]]]
	"f1" +
	"c801c6c2012ac20280" +
	"e7820100e3e203a0" +
	"8000000000000000000000000000000000000000000000000000000000000000" +
	// storage_reads: [0, 2]
	"c28002" +
	// balance_changes: [[1, 1000]]
	"c5c4018203e8" +
	// nonce_changes: [[1, 1]]
	"c3c20101" +
	// code_changes: [[2, 0x6000]]
	"c5c402826000" +
	// AccountChanges 0xbb with every list empty
	"da94" +
	"00000000000000000000000000000000000000bb" +
	"c0c0c0c0c0";
const FULL_HASH =
	"0x7a6e55bde06c036cc607ef0262a5c3f46eba0d9a8a4a991334d72295a92696a2";

const full = () =>
	BlockAccessList.from([
		{ address: BB },
		{
			address: AA,
			storageChanges: [
				{
					slot: 256n,
					changes: [{ blockAccessIndex: 3, newValue: 1n << 255n }],
				},
				{
					slot: 1n,
					changes: [
						{ blockAccessIndex: 2, newValue: 0n },
						{ blockAccessIndex: 1, newValue: 42n },
					],
				},
			],
			storageReads: [2n, 0n],
			balanceChanges: [{ blockAccessIndex: 1, postBalance: 1000n }],
			nonceChanges: [{ blockAccessIndex: 1, newNonce: 1n }],
			codeChanges: [{ blockAccessIndex: 2, newCode: "0x6000" }],
		},
	]);

describe("BlockAccessList (EIP-7928)", () => {
	it("is exported from the public primitive barrel", () => {
		expect(Primitives.BlockAccessList.from).toBe(BlockAccessList.from);
	});

	describe("from", () => {
		it("sorts accounts, slots, reads, and changes into canonical order", () => {
			const bal = full();
			expect(bal.map((account) => Hex.fromBytes(account.address))).toEqual([
				AA,
				BB,
			]);
			const account = bal[0] as BlockAccessList.AccountChanges;
			expect(account.storageChanges.map((s) => s.slot)).toEqual([1n, 256n]);
			expect(
				account.storageChanges[0]?.changes.map((c) => c.blockAccessIndex),
			).toEqual([1, 2]);
			expect(account.storageReads).toEqual([0n, 2n]);
			expect(account.codeChanges[0]?.newCode).toEqual(
				new Uint8Array([0x60, 0x00]),
			);
		});

		it("defaults omitted lists to empty", () => {
			const [account] = BlockAccessList.from([{ address: A1 }]);
			expect(account).toMatchObject({
				storageChanges: [],
				storageReads: [],
				balanceChanges: [],
				nonceChanges: [],
				codeChanges: [],
			});
		});

		it("accepts number, bigint, and hex quantities", () => {
			const [account] = BlockAccessList.from([
				{
					address: A1,
					storageReads: [1, "0x02", 3n],
					balanceChanges: [{ blockAccessIndex: 0, postBalance: "0xff" }],
				},
			]);
			expect(account?.storageReads).toEqual([1n, 2n, 3n]);
			expect(account?.balanceChanges[0]?.postBalance).toBe(255n);
		});

		it.each([
			["duplicate address", [{ address: A1 }, { address: A1 }]],
			[
				"duplicate slot in storageChanges",
				[
					{
						address: A1,
						storageChanges: [
							{ slot: 1n, changes: [{ blockAccessIndex: 1, newValue: 1n }] },
							{ slot: 1n, changes: [{ blockAccessIndex: 2, newValue: 2n }] },
						],
					},
				],
			],
			["duplicate storage read", [{ address: A1, storageReads: [5n, 5n] }]],
			[
				"slot both written and read",
				[
					{
						address: A1,
						storageChanges: [
							{ slot: 1n, changes: [{ blockAccessIndex: 1, newValue: 1n }] },
						],
						storageReads: [1n],
					},
				],
			],
			[
				"slot with no changes",
				[{ address: A1, storageChanges: [{ slot: 1n, changes: [] }] }],
			],
			[
				"duplicate access index in one slot",
				[
					{
						address: A1,
						storageChanges: [
							{
								slot: 1n,
								changes: [
									{ blockAccessIndex: 1, newValue: 1n },
									{ blockAccessIndex: 1, newValue: 2n },
								],
							},
						],
					},
				],
			],
			[
				"duplicate balance change index",
				[
					{
						address: A1,
						balanceChanges: [
							{ blockAccessIndex: 1, postBalance: 1n },
							{ blockAccessIndex: 1, postBalance: 2n },
						],
					},
				],
			],
			[
				"access index above uint32",
				[
					{
						address: A1,
						nonceChanges: [{ blockAccessIndex: 2 ** 32, newNonce: 1n }],
					},
				],
			],
			[
				"negative access index",
				[
					{
						address: A1,
						nonceChanges: [{ blockAccessIndex: -1, newNonce: 1n }],
					},
				],
			],
			[
				"fractional access index",
				[
					{
						address: A1,
						codeChanges: [{ blockAccessIndex: 1.5, newCode: "0x00" }],
					},
				],
			],
			[
				"nonce above uint64",
				[
					{
						address: A1,
						nonceChanges: [{ blockAccessIndex: 1, newNonce: 1n << 64n }],
					},
				],
			],
			[
				"balance above uint256",
				[
					{
						address: A1,
						balanceChanges: [{ blockAccessIndex: 1, postBalance: 1n << 256n }],
					},
				],
			],
			["negative storage key", [{ address: A1, storageReads: [-1n] }]],
			["non-integer quantity", [{ address: A1, storageReads: [1.5] }]],
			["non-numeric quantity", [{ address: A1, storageReads: ["slot"] }]],
			["empty quantity", [{ address: A1, storageReads: [""] }]],
			["whitespace-only quantity", [{ address: A1, storageReads: [" \t"] }]],
		] as const)("rejects %s", (_name, input) => {
			expect(() =>
				BlockAccessList.from(input as BlockAccessList.BlockAccessListLike),
			).toThrow(BlockAccessList.InvalidBlockAccessListError);
		});

		it("rejects a non-array", () => {
			expect(() =>
				BlockAccessList.from(
					{} as unknown as BlockAccessList.BlockAccessListLike,
				),
			).toThrow(BlockAccessList.InvalidBlockAccessListError);
		});

		it("rejects a malformed address", () => {
			expect(() => BlockAccessList.from([{ address: "0x1234" }])).toThrow();
		});
	});

	describe("toRlp", () => {
		it("encodes the empty list as 0xc0", () => {
			expect(BlockAccessList.toRlp([])).toEqual(new Uint8Array([0xc0]));
		});

		it("encodes one account with empty lists", () => {
			expect(Hex.fromBytes(BlockAccessList.toRlp([{ address: A1 }]))).toBe(
				`0xdbda94${A1.slice(2)}c0c0c0c0c0`,
			);
		});

		it("encodes integers minimally: zero as 0x80, one as 0x01", () => {
			const rlp = Hex.fromBytes(
				BlockAccessList.toRlp([{ address: A1, storageReads: [0n, 1n] }]),
			);
			expect(rlp).toBe(`0xdddc94${A1.slice(2)}c0c28001c0c0c0`);
		});

		it("matches the hand-assembled vector for every change kind", () => {
			expect(Hex.fromBytes(BlockAccessList.toRlp(full()))).toBe(FULL_RLP);
		});

		it("encodes unsorted input through the public wrapper canonically", () => {
			expect(BlockAccessList.toRlp([{ address: BB }, { address: AA }])).toEqual(
				BlockAccessList.toRlp([{ address: AA }, { address: BB }]),
			);
		});
	});

	describe("fromRlp", () => {
		it("rejects a non-minimal RLP byte prefix inside a storage read list", () => {
			const address = A1.slice(2);
			const canonical = Hex.toBytes(`0xdcdb94${address}c0c101c0c0c0`);
			const padded = Hex.toBytes(`0xdddc94${address}c0c28101c0c0c0`);
			expect(BlockAccessList.fromRlp(canonical)[0]?.storageReads).toEqual([1n]);
			expect(() => BlockAccessList.fromRlp(padded)).toThrow(
				/Single byte < 0x80|canonical RLP/,
			);
		});

		it("decodes 0xc0 to the empty list", () => {
			expect(BlockAccessList.fromRlp(new Uint8Array([0xc0]))).toEqual([]);
		});

		it("round-trips every change kind", () => {
			const bal = full();
			const decoded = BlockAccessList.fromRlp(Hex.toBytes(FULL_RLP));
			expect(decoded).toEqual(bal);
			expect(Hex.fromBytes(BlockAccessList._toRlp(decoded))).toBe(FULL_RLP);
		});

		it("round-trips max-width integers", () => {
			const bal = BlockAccessList.from([
				{
					address: `0x${"ff".repeat(20)}`,
					storageChanges: [
						{
							slot: (1n << 256n) - 1n,
							changes: [
								{ blockAccessIndex: 0xffffffff, newValue: (1n << 256n) - 1n },
							],
						},
					],
					balanceChanges: [
						{ blockAccessIndex: 0, postBalance: (1n << 256n) - 1n },
					],
					nonceChanges: [
						{ blockAccessIndex: 0xffffffff, newNonce: (1n << 64n) - 1n },
					],
					codeChanges: [
						{ blockAccessIndex: 7, newCode: new Uint8Array(300).fill(0xfe) },
					],
				},
			]);
			expect(BlockAccessList.fromRlp(BlockAccessList._toRlp(bal))).toEqual(bal);
		});

		// Raw RLP items: a hex string is a byte string, an array is a list.
		type Item = string | readonly Item[];
		const raw = (item: Item): Uint8Array | unknown[] =>
			typeof item === "string" ? Hex.toBytes(`0x${item}`) : item.map(raw);
		const encode = (item: Item) => Rlp.encode(raw(item) as Uint8Array);
		const address = A1.slice(2);
		// One account: [address, changes, reads, balances, nonces, codes].
		const account = (
			changes: Item = [],
			reads: Item = [],
			balances: Item = [],
			nonces: Item = [],
			codes: Item = [],
		) => encode([[address, changes, reads, balances, nonces, codes]]);

		it("accepts the helper's canonical account", () => {
			const bal = BlockAccessList.fromRlp(
				account([["01", [["01", "2a"]]]], ["02"], [["01", "05"]]),
			);
			expect(bal[0]?.storageChanges[0]?.changes[0]?.newValue).toBe(42n);
			expect(bal[0]?.storageReads).toEqual([2n]);
			expect(bal[0]?.balanceChanges[0]?.postBalance).toBe(5n);
		});

		it.each([
			["a string instead of a list", encode("")],
			["an account that is not a list", encode([""])],
			["an account with 5 fields", encode([[address, [], [], [], []]])],
			["an account with 7 fields", encode([[address, [], [], [], [], [], []]])],
			["a 19-byte address", encode([["00".repeat(19), [], [], [], [], []]])],
			["a list where the address belongs", encode([[[], [], [], [], [], []]])],
			["a storage read with a leading zero", account([], ["0001"])],
			["a 33-byte storage read", account([], ["01".repeat(33)])],
			["unsorted storage reads", account([], ["02", "01"])],
			["duplicate storage reads", account([], ["01", "01"])],
			["a slot with no changes", account([["01", []]])],
			[
				"unsorted slots",
				account([
					["02", [["01", "01"]]],
					["01", [["01", "01"]]],
				]),
			],
			[
				"a slot that is both written and read",
				account([["01", [["01", "01"]]]], ["01"]),
			],
			[
				"unsorted changes inside a slot",
				account([
					[
						"01",
						[
							["02", "01"],
							["01", "01"],
						],
					],
				]),
			],
			["a 5-byte access index", account([], [], [["0100000000", "01"]])],
			["a 9-byte nonce", account([], [], [], [["01", "010000000000000000"]])],
			[
				"unsorted balance changes",
				account(
					[],
					[],
					[
						["02", "01"],
						["01", "01"],
					],
				),
			],
			[
				"duplicate nonce change indices",
				account(
					[],
					[],
					[],
					[
						["01", "01"],
						["01", "02"],
					],
				),
			],
			["a change pair with 3 items", account([], [], [["01", "01", "01"]])],
			["a list where bytecode belongs", account([], [], [], [], [["01", []]])],
			["a string where a change list belongs", account("01")],
		] as const)("rejects %s", (_name, bytes) => {
			expect(() => BlockAccessList.fromRlp(bytes)).toThrow(
				BlockAccessList.InvalidBlockAccessListError,
			);
		});

		it("rejects unsorted accounts", () => {
			const one = (address: string) => `da94${address.slice(2)}c0c0c0c0c0`;
			expect(() =>
				BlockAccessList.fromRlp(Hex.toBytes(`0xf6${one(BB)}${one(AA)}`)),
			).toThrow(BlockAccessList.InvalidBlockAccessListError);
		});

		it("rejects trailing bytes and empty input", () => {
			expect(() => BlockAccessList.fromRlp(Hex.toBytes("0xc000"))).toThrow();
			expect(() => BlockAccessList.fromRlp(new Uint8Array(0))).toThrow();
		});
	});

	describe("calculateHash", () => {
		it("hashes the empty list to keccak256(0xc0)", () => {
			expect(Hash.toHex(BlockAccessList.calculateHash([]))).toBe(
				BlockAccessList.EMPTY_BLOCK_ACCESS_LIST_HASH,
			);
		});

		it("matches the vector shared with the Zig implementation", () => {
			expect(Hash.toHex(BlockAccessList.calculateHash(full()))).toBe(FULL_HASH);
		});

		it("is independent of input order", () => {
			expect(
				BlockAccessList.calculateHash([{ address: BB }, { address: AA }]),
			).toEqual(
				BlockAccessList.calculateHash([{ address: AA }, { address: BB }]),
			);
		});

		it("changes when any committed value changes", () => {
			const other = BlockAccessList.from([{ address: AA, storageReads: [1n] }]);
			expect(BlockAccessList.calculateHash(other)).not.toEqual(
				BlockAccessList.calculateHash([{ address: AA, storageReads: [2n] }]),
			);
		});
	});

	describe("assertValid", () => {
		it("accepts a canonical list and rejects an unsorted one", () => {
			const bal = full();
			expect(() => BlockAccessList.assertValid(bal)).not.toThrow();
			expect(() => BlockAccessList.assertValid([...bal].reverse())).toThrow(
				BlockAccessList.InvalidBlockAccessListError,
			);
		});
	});
});
