import { describe, expect, it } from "vitest";
import { IsContract } from "./IsContract.js";
import { from } from "./from.js";

describe("IsContract", () => {
	const testAddress = from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

	it("should return true when address has bytecode", async () => {
		const mockGetCode = async (_addr: string) => "0x608060405234801561001057600080fd";
		const isContract = IsContract({ getCode: mockGetCode });

		const result = await isContract(testAddress);
		expect(result).toBe(true);
	});

	it("should return false when address returns 0x (EOA)", async () => {
		const mockGetCode = async (_addr: string) => "0x";
		const isContract = IsContract({ getCode: mockGetCode });

		const result = await isContract(testAddress);
		expect(result).toBe(false);
	});

	it("should return false when address returns null", async () => {
		const mockGetCode = async (_addr: string) => null as unknown as string;
		const isContract = IsContract({ getCode: mockGetCode });

		const result = await isContract(testAddress);
		expect(result).toBe(false);
	});

	it("should return false when address returns undefined", async () => {
		const mockGetCode = async (_addr: string) => undefined as unknown as string;
		const isContract = IsContract({ getCode: mockGetCode });

		const result = await isContract(testAddress);
		expect(result).toBe(false);
	});

	it("should pass correct hex address to getCode", async () => {
		let receivedAddress = "";
		const mockGetCode = async (addr: string) => {
			receivedAddress = addr;
			return "0x";
		};
		const isContract = IsContract({ getCode: mockGetCode });

		await isContract(testAddress);
		expect(receivedAddress).toBe("0x742d35cc6634c0532925a3b844bc454e4438f44e");
	});

	it("should handle minimal bytecode (just 0x00)", async () => {
		const mockGetCode = async (_addr: string) => "0x00";
		const isContract = IsContract({ getCode: mockGetCode });

		const result = await isContract(testAddress);
		expect(result).toBe(true);
	});

	it("should work with async getCode that resolves later", async () => {
		const mockGetCode = async (_addr: string) => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			return "0x6080";
		};
		const isContract = IsContract({ getCode: mockGetCode });

		const result = await isContract(testAddress);
		expect(result).toBe(true);
	});

	it("should propagate errors from getCode", async () => {
		const mockGetCode = async (_addr: string): Promise<string> => {
			throw new Error("RPC error");
		};
		const isContract = IsContract({ getCode: mockGetCode });

		await expect(isContract(testAddress)).rejects.toThrow("RPC error");
	});
});
