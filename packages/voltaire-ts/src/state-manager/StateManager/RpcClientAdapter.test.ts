import { describe, expect, it, vi } from "vitest";
import * as Address from "../../primitives/Address/index.js";
import type { Hex } from "../../primitives/Hex/HexType.js";
import type { Provider } from "../../provider/Provider.js";
import { MockRpcClient } from "../../provider/test-utils/MockRpcClient.js";
import { RpcClientAdapter } from "./RpcClientAdapter.js";

const ACCOUNT = Address.Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0");
const SLOT_0 =
	"0x0000000000000000000000000000000000000000000000000000000000000000" as Hex;
const SLOT_1 =
	"0x0000000000000000000000000000000000000000000000000000000000000001" as Hex;
const BLOCK_HASH = `0x${"ab".repeat(32)}` as Hex;

function createSpyProvider(
	impl: (args: { method: string; params?: unknown }) => Promise<unknown>,
) {
	const request = vi.fn(impl);
	const provider: Provider = {
		request,
		on: () => provider,
		removeListener: () => provider,
	};
	return { provider, request };
}

describe("RpcClientAdapter", () => {
	describe("constructor", () => {
		it("accepts default and custom timeout/retry options", () => {
			const mockRpc = new MockRpcClient();
			const defaultAdapter = new RpcClientAdapter({ provider: mockRpc });
			const customAdapter = new RpcClientAdapter({
				provider: mockRpc,
				timeout: 5000,
				retries: 5,
			});

			expect(defaultAdapter).toBeInstanceOf(RpcClientAdapter);
			expect(customAdapter).toBeInstanceOf(RpcClientAdapter);
		});
	});

	describe("getProof", () => {
		it("fetches and converts eth_getProof response via MockRpcClient", async () => {
			const mockRpc = new MockRpcClient();
			const storage = new Map<bigint, bigint>([
				[0n, 42n],
				[1n, 0xdeadbeefn],
			]);
			mockRpc.setAccount(Address.toHex(ACCOUNT), {
				balance: 123_456_789_000_000_000n,
				nonce: 9n,
				code: "0x6080604052",
				storage,
			});

			const adapter = new RpcClientAdapter({ provider: mockRpc });
			const proof = await adapter.getProof(
				ACCOUNT,
				[SLOT_0, SLOT_1],
				"0x112a880",
			);

			expect(proof.balance).toBe(123_456_789_000_000_000n);
			expect(proof.nonce).toBe(9n);
			expect(proof.codeHash).toMatch(/^0x[0-9a-f]{64}$/);
			expect(proof.storageRoot).toMatch(/^0x[0-9a-f]{64}$/);
			expect(proof.storageProof).toHaveLength(2);
			expect(proof.storageProof[0]).toEqual({
				key: SLOT_0,
				value: "0x2a",
				proof: [],
			});
			expect(proof.storageProof[1]).toEqual({
				key: SLOT_1,
				value: "0xdeadbeef",
				proof: [],
			});
		});

		it("forwards exact RPC arguments and preserves storage proof nodes", async () => {
			const { provider, request } = createSpyProvider(async () => ({
				nonce: "0x0",
				balance:
					"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
				codeHash: `0x${"11".repeat(32)}`,
				storageHash: `0x${"22".repeat(32)}`,
				storageProof: [
					{
						key: SLOT_0,
						value: "0x7",
						proof: ["0xf851", "0xa012"],
					},
				],
			}));

			const adapter = new RpcClientAdapter({ provider });
			const proof = await adapter.getProof(ACCOUNT, [SLOT_0], "latest");

			expect(request).toHaveBeenCalledWith({
				method: "eth_getProof",
				params: [Address.toHex(ACCOUNT), [SLOT_0], "latest"],
			});
			expect(proof.nonce).toBe(0n);
			expect(proof.balance).toBe((1n << 256n) - 1n);
			expect(proof.codeHash).toBe(`0x${"11".repeat(32)}`);
			expect(proof.storageRoot).toBe(`0x${"22".repeat(32)}`);
			expect(proof.storageProof).toEqual([
				{ key: SLOT_0, value: "0x7", proof: ["0xf851", "0xa012"] },
			]);
		});

		it("throws when eth_getProof returns null or non-object", async () => {
			const nullProvider = createSpyProvider(async () => null);
			const strProvider = createSpyProvider(async () => "invalid");

			await expect(
				new RpcClientAdapter({ provider: nullProvider.provider }).getProof(
					ACCOUNT,
					[],
					"latest",
				),
			).rejects.toThrow("Invalid eth_getProof response");

			await expect(
				new RpcClientAdapter({ provider: strProvider.provider }).getProof(
					ACCOUNT,
					[],
					"latest",
				),
			).rejects.toThrow("Invalid eth_getProof response");
		});
	});

	describe("getCode", () => {
		it("returns bytecode for contracts and 0x for EOAs", async () => {
			const mockRpc = new MockRpcClient();
			mockRpc.setAccount(Address.toHex(ACCOUNT), {
				code: "0x6080604052",
			});

			const adapter = new RpcClientAdapter({ provider: mockRpc });
			expect(await adapter.getCode(ACCOUNT, "latest")).toBe("0x6080604052");

			const eoa = Address.Address("0x0000000000000000000000000000000000000001");
			expect(await adapter.getCode(eoa, "latest")).toBe("0x");
		});

		it("throws when eth_getCode returns non-string", async () => {
			const { provider } = createSpyProvider(async () => ({ code: "0x" }));
			const adapter = new RpcClientAdapter({ provider });

			await expect(adapter.getCode(ACCOUNT, "latest")).rejects.toThrow(
				"Invalid eth_getCode response",
			);
		});
	});

	describe("getBlockByNumber", () => {
		it("converts bigint block numbers to hex and forwards fullTransactions flag", async () => {
			const { provider, request } = createSpyProvider(async () => ({
				number: "0x112a880",
			}));
			const adapter = new RpcClientAdapter({ provider });

			await adapter.getBlockByNumber(18000000n);
			expect(request).toHaveBeenLastCalledWith({
				method: "eth_getBlockByNumber",
				params: ["0x112a880", false],
			});

			await adapter.getBlockByNumber(0n, true);
			expect(request).toHaveBeenLastCalledWith({
				method: "eth_getBlockByNumber",
				params: ["0x0", true],
			});

			await adapter.getBlockByNumber("latest", true);
			expect(request).toHaveBeenLastCalledWith({
				method: "eth_getBlockByNumber",
				params: ["latest", true],
			});
		});

		it("returns formatted block or null from MockRpcClient", async () => {
			const mockRpc = new MockRpcClient();
			mockRpc.setBlock({
				number: 10n,
				hash: BLOCK_HASH,
				parentHash: `0x${"00".repeat(32)}`,
				timestamp: 1700000000n,
				gasLimit: 30_000_000n,
				gasUsed: 12_000_000n,
				baseFeePerGas: 1_000_000_000n,
				miner: Address.toHex(ACCOUNT),
				transactions: [],
			});

			const adapter = new RpcClientAdapter({ provider: mockRpc });
			const block = (await adapter.getBlockByNumber(10n)) as {
				number: string;
				hash: string;
			};
			expect(block.number).toBe("0xa");
			expect(block.hash).toBe(BLOCK_HASH);
			expect(await adapter.getBlockByNumber(999n)).toBeNull();
		});
	});

	describe("getBlockByHash", () => {
		it("passes hash and fullTransactions flag to provider", async () => {
			const { provider, request } = createSpyProvider(async () => ({
				hash: BLOCK_HASH,
			}));
			const adapter = new RpcClientAdapter({ provider });

			const res1 = await adapter.getBlockByHash(BLOCK_HASH);
			expect(res1).toEqual({ hash: BLOCK_HASH });
			expect(request).toHaveBeenLastCalledWith({
				method: "eth_getBlockByHash",
				params: [BLOCK_HASH, false],
			});

			await adapter.getBlockByHash(BLOCK_HASH, true);
			expect(request).toHaveBeenLastCalledWith({
				method: "eth_getBlockByHash",
				params: [BLOCK_HASH, true],
			});
		});
	});

	describe("getBlockNumber", () => {
		it("returns hex block number from provider", async () => {
			const mockRpc = new MockRpcClient();
			mockRpc.setBlock({
				number: 256n,
				hash: BLOCK_HASH,
				parentHash: `0x${"00".repeat(32)}`,
				timestamp: 1700000000n,
				gasLimit: 30_000_000n,
				gasUsed: 0n,
				miner: Address.toHex(ACCOUNT),
				transactions: [],
			});

			const adapter = new RpcClientAdapter({ provider: mockRpc });
			expect(await adapter.getBlockNumber()).toBe("0x100");
		});

		it("throws when eth_blockNumber returns non-string", async () => {
			const { provider } = createSpyProvider(async () => 256);
			const adapter = new RpcClientAdapter({ provider });

			await expect(adapter.getBlockNumber()).rejects.toThrow(
				"Invalid eth_blockNumber response",
			);
		});

		it("propagates underlying provider RPC errors", async () => {
			const { provider } = createSpyProvider(async () => {
				throw new Error("RPC timeout");
			});
			const adapter = new RpcClientAdapter({ provider });

			await expect(adapter.getBlockNumber()).rejects.toThrow("RPC timeout");
		});
	});
});
