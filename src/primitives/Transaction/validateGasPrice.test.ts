/**
 * Tests for validateGasPrice
 */

import { describe, expect, it } from "vitest";
import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import { InvalidRangeError } from "../errors/index.js";
import { Type } from "./types.js";
import type { EIP1559, EIP2930, EIP4844, EIP7702, Legacy } from "./types.js";
import { validateGasPrice } from "./validateGasPrice.js";

function createAddress(byte: number): BrandedAddress {
	const addr = new Uint8Array(20);
	addr.fill(byte);
	return addr as BrandedAddress;
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

describe("validateGasPrice", () => {
	describe("Legacy transactions", () => {
		it("accepts valid gas price (1 gwei)", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 1000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).not.toThrow();
		});

		it("accepts valid gas price (10 gwei)", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 10000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).not.toThrow();
		});

		it("accepts valid gas price (100 gwei)", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 100000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).not.toThrow();
		});

		it("accepts zero gas price", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 0n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).not.toThrow();
		});

		it("rejects negative gas price", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: -1n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).toThrow(InvalidRangeError);
			expect(() => validateGasPrice.call(tx)).toThrow(
				"Gas price cannot be negative",
			);
		});

		it("accepts MAX_UINT256 gas price", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 2n ** 256n - 1n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).not.toThrow();
		});
	});

	describe("EIP-2930 transactions", () => {
		it("accepts valid gas price", () => {
			const tx: EIP2930 = {
				type: Type.EIP2930,
				chainId: 1n,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).not.toThrow();
		});

		it("rejects negative gas price", () => {
			const tx: EIP2930 = {
				type: Type.EIP2930,
				chainId: 1n,
				nonce: 0n,
				gasPrice: -1n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).toThrow(InvalidRangeError);
		});
	});

	describe("EIP-1559 transactions", () => {
		it("accepts valid maxFeePerGas and maxPriorityFeePerGas", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).not.toThrow();
		});

		it("accepts maxPriorityFeePerGas equal to maxFeePerGas", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 20000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).not.toThrow();
		});

		it("accepts zero fees", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 0n,
				maxFeePerGas: 0n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).not.toThrow();
		});

		it("rejects negative maxFeePerGas", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: -1n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).toThrow(InvalidRangeError);
			expect(() => validateGasPrice.call(tx)).toThrow(
				"Max fee per gas cannot be negative",
			);
		});

		it("rejects negative maxPriorityFeePerGas", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: -1n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).toThrow(InvalidRangeError);
			expect(() => validateGasPrice.call(tx)).toThrow(
				"Max priority fee per gas cannot be negative",
			);
		});

		it("rejects maxPriorityFeePerGas > maxFeePerGas", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 30000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).toThrow(InvalidRangeError);
			expect(() => validateGasPrice.call(tx)).toThrow(
				"Max priority fee per gas cannot exceed max fee per gas",
			);
		});

		it("accepts MAX_UINT256 fees when equal", () => {
			const maxUint256 = 2n ** 256n - 1n;
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: maxUint256,
				maxFeePerGas: maxUint256,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).not.toThrow();
		});
	});

	describe("EIP-4844 transactions", () => {
		it("accepts valid fees", () => {
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
				blobVersionedHashes: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).not.toThrow();
		});

		it("rejects invalid fee relationship", () => {
			const tx: EIP4844 = {
				type: Type.EIP4844,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 30000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				maxFeePerBlobGas: 1000000n,
				blobVersionedHashes: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateGasPrice.call(tx)).toThrow(InvalidRangeError);
		});
	});

	describe("EIP-7702 transactions", () => {
		it("accepts valid fees", () => {
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

			expect(() => validateGasPrice.call(tx)).not.toThrow();
		});

		it("rejects invalid fee relationship", () => {
			const tx: EIP7702 = {
				type: Type.EIP7702,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 30000000000n,
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

			expect(() => validateGasPrice.call(tx)).toThrow(InvalidRangeError);
		});
	});
});
