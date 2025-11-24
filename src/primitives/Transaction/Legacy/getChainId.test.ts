import { describe, expect, it } from "vitest";
import { Address } from "../../Address/index.js";
import { Type } from "../types.js";
import type { TransactionLegacyType } from "./TransactionLegacyType.js";
import * as TransactionLegacy from "./index.js";

describe("TransactionLegacy.getChainId", () => {
	it("returns null for pre-EIP-155 transaction (v = 27)", () => {
		const tx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
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

		const chainId = TransactionLegacy.getChainId.call(tx);
		expect(chainId).toBe(null);
	});

	it("returns null for pre-EIP-155 transaction (v = 28)", () => {
		const tx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 28n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const chainId = TransactionLegacy.getChainId.call(tx);
		expect(chainId).toBe(null);
	});

	it("returns chainId 1 for EIP-155 transaction (v = 37)", () => {
		const tx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 37n, // chainId 1, yParity 0: v = 1 * 2 + 35 + 0
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const chainId = TransactionLegacy.getChainId.call(tx);
		expect(chainId).toBe(1n);
	});

	it("returns chainId 1 for EIP-155 transaction (v = 38)", () => {
		const tx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 38n, // chainId 1, yParity 1: v = 1 * 2 + 35 + 1
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const chainId = TransactionLegacy.getChainId.call(tx);
		expect(chainId).toBe(1n);
	});

	it("returns chainId 5 for Goerli (v = 45)", () => {
		const tx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 45n, // chainId 5, yParity 0: v = 5 * 2 + 35 + 0
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const chainId = TransactionLegacy.getChainId.call(tx);
		expect(chainId).toBe(5n);
	});

	it("returns chainId 137 for Polygon (v = 309)", () => {
		const tx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 309n, // chainId 137, yParity 0: v = 137 * 2 + 35 + 0
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const chainId = TransactionLegacy.getChainId.call(tx);
		expect(chainId).toBe(137n);
	});

	it("returns large chainId for custom networks", () => {
		const largeChainId = 1000000n;
		const v = largeChainId * 2n + 35n;

		const tx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const chainId = TransactionLegacy.getChainId.call(tx);
		expect(chainId).toBe(largeChainId);
	});

	it("correctly extracts chainId with yParity 1", () => {
		const tx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 46n, // chainId 5, yParity 1: v = 5 * 2 + 35 + 1
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const chainId = TransactionLegacy.getChainId.call(tx);
		expect(chainId).toBe(5n);
	});

	it("returns null for v = 34 (edge case)", () => {
		const tx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 34n,
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const chainId = TransactionLegacy.getChainId.call(tx);
		expect(chainId).toBe(null);
	});

	it("returns chainId 0 for v = 35 (edge case)", () => {
		const tx: TransactionLegacyType = {
			__tag: "TransactionLegacy",
			type: Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 35n, // chainId 0, yParity 0: v = 0 * 2 + 35 + 0
			r: new Uint8Array(32).fill(1),
			s: new Uint8Array(32).fill(2),
		};

		const chainId = TransactionLegacy.getChainId.call(tx);
		expect(chainId).toBe(0n);
	});
});
