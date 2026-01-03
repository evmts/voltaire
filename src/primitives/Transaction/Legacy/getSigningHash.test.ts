import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import * as Hex from "../../Hex/index.js";
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
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const signingHash = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			TransactionLegacy.getSigningHash.call(tx as any);
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
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 37n, // chainId 1
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const signingHash = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			TransactionLegacy.getSigningHash.call(tx as any);
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
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const preEIP155 = { ...base, v: 27n } as const;
		const eip155 = { ...base, v: 37n } as const; // chainId 1

		const hash1 = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			TransactionLegacy.getSigningHash.call(preEIP155 as any);
		const hash2 = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			TransactionLegacy.getSigningHash.call(eip155 as any);

		expect(hash1).not.toEqual(hash2);
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

		const hash1 = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			TransactionLegacy.getSigningHash.call(tx as any);
		const hash2 = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			TransactionLegacy.getSigningHash.call(tx as any);
		expect(hash1).toEqual(hash2);
	});

	it("signing hash excludes signature fields", () => {
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
			r: new Uint8Array(32).fill(99),
			s: new Uint8Array(32).fill(99),
		} as const;

		const hash1 = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			TransactionLegacy.getSigningHash.call(tx1 as any);
		const hash2 = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			TransactionLegacy.getSigningHash.call(tx2 as any);

		expect(hash1).toEqual(hash2);
	});

	it("signing hash changes with transaction fields", () => {
		const base = {
			__tag: "TransactionLegacy" as const,
			type: Type.Legacy,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			v: 27n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const tx1 = { ...base, nonce: 0n } as const;
		const tx2 = { ...base, nonce: 1n } as const;

		const hash1 = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			TransactionLegacy.getSigningHash.call(tx1 as any);
		const hash2 = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			TransactionLegacy.getSigningHash.call(tx2 as any);

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

		const signingHash = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			TransactionLegacy.getSigningHash.call(tx as any);
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
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const mainnet = { ...base, v: 37n } as const; // chainId 1
		const goerli = { ...base, v: 41n } as const; // chainId 3

		const hash1 = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			TransactionLegacy.getSigningHash.call(mainnet as any);
		const hash2 = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			TransactionLegacy.getSigningHash.call(goerli as any);

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
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 0n,
			data: new Uint8Array(),
			v,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const signingHash = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
			TransactionLegacy.getSigningHash.call(tx as any);
		expect(signingHash).toBeInstanceOf(Uint8Array);
		expect(signingHash.length).toBe(32);
	});

	// EIP-155 official test vectors
	describe("EIP-155 test vectors", () => {
		it("matches EIP-155 signing hash test vector", () => {
			// From EIP-155 specification
			// Signing data = RLP([nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0])
			// For chainId = 1
			const tx = {
				__tag: "TransactionLegacy" as const,
				type: Type.Legacy,
				nonce: 9n,
				gasPrice: 20000000000n, // 20 gwei
				gasLimit: 21000n,
				to: Address("0x3535353535353535353535353535353535353535"),
				value: 1000000000000000000n, // 1 ETH
				data: new Uint8Array(),
				// v = chainId * 2 + 35 + recovery = 1 * 2 + 35 + 0 = 37
				v: 37n,
				r: new Uint8Array(32), // dummy, not used for signing hash
				s: new Uint8Array(32), // dummy, not used for signing hash
			};

			const signingHash = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
				TransactionLegacy.getSigningHash.call(tx as any);

			// Expected from EIP-155: keccak256(RLP([nonce, gp, gl, to, value, data, 1, 0, 0]))
			const expectedHash = Hex.toBytes(
				"0xdaf5a779ae972f972197303d7b574746c7ef83eadac0f2791ad23db92e4c8e53",
			);
			expect(signingHash).toEqual(expectedHash);
		});

		it("pre-EIP-155 signing hash uses 6-element RLP", () => {
			// Pre-EIP-155: RLP([nonce, gasPrice, gasLimit, to, value, data])
			// No chainId, 0, 0 appended
			const tx = {
				__tag: "TransactionLegacy" as const,
				type: Type.Legacy,
				nonce: 9n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x3535353535353535353535353535353535353535"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				v: 27n, // pre-EIP-155
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};

			const signingHash = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
				TransactionLegacy.getSigningHash.call(tx as any);

			// EIP-155 signing hash should differ (has chainId, 0, 0)
			const eip155Tx = { ...tx, v: 37n }; // chainId 1
			const eip155Hash = // biome-ignore lint/suspicious/noExplicitAny: branded type cast
				TransactionLegacy.getSigningHash.call(eip155Tx as any);

			expect(signingHash).not.toEqual(eip155Hash);
			expect(signingHash.length).toBe(32);
		});
	});
});
