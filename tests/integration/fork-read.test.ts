/**
 * Fork Read Integration Tests
 *
 * Validates Milestone 1 acceptance criteria with real Alchemy RPC:
 * 1. eth_getBalance - Read Vitalik's balance
 * 2. eth_getCode - Read USDC contract code
 * 3. eth_getStorageAt - Read USDC storage slot
 * 4. eth_blockNumber - Get current block number
 * 5. eth_getBlockByNumber - Fetch specific block
 *
 * Requires ALCHEMY_RPC environment variable.
 */

import { beforeAll, describe, expect, test } from "vitest";
import { HttpProvider } from "../../src/provider/HttpProvider.js";

// Test addresses and constants
const VITALIK = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const TEST_BLOCK = 18000000n;
const TEST_BLOCK_HEX = "0x112a880";

// Get Alchemy RPC URL from environment
const ALCHEMY_RPC =
	process.env.ALCHEMY_RPC ||
	process.env.ETHEREUM_RPC_URL ||
	process.env.TEVM_RPC_URLS_MAINNET ||
	(process.env.TEVM_TEST_ALCHEMY_KEY
		? `https://eth-mainnet.g.alchemy.com/v2/${process.env.TEVM_TEST_ALCHEMY_KEY}`
		: undefined);

describe("Fork Read Integration", () => {
	let provider: HttpProvider;

	// Skip all tests if no RPC URL provided
	beforeAll(() => {
		if (!ALCHEMY_RPC) {
			throw new Error(
				"ALCHEMY_RPC environment variable required. " +
					"Usage: ALCHEMY_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY pnpm test tests/integration/fork-read.test.ts",
			);
		}
		provider = new HttpProvider(ALCHEMY_RPC);
	});

	test.skipIf(!ALCHEMY_RPC)(
		"reads Vitalik balance from mainnet (eth_getBalance)",
		async () => {
			const balance = await provider.request({
				method: "eth_getBalance",
				params: [VITALIK, "latest"],
			});

			expect(balance).toBeDefined();
			expect(typeof balance).toBe("string");
			expect(balance).toMatch(/^0x[0-9a-fA-F]+$/);

			// Vitalik should have some balance
			const balanceBigInt = BigInt(balance as string);
			expect(balanceBigInt).toBeGreaterThan(0n);

			console.log(
				`  ✓ Vitalik balance: ${balanceBigInt.toString()} wei (${Number(balanceBigInt) / 1e18} ETH)`,
			);
		},
	);

	test.skipIf(!ALCHEMY_RPC)(
		"reads USDC contract code (eth_getCode)",
		async () => {
			const code = await provider.request({
				method: "eth_getCode",
				params: [USDC, "latest"],
			});

			expect(code).toBeDefined();
			expect(typeof code).toBe("string");
			expect(code).toMatch(/^0x[0-9a-fA-F]+$/);

			// USDC is a proxy with deployed code
			const codeStr = code as string;
			expect(codeStr.length).toBeGreaterThan(2); // More than just "0x"

			console.log(
				`  ✓ USDC code length: ${codeStr.length} chars (${(codeStr.length - 2) / 2} bytes)`,
			);
		},
	);

	test.skipIf(!ALCHEMY_RPC)(
		"reads USDC storage slot (eth_getStorageAt)",
		async () => {
			// Slot 0x1 in USDC proxy contains implementation address
			const storage = await provider.request({
				method: "eth_getStorageAt",
				params: [USDC, "0x1", "latest"],
			});

			expect(storage).toBeDefined();
			expect(typeof storage).toBe("string");
			expect(storage).toMatch(/^0x[0-9a-fA-F]{64}$/);

			// USDC proxy should have non-zero implementation address
			const storageValue = BigInt(storage as string);
			expect(storageValue).toBeGreaterThan(0n);

			console.log(
				`  ✓ USDC storage slot 0x1: ${storage} (implementation address)`,
			);
		},
	);

	test.skipIf(!ALCHEMY_RPC)(
		"gets current block number (eth_blockNumber)",
		async () => {
			const blockNumber = await provider.request({
				method: "eth_blockNumber",
				params: [],
			});

			expect(blockNumber).toBeDefined();
			expect(typeof blockNumber).toBe("string");
			expect(blockNumber).toMatch(/^0x[0-9a-fA-F]+$/);

			// Block number should be beyond block 18M
			const blockNum = BigInt(blockNumber as string);
			expect(blockNum).toBeGreaterThan(TEST_BLOCK);

			console.log(
				`  ✓ Current block number: ${blockNum.toString()} (${blockNumber})`,
			);
		},
	);

	test.skipIf(!ALCHEMY_RPC)(
		"fetches block 18000000 by number (eth_getBlockByNumber)",
		async () => {
			const block = await provider.request({
				method: "eth_getBlockByNumber",
				params: [TEST_BLOCK_HEX, false],
			});

			expect(block).toBeDefined();
			expect(typeof block).toBe("object");
			expect(block).not.toBeNull();

			const blockObj = block as {
				number: string;
				hash: string;
				timestamp: string;
				gasLimit: string;
				gasUsed: string;
			};

			// Validate block structure
			expect(blockObj.number).toBe(TEST_BLOCK_HEX);
			expect(blockObj.hash).toMatch(/^0x[0-9a-fA-F]{64}$/);
			expect(blockObj.timestamp).toMatch(/^0x[0-9a-fA-F]+$/);
			expect(blockObj.gasLimit).toMatch(/^0x[0-9a-fA-F]+$/);
			expect(blockObj.gasUsed).toMatch(/^0x[0-9a-fA-F]+$/);

			console.log(`  ✓ Block 18000000:`);
			console.log(`    Hash: ${blockObj.hash}`);
			console.log(
				`    Timestamp: ${BigInt(blockObj.timestamp).toString()} (${new Date(Number(BigInt(blockObj.timestamp)) * 1000).toISOString()})`,
			);
			console.log(
				`    Gas Used: ${BigInt(blockObj.gasUsed).toString()} / ${BigInt(blockObj.gasLimit).toString()}`,
			);
		},
	);

	test.skipIf(!ALCHEMY_RPC)(
		"milestone 1 complete - all 5 criteria passing",
		async () => {
			// Summary test that validates all criteria work together
			const results = await Promise.all([
				// 1. eth_getBalance
				provider
					.request({
						method: "eth_getBalance",
						params: [VITALIK, "latest"],
					})
					.then((balance) => ({
						method: "eth_getBalance",
						success:
							typeof balance === "string" && BigInt(balance as string) > 0n,
					})),

				// 2. eth_getCode
				provider
					.request({
						method: "eth_getCode",
						params: [USDC, "latest"],
					})
					.then((code) => ({
						method: "eth_getCode",
						success: typeof code === "string" && (code as string).length > 2,
					})),

				// 3. eth_getStorageAt
				provider
					.request({
						method: "eth_getStorageAt",
						params: [USDC, "0x1", "latest"],
					})
					.then((storage) => ({
						method: "eth_getStorageAt",
						success:
							typeof storage === "string" && BigInt(storage as string) > 0n,
					})),

				// 4. eth_blockNumber
				provider
					.request({
						method: "eth_blockNumber",
						params: [],
					})
					.then((blockNumber) => ({
						method: "eth_blockNumber",
						success:
							typeof blockNumber === "string" &&
							BigInt(blockNumber as string) > TEST_BLOCK,
					})),

				// 5. eth_getBlockByNumber
				provider
					.request({
						method: "eth_getBlockByNumber",
						params: [TEST_BLOCK_HEX, false],
					})
					.then((block) => ({
						method: "eth_getBlockByNumber",
						success:
							typeof block === "object" &&
							block !== null &&
							(block as { number: string }).number === TEST_BLOCK_HEX,
					})),
			]);

			// All criteria must pass
			results.forEach((result) => {
				expect(result.success).toBe(true);
			});

			const passedCount = results.filter((r) => r.success).length;
			console.log(`\n  🎉 Milestone 1: PASSED (${passedCount}/5 criteria)`);
			console.log("  ✅ Fork read operations working with real Alchemy RPC");
		},
	);
});
