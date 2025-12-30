/**
 * Tests for docs/jsonrpc-provider/anvil-methods.mdx
 *
 * Tests the Anvil Methods documentation for Foundry testing methods.
 * Tests the evm_ and anvil_ namespace methods.
 */
import { describe, expect, it } from "vitest";

describe("Anvil Methods Documentation", () => {
	describe("Snapshot/Revert", () => {
		it("creates evm_snapshot request", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.evm_snapshot();

			expect(request.method).toBe("evm_snapshot");
			expect(request.params).toEqual([]);
		});

		it("creates evm_revert request", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.evm_revert("0x1");

			expect(request.method).toBe("evm_revert");
			expect(request.params).toEqual(["0x1"]);
		});
	});

	describe("Time Manipulation", () => {
		it("creates evm_mine request with no params", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.evm_mine();

			expect(request.method).toBe("evm_mine");
			expect(request.params).toEqual([]);
		});

		it("creates evm_mine request with blocks", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.evm_mine(10);

			expect(request.method).toBe("evm_mine");
			expect(request.params).toEqual([10]);
		});

		it("creates evm_mine request with blocks and interval", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.evm_mine(10, 5);

			expect(request.method).toBe("evm_mine");
			expect(request.params).toEqual([10, 5]);
		});

		it("creates evm_increaseTime request", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.evm_increaseTime(3600);

			expect(request.method).toBe("evm_increaseTime");
			expect(request.params).toEqual([3600]);
		});

		it("creates evm_setNextBlockTimestamp request", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.evm_setNextBlockTimestamp(1700000000);

			expect(request.method).toBe("evm_setNextBlockTimestamp");
			expect(request.params).toEqual([1700000000]);
		});

		it("creates evm_setBlockGasLimit request", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.evm_setBlockGasLimit("0x1c9c380");

			expect(request.method).toBe("evm_setBlockGasLimit");
			expect(request.params).toEqual(["0x1c9c380"]);
		});
	});

	describe("Account Impersonation", () => {
		it("creates anvil_impersonateAccount request", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.anvil_impersonateAccount(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			expect(request.method).toBe("anvil_impersonateAccount");
			expect(request.params).toEqual([
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			]);
		});

		it("creates anvil_stopImpersonatingAccount request", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.anvil_stopImpersonatingAccount(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			);

			expect(request.method).toBe("anvil_stopImpersonatingAccount");
			expect(request.params).toEqual([
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			]);
		});
	});

	describe("State Manipulation", () => {
		it("creates anvil_setBalance request", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.anvil_setBalance(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
				"0xde0b6b3a7640000",
			);

			expect(request.method).toBe("anvil_setBalance");
			expect(request.params).toEqual([
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
				"0xde0b6b3a7640000",
			]);
		});

		it("creates anvil_setCode request", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.anvil_setCode(
				"0x5FbDB2315678afecb367f032d93F642f64180aa3",
				"0x6080604052",
			);

			expect(request.method).toBe("anvil_setCode");
			expect(request.params).toEqual([
				"0x5FbDB2315678afecb367f032d93F642f64180aa3",
				"0x6080604052",
			]);
		});

		it("creates anvil_setNonce request", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.anvil_setNonce(
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
				"0x10",
			);

			expect(request.method).toBe("anvil_setNonce");
			expect(request.params).toEqual([
				"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
				"0x10",
			]);
		});

		it("creates anvil_setStorageAt request", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.anvil_setStorageAt(
				"0x5FbDB2315678afecb367f032d93F642f64180aa3",
				"0x0",
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);

			expect(request.method).toBe("anvil_setStorageAt");
			expect(request.params).toEqual([
				"0x5FbDB2315678afecb367f032d93F642f64180aa3",
				"0x0",
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			]);
		});
	});

	describe("Mining Control", () => {
		it("creates evm_setAutomine request to enable", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.evm_setAutomine(true);

			expect(request.method).toBe("evm_setAutomine");
			expect(request.params).toEqual([true]);
		});

		it("creates evm_setAutomine request to disable", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.evm_setAutomine(false);

			expect(request.method).toBe("evm_setAutomine");
			expect(request.params).toEqual([false]);
		});

		it("creates evm_setIntervalMining request", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.evm_setIntervalMining(5);

			expect(request.method).toBe("evm_setIntervalMining");
			expect(request.params).toEqual([5]);
		});

		it("creates evm_setIntervalMining with 0 to disable", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const request = anvil.evm_setIntervalMining(0);

			expect(request.method).toBe("evm_setIntervalMining");
			expect(request.params).toEqual([0]);
		});
	});

	describe("Usage Patterns from Docs", () => {
		it("demonstrates snapshot/revert testing pattern", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			// Pattern from docs: save state, test, revert
			const snapshotReq = anvil.evm_snapshot();
			expect(snapshotReq.method).toBe("evm_snapshot");

			// ... perform test operations ...

			const revertReq = anvil.evm_revert("0x1");
			expect(revertReq.method).toBe("evm_revert");
		});

		it("demonstrates impersonation pattern", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			const whaleAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

			// Start impersonating
			const impersonateReq = anvil.anvil_impersonateAccount(whaleAddress);
			expect(impersonateReq.method).toBe("anvil_impersonateAccount");

			// ... perform actions as whale ...

			// Stop impersonating
			const stopReq = anvil.anvil_stopImpersonatingAccount(whaleAddress);
			expect(stopReq.method).toBe("anvil_stopImpersonatingAccount");
		});

		it("demonstrates time manipulation pattern", async () => {
			const { anvil } = await import("../../src/jsonrpc/index.js");

			// Advance time by 1 hour
			const increaseTimeReq = anvil.evm_increaseTime(3600);
			expect(increaseTimeReq.method).toBe("evm_increaseTime");

			// Mine a block to apply the time change
			const mineReq = anvil.evm_mine();
			expect(mineReq.method).toBe("evm_mine");
		});
	});
});
