import { describe, expect, test, vi } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { recoverPublicKey } from "../../crypto/Secp256k1/recoverPublicKey.js";
import { fromPublicKey } from "../Address/fromPublicKey.js";
import {
	EIP1271_MAGIC_VALUE,
	IS_VALID_SIGNATURE_SELECTOR,
} from "./constants.js";
import { ContractCallError } from "./errors.js";
import { isValidSignature } from "./isValidSignature.js";
import { VerifySignature } from "./verifySignature.js";

describe("ContractSignature", () => {
	describe("isValidSignature", () => {
		test("returns true when contract returns magic value", async () => {
			const mockProvider = {
				request: vi.fn().mockResolvedValue(EIP1271_MAGIC_VALUE),
			};

			const contractAddress = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const hash = new Uint8Array(32).fill(0xab);
			const signature = new Uint8Array(65);

			const result = await isValidSignature(
				mockProvider,
				contractAddress,
				hash,
				signature,
			);

			expect(result).toBe(true);
			expect(mockProvider.request).toHaveBeenCalledWith("eth_call", [
				{
					to: contractAddress,
					data: expect.stringMatching(/^0x1626ba7e/), // isValidSignature selector
				},
				"latest",
			]);
		});

		test("returns false when contract returns different value", async () => {
			const mockProvider = {
				request: vi.fn().mockResolvedValue("0xffffffff"),
			};

			const contractAddress = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const hash = new Uint8Array(32).fill(0xab);
			const signature = new Uint8Array(65);

			const result = await isValidSignature(
				mockProvider,
				contractAddress,
				hash,
				signature,
			);

			expect(result).toBe(false);
		});

		test("handles contract address as Uint8Array", async () => {
			const mockProvider = {
				request: vi.fn().mockResolvedValue(EIP1271_MAGIC_VALUE),
			};

			const contractAddress = new Uint8Array(20).fill(0x42);
			const hash = new Uint8Array(32).fill(0xab);
			const signature = new Uint8Array(65);

			const result = await isValidSignature(
				mockProvider,
				contractAddress,
				hash,
				signature,
			);

			expect(result).toBe(true);
		});

		test("throws ContractCallError on provider error", async () => {
			const mockProvider = {
				request: vi.fn().mockRejectedValue(new Error("Network error")),
			};

			const contractAddress = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const hash = new Uint8Array(32).fill(0xab);
			const signature = new Uint8Array(65);

			await expect(
				isValidSignature(mockProvider, contractAddress, hash, signature),
			).rejects.toThrow(ContractCallError);
		});

		test("encodes function call with correct ABI", async () => {
			const mockProvider = {
				request: vi.fn().mockResolvedValue(EIP1271_MAGIC_VALUE),
			};

			const contractAddress = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const hash = new Uint8Array(32).fill(0xcd);
			const signature = new Uint8Array(65).fill(0xef);

			await isValidSignature(mockProvider, contractAddress, hash, signature);

			const callData = mockProvider.request.mock.calls[0]?.[1]?.[0]?.data;
			expect(callData).toMatch(/^0x1626ba7e/); // selector
			expect(callData.length).toBeGreaterThan(10); // selector + encoded params
		});
	});

	describe("VerifySignature", () => {
		const verifySignature = VerifySignature({
			keccak256,
			recoverPublicKey,
			addressFromPublicKey: fromPublicKey,
		});

		test("verifies EOA signature when address has no code", async () => {
			const mockProvider = {
				request: vi.fn().mockResolvedValue("0x"), // No code = EOA
			};

			const address = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const hash = new Uint8Array(32).fill(0xab);
			const signature = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
				v: 27,
			};

			// Will return false because signature is invalid, but tests EOA path
			const result = await verifySignature(
				mockProvider,
				address,
				hash,
				signature,
			);

			expect(mockProvider.request).toHaveBeenCalledWith("eth_getCode", [
				address,
				"latest",
			]);
			expect(typeof result).toBe("boolean");
		});

		test("verifies contract signature when address has code", async () => {
			const mockProvider = {
				request: vi
					.fn()
					.mockResolvedValueOnce("0x1234") // Has code = contract
					.mockResolvedValueOnce(EIP1271_MAGIC_VALUE), // isValidSignature returns magic
			};

			const address = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const hash = new Uint8Array(32).fill(0xab);
			const signature = new Uint8Array(65);

			const result = await verifySignature(
				mockProvider,
				address,
				hash,
				signature,
			);

			expect(result).toBe(true);
			expect(mockProvider.request).toHaveBeenCalledWith("eth_getCode", [
				address,
				"latest",
			]);
		});

		test("handles signature as component object", async () => {
			const mockProvider = {
				request: vi.fn().mockResolvedValue("0x"),
			};

			const address = new Uint8Array(20).fill(0x42);
			const hash = new Uint8Array(32).fill(0xab);
			const signature = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
				v: 27,
			};

			await verifySignature(mockProvider, address, hash, signature);

			expect(mockProvider.request).toHaveBeenCalled();
		});

		test("handles signature as 65-byte array", async () => {
			const mockProvider = {
				request: vi.fn().mockResolvedValue("0x"),
			};

			const address = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const hash = new Uint8Array(32).fill(0xab);
			const signature = new Uint8Array(65);
			signature[64] = 27; // v

			await verifySignature(mockProvider, address, hash, signature);

			expect(mockProvider.request).toHaveBeenCalled();
		});

		test("returns false on invalid signature length for EOA", async () => {
			const mockProvider = {
				request: vi.fn().mockResolvedValue("0x"),
			};

			const address = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const hash = new Uint8Array(32).fill(0xab);
			const signature = new Uint8Array(64); // Invalid length

			const result = await verifySignature(
				mockProvider,
				address,
				hash,
				signature,
			);

			expect(result).toBe(false);
		});

		test("returns false on verification error", async () => {
			const mockProvider = {
				request: vi.fn().mockRejectedValue(new Error("Network error")),
			};

			const address = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const hash = new Uint8Array(32).fill(0xab);
			const signature = new Uint8Array(65);

			const result = await verifySignature(
				mockProvider,
				address,
				hash,
				signature,
			);

			expect(result).toBe(false);
		});

		test("handles address as Uint8Array", async () => {
			const mockProvider = {
				request: vi.fn().mockResolvedValue("0x"),
			};

			const address = new Uint8Array(20).fill(0x42);
			const hash = new Uint8Array(32).fill(0xab);
			const signature = new Uint8Array(65);

			await verifySignature(mockProvider, address, hash, signature);

			expect(mockProvider.request).toHaveBeenCalled();
		});
	});

	describe("Constants", () => {
		test("EIP1271_MAGIC_VALUE is correct", () => {
			expect(EIP1271_MAGIC_VALUE).toBe("0x1626ba7e");
		});

		test("IS_VALID_SIGNATURE_SELECTOR is correct", () => {
			expect(IS_VALID_SIGNATURE_SELECTOR).toBe("0x1626ba7e");
		});
	});
});
