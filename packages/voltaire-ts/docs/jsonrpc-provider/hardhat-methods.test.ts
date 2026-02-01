/**
 * Tests for docs/jsonrpc-provider/hardhat-methods.mdx
 *
 * Tests the Hardhat Methods documentation for Hardhat Network testing methods.
 */
import { describe, expect, it } from "vitest";

describe("Hardhat Methods Documentation", () => {
	describe("Network Control", () => {
		it("creates hardhat_reset request with no params", async () => {
			const { hardhat } = await import("../../src/jsonrpc/index.js");

			const request = hardhat.hardhat_reset();

			expect(request.method).toBe("hardhat_reset");
			expect(request.params).toEqual([]);
		});

		it("creates hardhat_reset request with forking config", async () => {
			const { hardhat } = await import("../../src/jsonrpc/index.js");

			const config = {
				forking: {
					jsonRpcUrl: "https://eth-mainnet.alchemyapi.io/v2/your-api-key",
					blockNumber: 14390000,
				},
			};
			const request = hardhat.hardhat_reset(config);

			expect(request.method).toBe("hardhat_reset");
			expect(request.params).toEqual([config]);
		});
	});

	describe("State Manipulation", () => {
		it("creates hardhat_setBalance request", async () => {
			const { hardhat } = await import("../../src/jsonrpc/index.js");

			const request = hardhat.hardhat_setBalance(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
				"0xde0b6b3a7640000",
			);

			expect(request.method).toBe("hardhat_setBalance");
			expect(request.params).toEqual([
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
				"0xde0b6b3a7640000",
			]);
		});

		it("creates hardhat_setCode request", async () => {
			const { hardhat } = await import("../../src/jsonrpc/index.js");

			const request = hardhat.hardhat_setCode(
				"0x5FbDB2315678afecb367f032d93F642f64180aa3",
				"0x6080604052",
			);

			expect(request.method).toBe("hardhat_setCode");
			expect(request.params).toEqual([
				"0x5FbDB2315678afecb367f032d93F642f64180aa3",
				"0x6080604052",
			]);
		});

		it("creates hardhat_setNonce request", async () => {
			const { hardhat } = await import("../../src/jsonrpc/index.js");

			const request = hardhat.hardhat_setNonce(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
				"0x10",
			);

			expect(request.method).toBe("hardhat_setNonce");
			expect(request.params).toEqual([
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
				"0x10",
			]);
		});

		it("creates hardhat_setStorageAt request", async () => {
			const { hardhat } = await import("../../src/jsonrpc/index.js");

			const request = hardhat.hardhat_setStorageAt(
				"0x5FbDB2315678afecb367f032d93F642f64180aa3",
				"0x0",
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);

			expect(request.method).toBe("hardhat_setStorageAt");
			expect(request.params).toEqual([
				"0x5FbDB2315678afecb367f032d93F642f64180aa3",
				"0x0",
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			]);
		});
	});

	describe("Account Impersonation", () => {
		it("creates hardhat_impersonateAccount request", async () => {
			const { hardhat } = await import("../../src/jsonrpc/index.js");

			const request = hardhat.hardhat_impersonateAccount(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			expect(request.method).toBe("hardhat_impersonateAccount");
			expect(request.params).toEqual([
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			]);
		});

		it("creates hardhat_stopImpersonatingAccount request", async () => {
			const { hardhat } = await import("../../src/jsonrpc/index.js");

			const request = hardhat.hardhat_stopImpersonatingAccount(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			expect(request.method).toBe("hardhat_stopImpersonatingAccount");
			expect(request.params).toEqual([
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			]);
		});
	});

	describe("Mining", () => {
		it("creates hardhat_mine request with no params", async () => {
			const { hardhat } = await import("../../src/jsonrpc/index.js");

			const request = hardhat.hardhat_mine();

			expect(request.method).toBe("hardhat_mine");
			expect(request.params).toEqual([]);
		});

		it("creates hardhat_mine request with blocks", async () => {
			const { hardhat } = await import("../../src/jsonrpc/index.js");

			const request = hardhat.hardhat_mine("0xa");

			expect(request.method).toBe("hardhat_mine");
			expect(request.params).toEqual(["0xa"]);
		});

		it("creates hardhat_mine request with blocks and interval", async () => {
			const { hardhat } = await import("../../src/jsonrpc/index.js");

			const request = hardhat.hardhat_mine("0xa", "0x5");

			expect(request.method).toBe("hardhat_mine");
			expect(request.params).toEqual(["0xa", "0x5"]);
		});
	});

	describe("Usage Patterns from Docs", () => {
		it("demonstrates forking mainnet pattern", async () => {
			const { hardhat } = await import("../../src/jsonrpc/index.js");

			// Fork mainnet at specific block
			const resetReq = hardhat.hardhat_reset({
				forking: {
					jsonRpcUrl: "https://eth-mainnet.alchemyapi.io/v2/key",
					blockNumber: 18000000,
				},
			});
			expect(resetReq.method).toBe("hardhat_reset");

			// Impersonate mainnet address
			const impersonateReq = hardhat.hardhat_impersonateAccount(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);
			expect(impersonateReq.method).toBe("hardhat_impersonateAccount");
		});

		it("demonstrates test setup pattern", async () => {
			const { hardhat } = await import("../../src/jsonrpc/index.js");

			const testAccounts = [
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
				"0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			];

			// Fund test accounts
			for (const account of testAccounts) {
				const req = hardhat.hardhat_setBalance(
					account,
					"0x56bc75e2d63100000", // 100 ETH
				);
				expect(req.method).toBe("hardhat_setBalance");
			}
		});

		it("demonstrates mine to trigger time-based logic pattern", async () => {
			const { hardhat } = await import("../../src/jsonrpc/index.js");

			// Mine 100 blocks to pass time lock
			const mineReq = hardhat.hardhat_mine("0x64"); // 100 blocks

			expect(mineReq.method).toBe("hardhat_mine");
			expect(mineReq.params).toEqual(["0x64"]);
		});
	});

	describe("Hardhat vs Anvil Equivalence", () => {
		// From docs: comparison table shows equivalent methods
		it("both have setBalance equivalent", async () => {
			const { hardhat, anvil } = await import("../../src/jsonrpc/index.js");

			const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
			const value = "0xde0b6b3a7640000";

			const hardhatReq = hardhat.hardhat_setBalance(address, value);
			const anvilReq = anvil.anvil_setBalance(address, value);

			expect(hardhatReq.method).toBe("hardhat_setBalance");
			expect(anvilReq.method).toBe("anvil_setBalance");
			expect(hardhatReq.params).toEqual(anvilReq.params);
		});

		it("both have setCode equivalent", async () => {
			const { hardhat, anvil } = await import("../../src/jsonrpc/index.js");

			const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
			const code = "0x6080604052";

			const hardhatReq = hardhat.hardhat_setCode(address, code);
			const anvilReq = anvil.anvil_setCode(address, code);

			expect(hardhatReq.method).toBe("hardhat_setCode");
			expect(anvilReq.method).toBe("anvil_setCode");
			expect(hardhatReq.params).toEqual(anvilReq.params);
		});

		it("both have impersonation equivalent", async () => {
			const { hardhat, anvil } = await import("../../src/jsonrpc/index.js");

			const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

			const hardhatReq = hardhat.hardhat_impersonateAccount(address);
			const anvilReq = anvil.anvil_impersonateAccount(address);

			expect(hardhatReq.method).toBe("hardhat_impersonateAccount");
			expect(anvilReq.method).toBe("anvil_impersonateAccount");
		});
	});
});
