import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Type } from "../types.js";
import * as TransactionLegacy from "./index.js";

describe("TransactionLegacy.getSigningHash", () => {
	it("computes signing hash for pre-EIP-155 transaction", () => {
		const tx = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const signingHash = TransactionLegacy.getSigningHash.call(tx as any);
		expect(signingHash).toBeInstanceOf(Uint8Array);
		expect(signingHash.length).toBe(32);
	});

	it("computes signing hash for EIP-155 transaction", () => {
		const tx = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 37n, // chainId 1
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const signingHash = TransactionLegacy.getSigningHash.call(tx as any);
		expect(signingHash).toBeInstanceOf(Uint8Array);
		expect(signingHash.length).toBe(32);
	});

	it("produces different hash for pre-EIP-155 vs EIP-155", () => {
		const base = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const preEIP155 = { ...base, v: 27n } as const;
		const eip155 = { ...base, v: 37n } as const; // chainId 1

		const hash1 = TransactionLegacy.getSigningHash.call(preEIP155 as any);
		const hash2 = TransactionLegacy.getSigningHash.call(eip155 as any);

		expect(hash1).not.toEqual(hash2);
	});

	it("produces deterministic hash", () => {
		const tx = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 5n,
			gasPrice: 25000000000n,
			gasLimit: 50000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 100n,
			data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const hash1 = TransactionLegacy.getSigningHash.call(tx as any);
		const hash2 = TransactionLegacy.getSigningHash.call(tx as any);
		expect(hash1).toEqual(hash2);
	});

	it("signing hash excludes signature fields", () => {
		const base = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
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
			r: new Uint8Array(32).fill(99),
			s: new Uint8Array(32).fill(99),
		} as const;

		const hash1 = TransactionLegacy.getSigningHash.call(tx1 as any);
		const hash2 = TransactionLegacy.getSigningHash.call(tx2 as any);

		expect(hash1).toEqual(hash2);
	});

	it("signing hash changes with transaction fields", () => {
		const base = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const tx1 = { ...base, nonce: 0n } as const;
		const tx2 = { ...base, nonce: 1n } as const;

		const hash1 = TransactionLegacy.getSigningHash.call(tx1 as any);
		const hash2 = TransactionLegacy.getSigningHash.call(tx2 as any);

		expect(hash1).not.toEqual(hash2);
	});

	it("computes signing hash for contract creation", () => {
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

		const signingHash = TransactionLegacy.getSigningHash.call(tx as any);
		expect(signingHash).toBeInstanceOf(Uint8Array);
		expect(signingHash.length).toBe(32);
	});

	it("handles different chain IDs correctly", () => {
		const base = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const mainnet = { ...base, v: 37n } as const; // chainId 1
		const goerli = { ...base, v: 41n } as const; // chainId 3

		const hash1 = TransactionLegacy.getSigningHash.call(mainnet as any);
		const hash2 = TransactionLegacy.getSigningHash.call(goerli as any);

		expect(hash1).not.toEqual(hash2);
	});

	it("handles large chain ID", () => {
		const largeChainId = 1000000n;
		const v = largeChainId * 2n + 35n;
		const tx = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
			value: 0n,
			data: new Uint8Array(),
			v,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const signingHash = TransactionLegacy.getSigningHash.call(tx as any);
		expect(signingHash).toBeInstanceOf(Uint8Array);
		expect(signingHash.length).toBe(32);
	});
});
