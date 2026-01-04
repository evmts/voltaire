import { describe, expect, it } from "vitest";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import { InvalidRangeError } from "../errors/index.js";
import type { EIP1559, EIP2930, EIP4844, EIP7702 } from "./types.js";
import { Type } from "./types.js";
import { validateYParity } from "./validateYParity.js";

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

describe("validateYParity", () => {
	describe("EIP-2930 transactions", () => {
		it("accepts yParity = 0", () => {
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

			expect(() => validateYParity.call(tx)).not.toThrow();
		});

		it("accepts yParity = 1", () => {
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
				yParity: 1,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateYParity.call(tx)).not.toThrow();
		});

		it("rejects yParity = 2", () => {
			const tx = {
				type: Type.EIP2930,
				chainId: 1n,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 2,
				r: testSignature.r,
				s: testSignature.s,
			} as unknown as EIP2930;

			expect(() => validateYParity.call(tx)).toThrow(InvalidRangeError);
			expect(() => validateYParity.call(tx)).toThrow("yParity must be 0 or 1");
		});

		it("rejects yParity = -1", () => {
			const tx = {
				type: Type.EIP2930,
				chainId: 1n,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: -1,
				r: testSignature.r,
				s: testSignature.s,
			} as unknown as EIP2930;

			expect(() => validateYParity.call(tx)).toThrow(InvalidRangeError);
		});

		it("rejects yParity = 27 (legacy v value)", () => {
			const tx = {
				type: Type.EIP2930,
				chainId: 1n,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 27,
				r: testSignature.r,
				s: testSignature.s,
			} as unknown as EIP2930;

			expect(() => validateYParity.call(tx)).toThrow(InvalidRangeError);
		});

		it("rejects yParity = 28 (legacy v value)", () => {
			const tx = {
				type: Type.EIP2930,
				chainId: 1n,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 28,
				r: testSignature.r,
				s: testSignature.s,
			} as unknown as EIP2930;

			expect(() => validateYParity.call(tx)).toThrow(InvalidRangeError);
		});
	});

	describe("EIP-1559 transactions", () => {
		it("accepts yParity = 0", () => {
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

			expect(() => validateYParity.call(tx)).not.toThrow();
		});

		it("accepts yParity = 1", () => {
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
				yParity: 1,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateYParity.call(tx)).not.toThrow();
		});

		it("rejects invalid yParity", () => {
			const tx = {
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
				yParity: 100,
				r: testSignature.r,
				s: testSignature.s,
			} as unknown as EIP1559;

			expect(() => validateYParity.call(tx)).toThrow(InvalidRangeError);
			expect(() => validateYParity.call(tx)).toThrow("yParity must be 0 or 1");
		});
	});

	describe("EIP-4844 transactions", () => {
		it("accepts yParity = 0", () => {
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

			expect(() => validateYParity.call(tx)).not.toThrow();
		});

		it("accepts yParity = 1", () => {
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
				yParity: 1,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateYParity.call(tx)).not.toThrow();
		});

		it("rejects invalid yParity", () => {
			const tx = {
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
				yParity: 3,
				r: testSignature.r,
				s: testSignature.s,
			} as unknown as EIP4844;

			expect(() => validateYParity.call(tx)).toThrow(InvalidRangeError);
		});
	});

	describe("EIP-7702 transactions", () => {
		it("accepts yParity = 0", () => {
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

			expect(() => validateYParity.call(tx)).not.toThrow();
		});

		it("accepts yParity = 1", () => {
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
				yParity: 1,
				r: testSignature.r,
				s: testSignature.s,
			};

			expect(() => validateYParity.call(tx)).not.toThrow();
		});

		it("rejects invalid yParity", () => {
			const tx = {
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
				yParity: 255,
				r: testSignature.r,
				s: testSignature.s,
			} as unknown as EIP7702;

			expect(() => validateYParity.call(tx)).toThrow(InvalidRangeError);
		});
	});

	describe("error details", () => {
		it("includes error code INVALID_Y_PARITY", () => {
			const tx = {
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
				yParity: 42,
				r: testSignature.r,
				s: testSignature.s,
			} as unknown as EIP1559;

			try {
				validateYParity.call(tx);
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(InvalidRangeError);
				const rangeError = error as InvalidRangeError;
				expect(rangeError.code).toBe("INVALID_Y_PARITY");
				expect(rangeError.value).toBe(42);
				expect(rangeError.expected).toBe("0 or 1");
			}
		});
	});
});
