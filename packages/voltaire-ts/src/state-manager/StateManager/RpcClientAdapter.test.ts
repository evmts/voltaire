import { describe, expect, it, vi } from "vitest";
import type { AddressType } from "../../primitives/Address/AddressType.js";
import * as Address from "../../primitives/Address/index.js";
import type { Hex } from "../../primitives/Hex/HexType.js";
import type { Provider } from "../../provider/Provider.js";
import { MockRpcClient } from "../../provider/test-utils/MockRpcClient.js";
import { RpcClientAdapter } from "./RpcClientAdapter.js";

const ADDR = Address.Address(
	"0x1111111111111111111111111111111111111111",
) as AddressType;
const BLOCK_HASH = `0x${"ab".repeat(32)}` as Hex;
const PARENT_HASH = `0x${"cd".repeat(32)}` as Hex;

function createPopulatedMockRpc(): MockRpcClient {
	const rpc = new MockRpcClient();
	const storage = new Map<bigint, bigint>([
		[0n, 42n],
		[1n, 0xdeadbeefn],
	]);
	rpc.setAccount("0x1111111111111111111111111111111111111111", {
		balance: 1_500_000_000_000_000_000n,
		nonce: 7n,
		code: "0x6080604052",
		storage,
	});
	rpc.setBlock({
		number: 18_500_000n,
		hash: BLOCK_HASH,
		parentHash: PARENT_HASH,
		timestamp: 1_700_000_000n,
		gasLimit: 30_000_000n,
		gasUsed: 15_000_000n,
		baseFeePerGas: 25_000_000_000n,
		miner: "0x0000000000000000000000000000000000000001",
		transactions: [],
	});
	return rpc;
}

describe("RpcClientAdapter", () => {
	it("fetches and converts eth_getProof responses into typed EthProof", async () => {
		const rpc = createPopulatedMockRpc();
		const adapter = new RpcClientAdapter({
			provider: rpc,
			timeout: 15_000,
			retries: 2,
		});

		const proof = await adapter.getProof(
			ADDR,
			["0x0" as Hex, "0x1" as Hex],
			"0x11a49a0",
		);

		expect(proof.balance).toBe(1_500_000_000_000_000_000n);
		expect(proof.nonce).toBe(7n);
		expect(proof.codeHash).toMatch(/^0x[0-9a-f]{64}$/);
		expect(proof.storageRoot).toMatch(/^0x[0-9a-f]{64}$/);
		expect(proof.storageProof).toEqual([
			{ key: "0x0", value: "0x2a", proof: [] },
			{ key: "0x1", value: "0xdeadbeef", proof: [] },
		]);
	});

	it("throws on malformed eth_getProof responses", async () => {
		const badProvider: Provider = {
			request: vi.fn(async () => null),
			on: vi.fn(() => badProvider),
			removeListener: vi.fn(() => badProvider),
		};
		const adapter = new RpcClientAdapter({ provider: badProvider });

		await expect(adapter.getProof(ADDR, [], "latest")).rejects.toThrow(
			"Invalid eth_getProof response",
		);
	});

	it("fetches contract code and rejects non-string responses", async () => {
		const rpc = createPopulatedMockRpc();
		const adapter = new RpcClientAdapter({ provider: rpc });

		expect(await adapter.getCode(ADDR, "latest")).toBe("0x6080604052");

		const eoa = Address.Address(
			"0x2222222222222222222222222222222222222222",
		) as AddressType;
		expect(await adapter.getCode(eoa, "latest")).toBe("0x");

		const badProvider: Provider = {
			request: vi.fn(async () => ({ bad: true })),
			on: vi.fn(() => badProvider),
			removeListener: vi.fn(() => badProvider),
		};
		const badAdapter = new RpcClientAdapter({ provider: badProvider });
		await expect(badAdapter.getCode(ADDR, "latest")).rejects.toThrow(
			"Invalid eth_getCode response",
		);
	});

	it("fetches blocks by bigint number, string tag, and hash", async () => {
		const rpc = createPopulatedMockRpc();
		const requestSpy = vi.spyOn(rpc, "request");
		const adapter = new RpcClientAdapter({ provider: rpc });

		const byBigInt = (await adapter.getBlockByNumber(18_500_000n)) as {
			hash: string;
			number: string;
		};
		expect(byBigInt.hash).toBe(BLOCK_HASH);
		expect(requestSpy).toHaveBeenCalledWith({
			method: "eth_getBlockByNumber",
			params: ["0x11a49a0", false],
		});

		const byTag = (await adapter.getBlockByNumber("latest", true)) as {
			hash: string;
		};
		expect(byTag.hash).toBe(BLOCK_HASH);
		expect(requestSpy).toHaveBeenCalledWith({
			method: "eth_getBlockByNumber",
			params: ["latest", true],
		});

		const byHash = (await adapter.getBlockByHash(BLOCK_HASH, true)) as {
			hash: string;
		};
		expect(byHash.hash).toBe(BLOCK_HASH);
		expect(requestSpy).toHaveBeenCalledWith({
			method: "eth_getBlockByHash",
			params: [BLOCK_HASH, true],
		});

		const missingHash = `0x${"ff".repeat(32)}` as Hex;
		expect(await adapter.getBlockByHash(missingHash)).toBeNull();
	});

	it("fetches latest block number and validates string return type", async () => {
		const rpc = createPopulatedMockRpc();
		const adapter = new RpcClientAdapter({ provider: rpc });

		expect(await adapter.getBlockNumber()).toBe("0x11a49a0");

		const badProvider: Provider = {
			request: vi.fn(async () => 12345),
			on: vi.fn(() => badProvider),
			removeListener: vi.fn(() => badProvider),
		};
		const badAdapter = new RpcClientAdapter({ provider: badProvider });
		await expect(badAdapter.getBlockNumber()).rejects.toThrow(
			"Invalid eth_blockNumber response",
		);
	});
});
