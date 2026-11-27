import { describe, expect, it } from "vitest";
import { MockRpcClient } from "./MockRpcClient.js";

const ADDR_MIXED = "0xAbCdEf0123456789aBcDeF0123456789AbCdEf01";
const ADDR_LOWER = ADDR_MIXED.toLowerCase();
const BLOCK_0_HASH = `0x${"01".repeat(32)}`;
const BLOCK_10_HASH = `0x${"10".repeat(32)}`;
const BLOCK_20_HASH = `0x${"20".repeat(32)}`;
const MINER = "0x0000000000000000000000000000000000000009";

describe("MockRpcClient", () => {
	it("returns sensible defaults for unknown accounts and empty chain", async () => {
		const rpc = new MockRpcClient();

		expect(await rpc.request({ method: "eth_blockNumber" })).toBe("0x0");
		expect(await rpc.request({ method: "eth_chainId" })).toBe("0x1");
		expect(await rpc.request({ method: "net_version" })).toBe("1");
		expect(
			await rpc.request({ method: "eth_getBalance", params: [ADDR_MIXED] }),
		).toBe("0x0");
		expect(
			await rpc.request({
				method: "eth_getTransactionCount",
				params: [ADDR_MIXED],
			}),
		).toBe("0x0");
		expect(
			await rpc.request({ method: "eth_getCode", params: [ADDR_MIXED] }),
		).toBe("0x");
		expect(
			await rpc.request({
				method: "eth_getStorageAt",
				params: [ADDR_MIXED, "0x0"],
			}),
		).toBe(`0x${"00".repeat(32)}`);
	});

	it("stores and queries account state case-insensitively with partial updates", async () => {
		const rpc = new MockRpcClient();
		const storage = new Map<bigint, bigint>([
			[0n, 7n],
			[2n, 0x1234n],
		]);
		rpc.setAccount(ADDR_MIXED, {
			balance: 2_000_000_000_000_000_000n,
			nonce: 4n,
			code: "0x6080604052",
			storage,
		});

		// Partial update should preserve existing storage and code
		rpc.setAccount(ADDR_LOWER, { nonce: 5n });

		expect(
			await rpc.request({ method: "eth_getBalance", params: [ADDR_LOWER] }),
		).toBe("0x1bc16d674ec80000");
		expect(
			await rpc.request({
				method: "eth_getTransactionCount",
				params: [ADDR_MIXED],
			}),
		).toBe("0x5");
		expect(
			await rpc.request({ method: "eth_getCode", params: [ADDR_LOWER] }),
		).toBe("0x6080604052");
		expect(
			await rpc.request({
				method: "eth_getStorageAt",
				params: [ADDR_MIXED, "0x0"],
			}),
		).toBe(`0x${"0".repeat(63)}7`);
		expect(
			await rpc.request({
				method: "eth_getStorageAt",
				params: [ADDR_LOWER, "0x2"],
			}),
		).toBe(`0x${"0".repeat(60)}1234`);
	});

	it("tracks blocks by hash and number across latest, pending, earliest, and hex tags", async () => {
		const rpc = new MockRpcClient();
		rpc.setBlock({
			number: 0n,
			hash: BLOCK_0_HASH,
			parentHash: `0x${"00".repeat(32)}`,
			timestamp: 1_600_000_000n,
			gasLimit: 8_000_000n,
			gasUsed: 0n,
			miner: MINER,
			transactions: [],
		});
		rpc.setBlock({
			number: 20n,
			hash: BLOCK_20_HASH,
			parentHash: BLOCK_10_HASH,
			timestamp: 1_700_000_020n,
			gasLimit: 30_000_000n,
			gasUsed: 21_000n,
			baseFeePerGas: 15_000_000_000n,
			miner: MINER,
			transactions: ["0xabc"],
		});
		// Setting a lower block number should not decrease currentBlockNumber
		rpc.setBlock({
			number: 10n,
			hash: BLOCK_10_HASH,
			parentHash: BLOCK_0_HASH,
			timestamp: 1_700_000_010n,
			gasLimit: 30_000_000n,
			gasUsed: 0n,
			miner: MINER,
			transactions: [],
		});

		expect(await rpc.request({ method: "eth_blockNumber" })).toBe("0x14");

		const earliest = (await rpc.request({
			method: "eth_getBlockByNumber",
			params: ["earliest", false],
		})) as { hash: string; number: string; baseFeePerGas?: string };
		expect(earliest.hash).toBe(BLOCK_0_HASH);
		expect(earliest.number).toBe("0x0");
		expect(earliest.baseFeePerGas).toBeUndefined();

		const latest = (await rpc.request({
			method: "eth_getBlockByNumber",
			params: ["latest", false],
		})) as {
			hash: string;
			number: string;
			baseFeePerGas?: string;
			transactions: string[];
		};
		expect(latest.hash).toBe(BLOCK_20_HASH);
		expect(latest.number).toBe("0x14");
		expect(latest.baseFeePerGas).toBe("0x37e11d600");
		expect(latest.transactions).toEqual(["0xabc"]);

		const pending = (await rpc.request({
			method: "eth_getBlockByNumber",
			params: ["pending", false],
		})) as { hash: string };
		expect(pending.hash).toBe(BLOCK_20_HASH);

		const byHex = (await rpc.request({
			method: "eth_getBlockByNumber",
			params: ["0xa", false],
		})) as { hash: string };
		expect(byHex.hash).toBe(BLOCK_10_HASH);

		const byHash = (await rpc.request({
			method: "eth_getBlockByHash",
			params: [BLOCK_10_HASH, false],
		})) as { number: string };
		expect(byHash.number).toBe("0xa");

		expect(
			await rpc.request({
				method: "eth_getBlockByNumber",
				params: ["0x9999", false],
			}),
		).toBeNull();
		expect(
			await rpc.request({
				method: "eth_getBlockByHash",
				params: [`0x${"ff".repeat(32)}`, false],
			}),
		).toBeNull();
	});

	it("returns structured eth_getProof responses for populated and empty accounts", async () => {
		const rpc = new MockRpcClient();
		rpc.setAccount(ADDR_LOWER, {
			balance: 500n,
			nonce: 2n,
			storage: new Map([[1n, 99n]]),
		});

		const proof = (await rpc.request({
			method: "eth_getProof",
			params: [ADDR_MIXED, ["0x0", "0x1"], "latest"],
		})) as {
			address: string;
			balance: string;
			nonce: string;
			codeHash: string;
			storageHash: string;
			storageProof: Array<{ key: string; value: string; proof: unknown[] }>;
			accountProof: unknown[];
		};

		expect(proof.address).toBe(ADDR_LOWER);
		expect(proof.balance).toBe("0x1f4");
		expect(proof.nonce).toBe("0x2");
		expect(proof.storageProof).toEqual([
			{ key: "0x0", value: "0x0", proof: [] },
			{ key: "0x1", value: "0x63", proof: [] },
		]);
		expect(proof.accountProof).toEqual([]);

		const emptyProof = (await rpc.request({
			method: "eth_getProof",
			params: [MINER, ["0x0"], "latest"],
		})) as { balance: string; nonce: string };
		expect(emptyProof.balance).toBe("0x0");
		expect(emptyProof.nonce).toBe("0x0");
	});

	it("throws on unimplemented methods and supports EIP-1193 listener chaining", async () => {
		const rpc = new MockRpcClient();
		await expect(
			rpc.request({ method: "debug_traceTransaction", params: ["0x0"] }),
		).rejects.toThrow(
			"Mock RPC method not implemented: debug_traceTransaction",
		);

		expect(rpc.on()).toBe(rpc);
		expect(rpc.removeListener()).toBe(rpc);
	});
});
