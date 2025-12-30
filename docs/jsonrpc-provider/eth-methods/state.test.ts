/**
 * Tests for docs/jsonrpc-provider/eth-methods/state.mdx
 *
 * Tests the State Query Methods documentation for eth_getBalance,
 * eth_getCode, eth_getStorageAt, and eth_getProof.
 * Note: The docs indicate this page is a placeholder with AI-generated examples.
 */
import { describe, expect, it } from "vitest";

describe("State Query Methods Documentation", () => {
	describe("eth_getBalance", () => {
		it("creates request with address and latest block", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const request = Rpc.Eth.GetBalanceRequest(address, "latest");

			expect(request.method).toBe("eth_getBalance");
			expect(request.params?.[0]).toBe(address);
			expect(request.params?.[1]).toBe("latest");
		});

		it("supports all block tags", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const tags = ["latest", "earliest", "pending", "safe", "finalized"];

			for (const tag of tags) {
				const request = Rpc.Eth.GetBalanceRequest(address, tag);
				expect(request.params?.[1]).toBe(tag);
			}
		});

		it("supports hex block number", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
			const blockNumber = "0x112A880";
			const request = Rpc.Eth.GetBalanceRequest(address, blockNumber);

			expect(request.params?.[1]).toBe(blockNumber);
		});
	});

	describe("eth_getCode", () => {
		it("creates request with contract address and block tag", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
			const request = Rpc.Eth.GetCodeRequest(address, "latest");

			expect(request.method).toBe("eth_getCode");
			expect(request.params?.[0]).toBe(address);
			expect(request.params?.[1]).toBe("latest");
		});
	});

	describe("eth_getStorageAt", () => {
		it("creates request with address, slot, and block tag", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
			const slot = "0x0";
			const request = Rpc.Eth.GetStorageAtRequest(address, slot, "latest");

			expect(request.method).toBe("eth_getStorageAt");
			expect(request.params?.[0]).toBe(address);
			expect(request.params?.[1]).toBe(slot);
			expect(request.params?.[2]).toBe("latest");
		});

		it("supports different storage slot formats", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

			// Slot 0
			const req0 = Rpc.Eth.GetStorageAtRequest(address, "0x0", "latest");
			expect(req0.params?.[1]).toBe("0x0");

			// Slot 1
			const req1 = Rpc.Eth.GetStorageAtRequest(address, "0x1", "latest");
			expect(req1.params?.[1]).toBe("0x1");

			// Large slot
			const largeSlot =
				"0x0000000000000000000000000000000000000000000000000000000000000005";
			const reqLarge = Rpc.Eth.GetStorageAtRequest(address, largeSlot, "latest");
			expect(reqLarge.params?.[1]).toBe(largeSlot);
		});
	});

	describe("eth_getProof", () => {
		it("creates request with address, storage keys, and block tag", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
			const storageKeys = ["0x0", "0x1"];
			const request = Rpc.Eth.GetProofRequest(address, storageKeys, "latest");

			expect(request.method).toBe("eth_getProof");
			expect(request.params?.[0]).toBe(address);
			expect(request.params?.[1]).toEqual(storageKeys);
			expect(request.params?.[2]).toBe("latest");
		});

		it("creates request with empty storage keys", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
			const request = Rpc.Eth.GetProofRequest(address, [], "latest");

			expect(request.params?.[1]).toEqual([]);
		});
	});

	describe("Usage Patterns from Docs", () => {
		it("demonstrates check account type pattern", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

			// Get both balance and code to determine account type
			const balanceReq = Rpc.Eth.GetBalanceRequest(address, "latest");
			const codeReq = Rpc.Eth.GetCodeRequest(address, "latest");

			expect(balanceReq.method).toBe("eth_getBalance");
			expect(codeReq.method).toBe("eth_getCode");

			// Pattern: if code !== '0x', it's a contract
		});

		it("demonstrates read contract state pattern", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const contractAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
			const slots = [0, 1, 2, 3, 4];

			// Create requests for multiple slots
			const requests = slots.map((slot) =>
				Rpc.Eth.GetStorageAtRequest(
					contractAddress,
					`0x${slot.toString(16)}`,
					"latest",
				),
			);

			expect(requests).toHaveLength(5);
			for (const req of requests) {
				expect(req.method).toBe("eth_getStorageAt");
			}
		});

		it("demonstrates verify state proof pattern", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

			// Get proof for account state
			const proofReq = Rpc.Eth.GetProofRequest(address, ["0x0"], "latest");
			expect(proofReq.method).toBe("eth_getProof");

			// Get block for state root comparison
			const blockReq = Rpc.Eth.GetBlockByNumberRequest("latest", false);
			expect(blockReq.method).toBe("eth_getBlockByNumber");
		});
	});
});
