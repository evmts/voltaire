import { describe, expect, it, vi } from "vitest";
import type { BrandedHost } from "../evm/Host/HostType.js";
import * as Address from "../primitives/Address/index.js";
import { fromEvm } from "./fromEvm.js";

const ADDR_1 = "0x1111111111111111111111111111111111111111";
const ADDR_2 = "0x2222222222222222222222222222222222222222";
const COINBASE = "0xAbCdEf0123456789aBcDeF0123456789AbCdEf01";

function createMockHost(): BrandedHost {
	const balances = new Map<string, bigint>([
		[ADDR_1, 3_000_000_000_000_000_000n],
	]);
	const nonces = new Map<string, bigint>([[ADDR_1, 7n]]);
	const codes = new Map<string, Uint8Array>([
		[ADDR_2, new Uint8Array([0x60, 0x00, 0x60, 0x00, 0xf3])],
	]);

	return {
		getBalance: vi.fn((addr) => balances.get(Address.toHex(addr)) ?? 0n),
		setBalance: vi.fn((addr, val) => {
			balances.set(Address.toHex(addr), val);
		}),
		getCode: vi.fn(
			(addr) => codes.get(Address.toHex(addr)) ?? new Uint8Array(0),
		),
		setCode: vi.fn((addr, code) => {
			codes.set(Address.toHex(addr), code);
		}),
		getStorage: vi.fn(() => 0n),
		setStorage: vi.fn(),
		getNonce: vi.fn((addr) => nonces.get(Address.toHex(addr)) ?? 0n),
		setNonce: vi.fn((addr, nonce) => {
			nonces.set(Address.toHex(addr), nonce);
		}),
		getTransientStorage: vi.fn(() => 0n),
		setTransientStorage: vi.fn(),
	} as unknown as BrandedHost;
}

describe("Provider.fromEvm", () => {
	it("accepts either a BrandedHost directly or a FromEvmOptions object", async () => {
		const host = createMockHost();
		const direct = fromEvm(host);
		expect(await direct.request({ method: "eth_chainId" })).toBe("0x1");
		expect(await direct.request({ method: "net_version" })).toBe("1");
		expect(await direct.request({ method: "web3_clientVersion" })).toBe(
			"Voltaire/Provider.fromEvm/0.1.0",
		);
		expect(await direct.request({ method: "eth_blockNumber" })).toBe("0x0");
		expect(await direct.request({ method: "eth_coinbase" })).toBe(
			"0x0000000000000000000000000000000000000000",
		);

		const configured = fromEvm({
			host,
			chainId: 10,
			startingBlockNumber: 42n,
			coinbase: COINBASE,
		});
		expect(await configured.request({ method: "eth_chainId" })).toBe("0xa");
		expect(await configured.request({ method: "net_version" })).toBe("10");
		expect(await configured.request({ method: "eth_blockNumber" })).toBe(
			"0x2a",
		);
		expect(await configured.request({ method: "eth_coinbase" })).toBe(
			COINBASE.toLowerCase(),
		);
	});

	it("delegates balance, code, and nonce queries to the underlying Host", async () => {
		const host = createMockHost();
		const provider = fromEvm({ host });

		expect(
			await provider.request({
				method: "eth_getBalance",
				params: [ADDR_1, "latest"],
			}),
		).toBe("0x29a2241af62c0000");

		expect(
			await provider.request({
				method: "eth_getTransactionCount",
				params: [ADDR_1, "latest"],
			}),
		).toBe("0x7");

		expect(
			await provider.request({
				method: "eth_getCode",
				params: [ADDR_2, "latest"],
			}),
		).toBe("0x60006000f3");

		expect(
			await provider.request({
				method: "eth_getCode",
				params: [ADDR_1, "latest"],
			}),
		).toBe("0x");
	});

	it("handles eth_call across missing target, EOA, and contract accounts", async () => {
		const host = createMockHost();
		const provider = fromEvm({ host });

		// Missing `to` (contract creation) returns empty 0x
		expect(
			await provider.request({
				method: "eth_call",
				params: [{ data: "0x6000" }, "latest"],
			}),
		).toBe("0x");

		// Calling EOA with no code returns 0x
		expect(
			await provider.request({
				method: "eth_call",
				params: [{ to: ADDR_1, data: "0x" }, "latest"],
			}),
		).toBe("0x");

		// Calling contract with code prepares a static frame cleanly
		expect(
			await provider.request({
				method: "eth_call",
				params: [
					{
						from: ADDR_1,
						to: ADDR_2,
						gas: "0x100000",
						value: "0x0",
						data: "0x1234",
					},
					"latest",
				],
			}),
		).toBe("0x");
	});

	it("estimates intrinsic gas for empty and calldata transactions", async () => {
		const provider = fromEvm(createMockHost());

		expect(
			await provider.request({
				method: "eth_estimateGas",
				params: [{}],
			}),
		).toBe(`0x${(21_000n).toString(16)}`);

		// 4 bytes of calldata => 21000 + 4 * 16 = 21064
		expect(
			await provider.request({
				method: "eth_estimateGas",
				params: [{ data: "0xaabbccdd" }],
			}),
		).toBe(`0x${(21_064n).toString(16)}`);
	});

	it("supports evm_mine, hardhat_reset, batch requests, events, and unsupported method errors", async () => {
		const provider = fromEvm({
			host: createMockHost(),
			startingBlockNumber: 5n,
		});

		expect(await provider.request({ method: "evm_mine" })).toBe("0x0");
		expect(await provider.request({ method: "eth_blockNumber" })).toBe("0x6");

		expect(
			await provider.request({
				method: "hardhat_reset",
				params: [{ forking: { blockNumber: 100 } }],
			}),
		).toBe(true);
		expect(await provider.request({ method: "eth_blockNumber" })).toBe("0x64");

		const batchResults = await provider.request([
			{ method: "eth_chainId" },
			{ method: "eth_blockNumber" },
		] as unknown as { method: string });
		expect(batchResults).toEqual(["0x1", "0x64"]);

		const onChainChanged = vi.fn();
		expect(provider.on("chainChanged", onChainChanged)).toBe(provider);
		expect(provider.removeListener("chainChanged", onChainChanged)).toBe(
			provider,
		);
		// Removing a non-registered listener is a safe no-op
		expect(provider.removeListener("accountsChanged", vi.fn())).toBe(provider);

		await expect(
			provider.request({ method: "eth_sendRawTransaction", params: ["0x"] }),
		).rejects.toThrow(
			"Provider.fromEvm: Unsupported method eth_sendRawTransaction",
		);
	});
});
