/**
 * Tests for docs/jsonrpc-provider/eth-methods/blocks.mdx
 *
 * Tests the Block Methods documentation with 8 block-related methods.
 * Note: The docs indicate this page is a placeholder with AI-generated examples.
 */
import { describe, expect, it } from "vitest";

describe("Block Methods Documentation", () => {
	describe("eth_blockNumber", () => {
		it("creates request with no parameters", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.BlockNumberRequest();

			expect(request).toEqual({
				method: "eth_blockNumber",
			});
		});
	});

	describe("eth_getBlockByNumber", () => {
		it("creates request with latest block tag and full transactions", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.GetBlockByNumberRequest("latest", true);

			expect(request.method).toBe("eth_getBlockByNumber");
			expect(request.params?.[0]).toBe("latest");
			expect(request.params?.[1]).toBe(true);
		});

		it("creates request with block number and transaction hashes only", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.GetBlockByNumberRequest("0x112A880", false);

			expect(request.params?.[0]).toBe("0x112A880");
			expect(request.params?.[1]).toBe(false);
		});

		it("supports all block tags", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const tags = ["latest", "earliest", "pending", "safe", "finalized"];

			for (const tag of tags) {
				const request = Rpc.Eth.GetBlockByNumberRequest(tag, false);
				expect(request.params?.[0]).toBe(tag);
			}
		});
	});

	describe("eth_getBlockByHash", () => {
		it("creates request with block hash and full transactions", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const blockHash =
				"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35";
			const request = Rpc.Eth.GetBlockByHashRequest(blockHash, true);

			expect(request.method).toBe("eth_getBlockByHash");
			expect(request.params?.[0]).toBe(blockHash);
			expect(request.params?.[1]).toBe(true);
		});

		it("creates request with transaction hashes only", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const blockHash =
				"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35";
			const request = Rpc.Eth.GetBlockByHashRequest(blockHash, false);

			expect(request.params?.[1]).toBe(false);
		});
	});

	describe("eth_getBlockReceipts", () => {
		it("creates request with block tag", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.GetBlockReceiptsRequest("latest");

			expect(request.method).toBe("eth_getBlockReceipts");
			expect(request.params?.[0]).toBe("latest");
		});

		it("creates request with block number", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.GetBlockReceiptsRequest("0x112A880");

			expect(request.params?.[0]).toBe("0x112A880");
		});
	});

	describe("eth_getBlockTransactionCountByHash", () => {
		it("creates request with block hash", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const blockHash =
				"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35";
			const request = Rpc.Eth.GetBlockTransactionCountByHashRequest(blockHash);

			expect(request.method).toBe("eth_getBlockTransactionCountByHash");
			expect(request.params?.[0]).toBe(blockHash);
		});
	});

	describe("eth_getBlockTransactionCountByNumber", () => {
		it("creates request with block tag", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request =
				Rpc.Eth.GetBlockTransactionCountByNumberRequest("latest");

			expect(request.method).toBe("eth_getBlockTransactionCountByNumber");
			expect(request.params?.[0]).toBe("latest");
		});
	});

	describe("eth_getUncleCountByBlockHash", () => {
		it("creates request with block hash", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const blockHash =
				"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35";
			const request = Rpc.Eth.GetUncleCountByBlockHashRequest(blockHash);

			expect(request.method).toBe("eth_getUncleCountByBlockHash");
			expect(request.params?.[0]).toBe(blockHash);
		});
	});

	describe("eth_getUncleCountByBlockNumber", () => {
		it("creates request with block tag", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const request = Rpc.Eth.GetUncleCountByBlockNumberRequest("latest");

			expect(request.method).toBe("eth_getUncleCountByBlockNumber");
			expect(request.params?.[0]).toBe("latest");
		});
	});

	describe("Usage Patterns from Docs", () => {
		it("demonstrates getting latest block with transactions", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			// Pattern from docs
			const blockReq = Rpc.Eth.GetBlockByNumberRequest("latest", true);
			const receiptsReq = Rpc.Eth.GetBlockReceiptsRequest("latest");

			expect(blockReq.method).toBe("eth_getBlockByNumber");
			expect(receiptsReq.method).toBe("eth_getBlockReceipts");
		});

		it("demonstrates querying historical block", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			const blockNumber = "0x112A880"; // Block 18,000,000

			const blockReq = Rpc.Eth.GetBlockByNumberRequest(blockNumber, false);
			const txCountReq =
				Rpc.Eth.GetBlockTransactionCountByNumberRequest(blockNumber);

			expect(blockReq.params?.[0]).toBe(blockNumber);
			expect(txCountReq.params?.[0]).toBe(blockNumber);
		});

		it("demonstrates checking block finality", async () => {
			const { Rpc } = await import("../../../src/jsonrpc/index.js");

			// Pattern from docs - compare latest vs finalized
			const latestReq = Rpc.Eth.GetBlockByNumberRequest("latest", false);
			const finalizedReq = Rpc.Eth.GetBlockByNumberRequest("finalized", false);

			expect(latestReq.params?.[0]).toBe("latest");
			expect(finalizedReq.params?.[0]).toBe("finalized");
		});
	});
});
