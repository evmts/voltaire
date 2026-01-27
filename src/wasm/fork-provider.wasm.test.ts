import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";
import { ForkProvider } from "../provider/ForkProvider.js";
import type { Provider } from "../provider/Provider.js";
import type { RequestArguments } from "../provider/types.js";
import { loadForkWasm } from "../native-loader/wasm.js";

const ZERO_32 = `0x${"00".repeat(32)}` as const;
const ZERO_BLOOM = `0x${"00".repeat(256)}` as const;

class MockEip1193Provider implements Provider {
	calls: RequestArguments[] = [];

	async request(args: RequestArguments): Promise<unknown> {
		this.calls.push(args);

		switch (args.method) {
			case "eth_getProof": {
				const [address, slots] = args.params as [string, string[], string];
				return {
					address,
					nonce: "0x1",
					balance: "0x1234",
					codeHash: ZERO_32,
					storageHash: ZERO_32,
					storageProof: [
						{
							key: slots?.[0] ?? "0x0",
							value: "0x2a",
							proof: [],
						},
					],
				};
			}
			case "eth_getCode": {
				return "0x60006000";
			}
			case "eth_getBlockByNumber": {
				return {
					number: "0x1",
					hash: `0x${"11".repeat(32)}`,
					parentHash: ZERO_32,
					sha3Uncles: ZERO_32,
					miner: "0x0000000000000000000000000000000000000000",
					stateRoot: ZERO_32,
					transactionsRoot: ZERO_32,
					receiptsRoot: ZERO_32,
					logsBloom: ZERO_BLOOM,
					difficulty: "0x1",
					gasLimit: "0x5208",
					gasUsed: "0x5208",
					timestamp: "0x5",
					extraData: "0x",
					mixHash: ZERO_32,
					nonce: "0x0000000000000000",
					baseFeePerGas: "0x1",
					size: "0x1",
					totalDifficulty: "0x1",
					transactions: [],
					uncles: [],
				};
			}
			case "eth_getBlockByHash": {
				return null;
			}
			default:
				throw new Error(`Unexpected method: ${args.method}`);
		}
	}

	on(..._args: unknown[]): this {
		return this;
	}

	removeListener(..._args: unknown[]): this {
		return this;
	}
}

const toArrayBuffer = (buffer: Buffer): ArrayBuffer =>
	buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

const execFileAsync = promisify(execFile);

describe("ForkProvider (WASM)", () => {
	const repoRoot = resolve(import.meta.dirname, "../..");
	const stateManagerPath = resolve(repoRoot, "wasm/state-manager.wasm");
	const blockchainPath = resolve(repoRoot, "wasm/blockchain.wasm");

	const ensureForkWasm = async () => {
		if (existsSync(stateManagerPath) && existsSync(blockchainPath)) {
			return;
		}

		await execFileAsync("zig", ["build", "build-ts-wasm"], { cwd: repoRoot });

		if (!existsSync(stateManagerPath) || !existsSync(blockchainPath)) {
			throw new Error(
				"Missing fork WASM artifacts after zig build build-ts-wasm",
			);
		}
	};

	beforeAll(async () => {
		await ensureForkWasm();
	});

	it("reads forked state and blocks via injected EIP-1193 provider", async () => {

		const [stateManagerBytes, blockchainBytes] = await Promise.all([
			readFile(stateManagerPath),
			readFile(blockchainPath),
		]);

		const ffi = await loadForkWasm({
			stateManagerWasm: toArrayBuffer(stateManagerBytes),
			blockchainWasm: toArrayBuffer(blockchainBytes),
		});

		const mockProvider = new MockEip1193Provider();
		const provider = new ForkProvider({
			fork: {
				forkUrl: "http://example.invalid",
				forkBlockNumber: 1n,
				maxCacheSize: 64,
			},
			chainId: 1,
			rpcClient: mockProvider,
			ffi,
			useWasm: true,
		});

		const address = "0x0000000000000000000000000000000000000001";
		const balance = await provider.request({
			method: "eth_getBalance",
			params: [address, "latest"],
		});
		expect(balance).toBe("0x1234");

		const code = await provider.request({
			method: "eth_getCode",
			params: [address, "latest"],
		});
		expect(code).toBe("0x60006000");

		const storage = await provider.request({
			method: "eth_getStorageAt",
			params: [address, "0x0", "latest"],
		});
		expect(storage).toBe(`0x${"2a".padStart(64, "0")}`);

		const block = (await provider.request({
			method: "eth_getBlockByNumber",
			params: ["0x1", false],
		})) as { number: string; hash: string; parentHash: string };

		expect(block.number).toBe("0x1");
		expect(block.hash).toBe(`0x${"11".repeat(32)}`);
		expect(block.parentHash).toBe(ZERO_32);

		expect(mockProvider.calls.some((call) => call.method === "eth_getProof")).toBe(
			true,
		);
		expect(mockProvider.calls.some((call) => call.method === "eth_getCode")).toBe(
			true,
		);
		expect(
			mockProvider.calls.some((call) => call.method === "eth_getBlockByNumber"),
		).toBe(true);
	});
});
