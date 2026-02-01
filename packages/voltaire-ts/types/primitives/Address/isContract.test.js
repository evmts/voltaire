import { describe, expect, it, vi } from "vitest";
import { from } from "./from.js";
import { IsContract } from "./isContract.js";
describe("Address.IsContract", () => {
    describe("factory pattern", () => {
        it("returns a function when called with eth_getCode", () => {
            const isContract = IsContract({
                eth_getCode: async () => "0x",
            });
            expect(typeof isContract).toBe("function");
        });
        it("calls eth_getCode with hex address", async () => {
            const mockGetCode = vi.fn().mockResolvedValue("0x");
            const isContract = IsContract({ eth_getCode: mockGetCode });
            const address = from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
            await isContract(address);
            expect(mockGetCode).toHaveBeenCalledWith("0x742d35cc6634c0532925a3b844bc9e7595f51e3e");
        });
    });
    describe("contract detection", () => {
        it("returns true for address with bytecode", async () => {
            const isContract = IsContract({
                eth_getCode: async () => "0x608060405234801561001057600080fd5b50600436106100415760003560e01c",
            });
            const address = from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
            const result = await isContract(address);
            expect(result).toBe(true);
        });
        it("returns true for minimal bytecode", async () => {
            const isContract = IsContract({
                eth_getCode: async () => "0x00",
            });
            const address = from("0x1234567890123456789012345678901234567890");
            const result = await isContract(address);
            expect(result).toBe(true);
        });
        it("returns true for large contract bytecode", async () => {
            // Simulate a large contract with lots of bytecode
            const largeBytecode = `0x${"60".repeat(24576)}`; // 24KB contract
            const isContract = IsContract({
                eth_getCode: async () => largeBytecode,
            });
            const address = from("0x1234567890123456789012345678901234567890");
            const result = await isContract(address);
            expect(result).toBe(true);
        });
    });
    describe("EOA detection", () => {
        it("returns false for EOA (returns 0x)", async () => {
            const isContract = IsContract({
                eth_getCode: async () => "0x",
            });
            const address = from("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
            const result = await isContract(address);
            expect(result).toBe(false);
        });
        it("returns false for empty string response", async () => {
            const isContract = IsContract({
                eth_getCode: async () => "",
            });
            const address = from("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
            const result = await isContract(address);
            expect(result).toBe(false);
        });
        it("returns false for 0x0 response", async () => {
            const isContract = IsContract({
                eth_getCode: async () => "0x0",
            });
            const address = from("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
            const result = await isContract(address);
            expect(result).toBe(false);
        });
    });
    describe("zero address", () => {
        it("returns false for zero address (typically no code)", async () => {
            const isContract = IsContract({
                eth_getCode: async () => "0x",
            });
            const address = from("0x0000000000000000000000000000000000000000");
            const result = await isContract(address);
            expect(result).toBe(false);
        });
    });
    describe("precompile addresses", () => {
        it("handles precompile addresses correctly", async () => {
            // Precompiles (0x01-0x09) have native code but eth_getCode returns 0x
            const isContract = IsContract({
                eth_getCode: async () => "0x",
            });
            // ecrecover precompile
            const precompile = from("0x0000000000000000000000000000000000000001");
            const result = await isContract(precompile);
            // Returns false because eth_getCode returns 0x for precompiles
            expect(result).toBe(false);
        });
    });
    describe("async behavior", () => {
        it("returns a promise", () => {
            const isContract = IsContract({
                eth_getCode: async () => "0x",
            });
            const address = from("0x1234567890123456789012345678901234567890");
            const result = isContract(address);
            expect(result).toBeInstanceOf(Promise);
        });
        it("propagates errors from eth_getCode", async () => {
            const isContract = IsContract({
                eth_getCode: async () => {
                    throw new Error("RPC error: rate limited");
                },
            });
            const address = from("0x1234567890123456789012345678901234567890");
            await expect(isContract(address)).rejects.toThrow("RPC error: rate limited");
        });
        it("handles slow RPC responses", async () => {
            const isContract = IsContract({
                eth_getCode: async () => {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    return "0x6080";
                },
            });
            const address = from("0x1234567890123456789012345678901234567890");
            const result = await isContract(address);
            expect(result).toBe(true);
        });
    });
    describe("real-world addresses", () => {
        it("correctly identifies USDC contract address pattern", async () => {
            // USDC on Ethereum mainnet
            const isContract = IsContract({
                eth_getCode: async (addr) => {
                    if (addr.toLowerCase() === "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48") {
                        return "0x60806040"; // Simulated bytecode
                    }
                    return "0x";
                },
            });
            const usdc = from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
            const result = await isContract(usdc);
            expect(result).toBe(true);
        });
        it("correctly identifies Vitalik's EOA address pattern", async () => {
            const isContract = IsContract({
                eth_getCode: async (addr) => {
                    if (addr.toLowerCase() === "0xd8da6bf26964af9d7eed9e03e53415d37aa96045") {
                        return "0x"; // EOA has no code
                    }
                    return "0x60806040";
                },
            });
            const vitalik = from("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
            const result = await isContract(vitalik);
            expect(result).toBe(false);
        });
    });
    describe("address input formats", () => {
        it("works with address from hex string", async () => {
            const mockGetCode = vi.fn().mockResolvedValue("0x6080");
            const isContract = IsContract({ eth_getCode: mockGetCode });
            const address = from("0x1234567890123456789012345678901234567890");
            const result = await isContract(address);
            expect(result).toBe(true);
        });
        it("works with address from bytes", async () => {
            const mockGetCode = vi.fn().mockResolvedValue("0x6080");
            const isContract = IsContract({ eth_getCode: mockGetCode });
            const bytes = new Uint8Array(20).fill(0x12);
            const address = from(bytes);
            const result = await isContract(address);
            expect(result).toBe(true);
            expect(mockGetCode).toHaveBeenCalled();
        });
        it("works with address from bigint", async () => {
            const mockGetCode = vi.fn().mockResolvedValue("0x");
            const isContract = IsContract({ eth_getCode: mockGetCode });
            const address = from(0x1234567890n);
            const result = await isContract(address);
            expect(result).toBe(false);
        });
    });
});
