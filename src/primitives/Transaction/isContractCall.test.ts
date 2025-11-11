/**
 * Tests for isContractCall
 */

import { describe, expect, it } from "vitest";
import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedHash } from "../Hash/index.js";
import { isContractCall } from "./isContractCall.js";
import { Type } from "./types.js";
import type { EIP1559, EIP2930, EIP4844, EIP7702, Legacy } from "./types.js";

function createAddress(byte: number): BrandedAddress {
	const addr = new Uint8Array(20);
	addr.fill(byte);
	return addr as BrandedAddress;
}

function createHash(byte: number): BrandedHash {
	const hash = new Uint8Array(32);
	hash.fill(byte);
	return hash as BrandedHash;
}

function createBytes(length: number, fill = 0): Uint8Array {
	const bytes = new Uint8Array(length);
	bytes.fill(fill);
	return bytes;
}

const testAddress = createAddress(1);
const testSignature = {
	r: createBytes(32, 1),
	s: createBytes(32, 2),
};

describe("isContractCall", () => {
	describe("Legacy transactions", () => {
		it("returns true for transaction with recipient and data", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 100000n,
				to: testAddress,
				value: 0n,
				data: createBytes(100, 0xa9),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(true);
		});

		it("returns false for simple transfer (no data)", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 1000000000000000000n,
				data: new Uint8Array(),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(false);
		});

		it("returns false for contract creation (to is null)", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 100000n,
				to: null,
				value: 0n,
				data: createBytes(100, 0x60),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(false);
		});
	});

	describe("EIP-2930 transactions", () => {
		it("returns true for transaction with recipient and data", () => {
			const tx: EIP2930 = {
				type: Type.EIP2930,
				chainId: 1n,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 100000n,
				to: testAddress,
				value: 0n,
				data: createBytes(4, 0xa9),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(true);
		});

		it("returns false for simple transfer", () => {
			const tx: EIP2930 = {
				type: Type.EIP2930,
				chainId: 1n,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 1000000000000000000n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(false);
		});
	});

	describe("EIP-1559 transactions", () => {
		it("returns true for transaction with recipient and data", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 100000n,
				to: testAddress,
				value: 0n,
				data: createBytes(4, 0xa9),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(true);
		});

		it("returns false for simple transfer", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 1000000000000000000n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(false);
		});

		it("returns false for contract creation with data", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 100000n,
				to: null,
				value: 0n,
				data: createBytes(100, 0x60),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(false);
		});
	});

	describe("EIP-4844 transactions", () => {
		it("returns true for transaction with recipient and data", () => {
			const tx: EIP4844 = {
				type: Type.EIP4844,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 100000n,
				to: testAddress,
				value: 0n,
				data: createBytes(4, 0xa9),
				accessList: [],
				maxFeePerBlobGas: 1000000n,
				blobVersionedHashes: [createHash(1)],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(true);
		});

		it("returns false for blob transaction without calldata", () => {
			const tx: EIP4844 = {
				type: Type.EIP4844,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				maxFeePerBlobGas: 1000000n,
				blobVersionedHashes: [createHash(1), createHash(2)],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(false);
		});
	});

	describe("EIP-7702 transactions", () => {
		it("returns true for transaction with recipient and data", () => {
			const tx: EIP7702 = {
				type: Type.EIP7702,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 100000n,
				to: testAddress,
				value: 0n,
				data: createBytes(4, 0xa9),
				accessList: [],
				authorizationList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(true);
		});

		it("returns false for simple transfer", () => {
			const tx: EIP7702 = {
				type: Type.EIP7702,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				authorizationList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("returns true for contract call with 1 byte of data", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 100000n,
				to: testAddress,
				value: 0n,
				data: createBytes(1, 0xff),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(true);
		});

		it("returns true for contract call with value and data", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 100000n,
				to: testAddress,
				value: 1000000000000000000n,
				data: createBytes(4, 0xa9),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(true);
		});

		it("returns false for zero address transfer", () => {
			const zeroAddress = createAddress(0);
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: zeroAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(isContractCall.call(tx)).toBe(false);
		});
	});
});
