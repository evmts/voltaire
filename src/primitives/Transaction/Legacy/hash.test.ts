import { describe, expect, it } from "vitest";
import { keccak256, serializeTransaction } from "viem";
import * as Hex from "../../Hex/index.js";
import { Address } from "../../Address/index.js";
import { Type } from "../types.js";
import * as TransactionLegacy from "./index.js";

describe("TransactionLegacy.hash", () => {
	describe("cross-validation with viem", () => {
		it("matches viem for pre-EIP-155 transaction (v=27)", () => {
			const tx = {
				__tag: "TransactionLegacy" as const,
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			// biome-ignore lint/suspicious/noExplicitAny: branded type cast
			const hash = TransactionLegacy.hash.call(tx as any);
			const hashHex = Hex.fromBytes(hash);

			// Expected hash from viem
			expect(hashHex).toBe(
				"0x822ea70c916e490db54858649be030ca9cf5727bf24d0024e6cd424636d98b2b",
			);
		});

		it("matches viem for EIP-155 transaction (v=37, chainId=1)", () => {
			const tx = {
				__tag: "TransactionLegacy" as const,
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				v: 37n, // chainId 1: v = 1 * 2 + 35 = 37
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			// biome-ignore lint/suspicious/noExplicitAny: branded type cast
			const hash = TransactionLegacy.hash.call(tx as any);
			const hashHex = Hex.fromBytes(hash);

			// Expected hash from viem
			expect(hashHex).toBe(
				"0x9354317a6de6e196cbbf1e6b734b647bb4ad2cd373bad3c5129b9674520cdd76",
			);
		});

		it("hash equals keccak256(serialize) matching viem behavior", () => {
			const tx = {
				__tag: "TransactionLegacy" as const,
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			// Compute hash using our implementation
			// biome-ignore lint/suspicious/noExplicitAny: branded type cast
			const hash = TransactionLegacy.hash.call(tx as any);

			// Compute hash using viem for comparison
			const viemTx = {
				type: "legacy" as const,
				nonce: 0n,
				gasPrice: 20000000000n,
				gas: 21000n,
				to: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0" as `0x${string}`,
				value: 1000000000000000000n,
				data: "0x" as const,
			};
			const viemSig = {
				r: "0x0101010101010101010101010101010101010101010101010101010101010101" as `0x${string}`,
				s: "0x0202020202020202020202020202020202020202020202020202020202020202" as `0x${string}`,
				v: 27n,
			};
			const viemSerialized = serializeTransaction(viemTx, viemSig);
			const viemHash = keccak256(viemSerialized);

			expect(Hex.fromBytes(hash)).toBe(viemHash);
		});
	});

	it("computes transaction hash", () => {
		const tx = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const txHash = TransactionLegacy.hash // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			.call(tx as any);
		expect(txHash).toBeInstanceOf(Uint8Array);
		expect(txHash.length).toBe(32);
	});

	it("produces deterministic hash", () => {
		const tx = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 5n,
			gasPrice: 25000000000n,
			gasLimit: 50000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 100n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const hash1 = TransactionLegacy.hash // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			.call(tx as any);
		const hash2 = TransactionLegacy.hash // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			.call(tx as any);
		expect(hash1).toEqual(hash2);
	});

	it("produces different hash for different transactions", () => {
		const tx1 = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const tx2 = {
			...tx1,
			nonce: 1n,
		} as const;

		const hash1 = TransactionLegacy.hash // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			.call(tx1 as any);
		const hash2 = TransactionLegacy.hash // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			.call(tx2 as any);
		expect(hash1).not.toEqual(hash2);
	});

	it("hash changes with different signature", () => {
		const base = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
		};

		const tx1 = {
			...base,
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		} as const;
		const tx2 = {
			...base,
			v: 27n,
			r: new Uint8Array(32).fill(3),
			s: new Uint8Array(32).fill(2),
		} as const;

		const hash1 = TransactionLegacy.hash // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			.call(tx1 as any);
		const hash2 = TransactionLegacy.hash // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			.call(tx2 as any);
		expect(hash1).not.toEqual(hash2);
	});

	it("hash changes with EIP-155 v value", () => {
		const base = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const tx1 = { ...base, v: 27n } as const; // pre-EIP-155
		const tx2 = { ...base, v: 37n } as const; // EIP-155 chainId 1

		const hash1 = TransactionLegacy.hash // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			.call(tx1 as any);
		const hash2 = TransactionLegacy.hash // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			.call(tx2 as any);
		expect(hash1).not.toEqual(hash2);
	});

	it("computes hash for contract creation", () => {
		const tx = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 1000000n,
			to: null,
			value: 0n,
			data: new Uint8Array([0x60, 0x80, 0x60, 0x40]),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const txHash = TransactionLegacy.hash // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			.call(tx as any);
		expect(txHash).toBeInstanceOf(Uint8Array);
		expect(txHash.length).toBe(32);
	});

	it("round-trip: serialize -> deserialize -> hash", () => {
		const tx = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 5n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		// biome-ignore lint/suspicious/noExplicitAny: branded type cast
		const hash1 = TransactionLegacy.hash.call(tx as any);
		// biome-ignore lint/suspicious/noExplicitAny: branded type cast
		const serialized = TransactionLegacy.serialize.call(tx as any);
		const deserialized = TransactionLegacy.deserialize(serialized);
		const hash2 = TransactionLegacy.hash.call(deserialized);

		expect(hash1).toEqual(hash2);
	});
});
