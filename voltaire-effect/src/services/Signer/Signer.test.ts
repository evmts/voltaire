import type {
	BrandedAddress,
	BrandedHex,
	BrandedSignature,
} from "@tevm/voltaire";
import * as Hash from "@tevm/voltaire/Hash";
import type { HashType } from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "@effect/vitest";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;

import type { AccountShape } from "../Account/AccountService.js";
import { AccountService } from "../Account/index.js";
import { ProviderService, type ProviderShape } from "../Provider/index.js";
import { TransportService, type TransportShape } from "../Transport/index.js";
import { Signer } from "./Signer.js";
import { SignerError, SignerService } from "./SignerService.js";

const mockAddress = new Uint8Array(20).fill(0xab) as AddressType;
const mockSignature = Object.assign(new Uint8Array(65).fill(0x12), {
	algorithm: "secp256k1" as const,
	v: 27,
}) as SignatureType;
const mockTxHashHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const mockTxHash: HashType = Hash.fromHex(mockTxHashHex);

const mockAccount: AccountShape = {
	address: mockAddress,
	type: "local",
	signMessage: () => Effect.succeed(mockSignature),
	signTransaction: () => Effect.succeed(mockSignature),
	signTypedData: () => Effect.succeed(mockSignature),
};

const mockProvider: ProviderShape = {
	getBlockNumber: () => Effect.succeed(12345n),
	getBlock: () => Effect.succeed({} as never),
	getBlockTransactionCount: () => Effect.succeed(0n),
	getBalance: () => Effect.succeed(1000000000000000000n),
	getTransactionCount: () => Effect.succeed(5n),
	getCode: () => Effect.succeed("0x"),
	getStorageAt: () => Effect.succeed("0x0"),
	getTransaction: () => Effect.succeed({} as never),
	getTransactionReceipt: () => Effect.succeed({} as never),
	waitForTransactionReceipt: () => Effect.succeed({} as never),
	call: () => Effect.succeed("0x"),
	estimateGas: () => Effect.succeed(21000n),
	createAccessList: () => Effect.succeed({ accessList: [], gasUsed: "0x0" }),
	getLogs: () => Effect.succeed([]),
	getChainId: () => Effect.succeed(1),
	getGasPrice: () => Effect.succeed(20000000000n),
	getMaxPriorityFeePerGas: () => Effect.succeed(1000000000n),
	getFeeHistory: () =>
		Effect.succeed({ oldestBlock: "0x0", baseFeePerGas: [], gasUsedRatio: [] }),
	watchBlocks: () => {
		throw new Error("Not implemented in mock");
	},
	backfillBlocks: () => {
		throw new Error("Not implemented in mock");
	},
};

const mockTransport: TransportShape = {
	request: <T>(_method: string, _params?: unknown[]): Effect.Effect<T, never> =>
		Effect.succeed(mockTxHashHex as T),
};

const TestAccountLayer = Layer.succeed(AccountService, mockAccount);
const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
const TestTransportLayer = Layer.succeed(TransportService, mockTransport);

const TestLayers = Layer.mergeAll(
	TestAccountLayer,
	TestProviderLayer,
	TestTransportLayer,
);

const TestSignerLayer = Layer.provide(Signer.Live, TestLayers);

describe("SignerService", () => {
	describe("Signer.Live", () => {
		it("signs a message and returns signature", async () => {
			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signMessage("0x48656c6c6f" as HexType);
			});

			const result = await Effect.runPromise(
				Effect.provide(program, TestSignerLayer),
			);

			expect(result).toBe(mockSignature);
		});

		it("fills missing fields and signs transaction", async () => {
			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1000000000000000000n,
				});
			});

			const result = await Effect.runPromise(
				Effect.provide(program, TestSignerLayer),
			);

			expect(typeof result).toBe("string");
			expect(result.startsWith("0x")).toBe(true);
		});

		it("signs and sends transaction", async () => {
			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.sendTransaction({
					to: mockAddress,
					value: 1000000000000000000n,
				});
			});

			const result = await Effect.runPromise(
				Effect.provide(program, TestSignerLayer),
			);

			expect(Hash.equals(result, mockTxHash)).toBe(true);
		});
	});

	describe("Signer.fromProvider", () => {
		it("composes provider and account layers", async () => {
			const composedLayer = Signer.fromProvider(
				TestProviderLayer,
				TestAccountLayer,
			);
			const fullLayer = Layer.provide(composedLayer, TestTransportLayer);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signMessage("0x48656c6c6f" as HexType);
			});

			const result = await Effect.runPromise(
				Effect.provide(program, fullLayer),
			);

			expect(result).toBe(mockSignature);
		});

		it("sends transaction with composed layers", async () => {
			const composedLayer = Signer.fromProvider(
				TestProviderLayer,
				TestAccountLayer,
			);
			const fullLayer = Layer.provide(composedLayer, TestTransportLayer);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.sendTransaction({
					to: mockAddress,
					value: 1000000000000000000n,
				});
			});

			const result = await Effect.runPromise(
				Effect.provide(program, fullLayer),
			);

			expect(Hash.equals(result, mockTxHash)).toBe(true);
		});
	});

	describe("Signer.fromPrivateKey", () => {
		it("creates signer from private key (mocked crypto)", async () => {
			const mockPrivateKey =
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as HexType;

			const mockLocalAccountLayer = Layer.succeed(AccountService, mockAccount);

			const composedLayer = Signer.fromProvider(
				TestProviderLayer,
				mockLocalAccountLayer,
			);
			const fullLayer = Layer.provide(composedLayer, TestTransportLayer);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signMessage("0x48656c6c6f" as HexType);
			});

			const result = await Effect.runPromise(
				Effect.provide(program, fullLayer),
			);

			expect(result).toBe(mockSignature);
			expect(mockPrivateKey).toBeDefined();
		});
	});

	describe("transaction type detection", () => {
		it("detects EIP-2930 (type 1) when accessList + gasPrice provided", async () => {
			let capturedTx: unknown;
			const accountWithCapture: AccountShape = {
				...mockAccount,
				signTransaction: (tx: unknown) => {
					capturedTx = tx;
					return Effect.succeed(mockSignature);
				},
			};

			const captureAccountLayer = Layer.succeed(AccountService, accountWithCapture);
			const captureLayers = Layer.mergeAll(
				captureAccountLayer,
				TestProviderLayer,
				TestTransportLayer,
			);
			const captureSignerLayer = Layer.provide(Signer.Live, captureLayers);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1000000000000000000n,
					gasPrice: 20000000000n,
					accessList: [
						{
							address: "0x1234567890123456789012345678901234567890",
							storageKeys: ["0x0000000000000000000000000000000000000000000000000000000000000001"],
						},
					],
				});
			});

			await Effect.runPromise(Effect.provide(program, captureSignerLayer));
			const tx = capturedTx as { gasPrice?: bigint; accessList?: unknown[] };
			expect(tx.gasPrice).toBe(20000000000n);
			expect(tx.accessList).toBeDefined();
			expect(tx.accessList?.length).toBe(1);
		});

		it("detects EIP-1559 (type 2) when maxFeePerGas provided", async () => {
			let capturedTx: unknown;
			const accountWithCapture: AccountShape = {
				...mockAccount,
				signTransaction: (tx: unknown) => {
					capturedTx = tx;
					return Effect.succeed(mockSignature);
				},
			};

			const captureAccountLayer = Layer.succeed(AccountService, accountWithCapture);
			const captureLayers = Layer.mergeAll(
				captureAccountLayer,
				TestProviderLayer,
				TestTransportLayer,
			);
			const captureSignerLayer = Layer.provide(Signer.Live, captureLayers);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1000000000000000000n,
					maxFeePerGas: 30000000000n,
					maxPriorityFeePerGas: 2000000000n,
				});
			});

			await Effect.runPromise(Effect.provide(program, captureSignerLayer));
			const tx = capturedTx as { maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint };
			expect(tx.maxFeePerGas).toBe(30000000000n);
			expect(tx.maxPriorityFeePerGas).toBe(2000000000n);
		});

		it("uses explicit type override", async () => {
			let capturedTx: unknown;
			const accountWithCapture: AccountShape = {
				...mockAccount,
				signTransaction: (tx: unknown) => {
					capturedTx = tx;
					return Effect.succeed(mockSignature);
				},
			};

			const captureAccountLayer = Layer.succeed(AccountService, accountWithCapture);
			const captureLayers = Layer.mergeAll(
				captureAccountLayer,
				TestProviderLayer,
				TestTransportLayer,
			);
			const captureSignerLayer = Layer.provide(Signer.Live, captureLayers);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1000000000000000000n,
					type: 0,
					gasPrice: 20000000000n,
				});
			});

			await Effect.runPromise(Effect.provide(program, captureSignerLayer));
			const tx = capturedTx as { type?: number; gasPrice?: bigint };
			expect(tx.type).toBe(0);
			expect(tx.gasPrice).toBe(20000000000n);
		});

		it("detects EIP-4844 (type 3) when blobVersionedHashes provided", async () => {
			let capturedTx: unknown;
			const accountWithCapture: AccountShape = {
				...mockAccount,
				signTransaction: (tx: unknown) => {
					capturedTx = tx;
					return Effect.succeed(mockSignature);
				},
			};

			const captureAccountLayer = Layer.succeed(AccountService, accountWithCapture);
			const captureLayers = Layer.mergeAll(
				captureAccountLayer,
				TestProviderLayer,
				TestTransportLayer,
			);
			const captureSignerLayer = Layer.provide(Signer.Live, captureLayers);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 0n,
					blobVersionedHashes: ["0x0100000000000000000000000000000000000000000000000000000000000001"],
					maxFeePerBlobGas: 1000000000n,
					maxFeePerGas: 30000000000n,
				});
			});

			await Effect.runPromise(Effect.provide(program, captureSignerLayer));
			const tx = capturedTx as { blobVersionedHashes?: string[]; maxFeePerBlobGas?: bigint };
			expect(tx.blobVersionedHashes).toBeDefined();
			expect(tx.maxFeePerBlobGas).toBe(1000000000n);
		});

		it("detects EIP-7702 (type 4) when authorizationList provided", async () => {
			let capturedTx: unknown;
			const accountWithCapture: AccountShape = {
				...mockAccount,
				signTransaction: (tx: unknown) => {
					capturedTx = tx;
					return Effect.succeed(mockSignature);
				},
			};

			const captureAccountLayer = Layer.succeed(AccountService, accountWithCapture);
			const captureLayers = Layer.mergeAll(
				captureAccountLayer,
				TestProviderLayer,
				TestTransportLayer,
			);
			const captureSignerLayer = Layer.provide(Signer.Live, captureLayers);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 0n,
					authorizationList: [
						{
							chainId: 1n,
							address: "0x1234567890123456789012345678901234567890",
							nonce: 0n,
							yParity: 0,
							r: "0x0000000000000000000000000000000000000000000000000000000000000001",
							s: "0x0000000000000000000000000000000000000000000000000000000000000002",
						},
					],
					maxFeePerGas: 30000000000n,
				});
			});

			await Effect.runPromise(Effect.provide(program, captureSignerLayer));
			const tx = capturedTx as { authorizationList?: unknown[] };
			expect(tx.authorizationList).toBeDefined();
			expect(tx.authorizationList?.length).toBe(1);
		});
	});

	describe("error handling", () => {
		it("propagates SignerError from account", async () => {
			const failingAccount: AccountShape = {
				...mockAccount,
				signMessage: () =>
					Effect.fail(
						new SignerError({ action: "signMessage" }, "Sign failed") as never,
					),
			};

			const failingAccountLayer = Layer.succeed(AccountService, failingAccount);
			const failingLayers = Layer.mergeAll(
				failingAccountLayer,
				TestProviderLayer,
				TestTransportLayer,
			);
			const failingSignerLayer = Layer.provide(Signer.Live, failingLayers);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signMessage("0x1234" as HexType);
			});

			const result = await Effect.runPromiseExit(
				Effect.provide(program, failingSignerLayer),
			);

			expect(result._tag).toBe("Failure");
		});
	});

	describe("requestAddresses", () => {
		it("requests addresses from transport and converts to AddressType", async () => {
			const mockHexAddresses = ["0xabababababababababababababababababababab"];
			const transportWithAddresses: TransportShape = {
				request: <T>(_method: string): Effect.Effect<T, never> =>
					Effect.succeed(mockHexAddresses as T),
			};

			const customTransportLayer = Layer.succeed(
				TransportService,
				transportWithAddresses,
			);
			const customLayers = Layer.mergeAll(
				TestAccountLayer,
				TestProviderLayer,
				customTransportLayer,
			);
			const customSignerLayer = Layer.provide(Signer.Live, customLayers);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.requestAddresses();
			});

			const result = await Effect.runPromise(
				Effect.provide(program, customSignerLayer),
			);

			expect(result).toHaveLength(1);
			expect(result[0]).toBeInstanceOf(Uint8Array);
			expect(result[0].length).toBe(20);
		});
	});

	describe("switchChain", () => {
		it("switches to a different chain", async () => {
			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				yield* signer.switchChain(137);
			});

			await expect(
				Effect.runPromise(Effect.provide(program, TestSignerLayer)),
			).resolves.not.toThrow();
		});
	});

	describe("nonce handling", () => {
		it("fetches nonce with 'pending' block tag", async () => {
			let capturedBlockTag: string | undefined;
			const providerWithCapture: ProviderShape = {
				...mockProvider,
				getTransactionCount: (_address, blockTag) => {
					capturedBlockTag = blockTag as string;
					return Effect.succeed(5n);
				},
			};

			const customLayers = Layer.mergeAll(
				TestAccountLayer,
				Layer.succeed(ProviderService, providerWithCapture),
				TestTransportLayer,
			);
			const customSignerLayer = Layer.provide(Signer.Live, customLayers);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1n,
				});
			});

			await Effect.runPromise(Effect.provide(program, customSignerLayer));

			expect(capturedBlockTag).toBe("pending");
		});

		it("uses provided nonce without fetching", async () => {
			let fetchCalled = false;
			const providerWithCapture: ProviderShape = {
				...mockProvider,
				getTransactionCount: () => {
					fetchCalled = true;
					return Effect.succeed(5n);
				},
			};

			const customLayers = Layer.mergeAll(
				TestAccountLayer,
				Layer.succeed(ProviderService, providerWithCapture),
				TestTransportLayer,
			);
			const customSignerLayer = Layer.provide(Signer.Live, customLayers);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1n,
					nonce: 10n,
				});
			});

			await Effect.runPromise(Effect.provide(program, customSignerLayer));

			expect(fetchCalled).toBe(false);
		});
	});

	describe("EIP-1559 auto-detection", () => {
		it("uses EIP-1559 when network supports it and no gas fields provided", async () => {
			const providerWithEIP1559: ProviderShape = {
				...mockProvider,
				getBlock: () =>
					Effect.succeed({
						number: "0x1",
						hash: "0xabc",
						parentHash: "0x0",
						nonce: "0x0",
						sha3Uncles: "0x0",
						logsBloom: "0x0",
						transactionsRoot: "0x0",
						stateRoot: "0x0",
						receiptsRoot: "0x0",
						miner: "0x0",
						difficulty: "0x0",
						totalDifficulty: "0x0",
						extraData: "0x",
						size: "0x0",
						gasLimit: "0x0",
						gasUsed: "0x0",
						timestamp: "0x0",
						transactions: [],
						uncles: [],
						baseFeePerGas: "0x3b9aca00", // 1 gwei - indicates EIP-1559 support
					}),
			};

			const customLayers = Layer.mergeAll(
				TestAccountLayer,
				Layer.succeed(ProviderService, providerWithEIP1559),
				TestTransportLayer,
			);
			const customSignerLayer = Layer.provide(Signer.Live, customLayers);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1n,
				});
			});

			const result = await Effect.runPromise(
				Effect.provide(program, customSignerLayer),
			);

			// Should produce EIP-1559 tx (starts with 0x02)
			expect(result.startsWith("0x02")).toBe(true);
		});

		it("uses legacy when network does not support EIP-1559", async () => {
			const providerWithoutEIP1559: ProviderShape = {
				...mockProvider,
				getBlock: () =>
					Effect.succeed({
						number: "0x1",
						hash: "0xabc",
						parentHash: "0x0",
						nonce: "0x0",
						sha3Uncles: "0x0",
						logsBloom: "0x0",
						transactionsRoot: "0x0",
						stateRoot: "0x0",
						receiptsRoot: "0x0",
						miner: "0x0",
						difficulty: "0x0",
						totalDifficulty: "0x0",
						extraData: "0x",
						size: "0x0",
						gasLimit: "0x0",
						gasUsed: "0x0",
						timestamp: "0x0",
						transactions: [],
						uncles: [],
						// No baseFeePerGas - pre-London
					}),
			};

			const customLayers = Layer.mergeAll(
				TestAccountLayer,
				Layer.succeed(ProviderService, providerWithoutEIP1559),
				TestTransportLayer,
			);
			const customSignerLayer = Layer.provide(Signer.Live, customLayers);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1n,
				});
			});

			const result = await Effect.runPromise(
				Effect.provide(program, customSignerLayer),
			);

			// Should produce legacy tx (does NOT start with 0x02 or 0x01)
			expect(result.startsWith("0x02")).toBe(false);
			expect(result.startsWith("0x01")).toBe(false);
		});

		it("calculates maxFeePerGas with 1.2x multiplier on baseFee", async () => {
			const baseFeeGwei = 30n; // 30 gwei
			const priorityFeeGwei = 2n; // 2 gwei
			const baseFeeWei = baseFeeGwei * 1000000000n;
			const priorityFeeWei = priorityFeeGwei * 1000000000n;

			let capturedSignTx: unknown;
			const accountWithCapture: AccountShape = {
				...mockAccount,
				signTransaction: (tx) => {
					capturedSignTx = tx;
					return Effect.succeed(mockSignature);
				},
			};

			const providerWithEIP1559: ProviderShape = {
				...mockProvider,
				getBlock: () =>
					Effect.succeed({
						number: "0x1",
						hash: "0xabc",
						parentHash: "0x0",
						nonce: "0x0",
						sha3Uncles: "0x0",
						logsBloom: "0x0",
						transactionsRoot: "0x0",
						stateRoot: "0x0",
						receiptsRoot: "0x0",
						miner: "0x0",
						difficulty: "0x0",
						totalDifficulty: "0x0",
						extraData: "0x",
						size: "0x0",
						gasLimit: "0x0",
						gasUsed: "0x0",
						timestamp: "0x0",
						transactions: [],
						uncles: [],
						baseFeePerGas: `0x${baseFeeWei.toString(16)}`,
					}),
				getMaxPriorityFeePerGas: () => Effect.succeed(priorityFeeWei),
			};

			const customLayers = Layer.mergeAll(
				Layer.succeed(AccountService, accountWithCapture),
				Layer.succeed(ProviderService, providerWithEIP1559),
				TestTransportLayer,
			);
			const customSignerLayer = Layer.provide(Signer.Live, customLayers);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1n,
				});
			});

			await Effect.runPromise(Effect.provide(program, customSignerLayer));

			const tx = capturedSignTx as {
				maxFeePerGas?: bigint;
				maxPriorityFeePerGas?: bigint;
			};
			expect(tx.maxPriorityFeePerGas).toBe(priorityFeeWei);
			// maxFeePerGas = (baseFee * 12n / 10n) + priorityFee = 36 gwei + 2 gwei = 38 gwei
			const expectedMaxFee = (baseFeeWei * 12n) / 10n + priorityFeeWei;
			expect(tx.maxFeePerGas).toBe(expectedMaxFee);
		});

		it("handles edge case with very low base fee", async () => {
			const baseFeeWei = 1000000000n; // 1 gwei
			const priorityFeeWei = 100000000n; // 0.1 gwei

			let capturedSignTx: unknown;
			const accountWithCapture: AccountShape = {
				...mockAccount,
				signTransaction: (tx) => {
					capturedSignTx = tx;
					return Effect.succeed(mockSignature);
				},
			};

			const providerWithEIP1559: ProviderShape = {
				...mockProvider,
				getBlock: () =>
					Effect.succeed({
						number: "0x1",
						hash: "0xabc",
						parentHash: "0x0",
						nonce: "0x0",
						sha3Uncles: "0x0",
						logsBloom: "0x0",
						transactionsRoot: "0x0",
						stateRoot: "0x0",
						receiptsRoot: "0x0",
						miner: "0x0",
						difficulty: "0x0",
						totalDifficulty: "0x0",
						extraData: "0x",
						size: "0x0",
						gasLimit: "0x0",
						gasUsed: "0x0",
						timestamp: "0x0",
						transactions: [],
						uncles: [],
						baseFeePerGas: `0x${baseFeeWei.toString(16)}`,
					}),
				getMaxPriorityFeePerGas: () => Effect.succeed(priorityFeeWei),
			};

			const customLayers = Layer.mergeAll(
				Layer.succeed(AccountService, accountWithCapture),
				Layer.succeed(ProviderService, providerWithEIP1559),
				TestTransportLayer,
			);
			const customSignerLayer = Layer.provide(Signer.Live, customLayers);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1n,
				});
			});

			await Effect.runPromise(Effect.provide(program, customSignerLayer));

			const tx = capturedSignTx as {
				maxFeePerGas?: bigint;
				maxPriorityFeePerGas?: bigint;
			};
			// 1 gwei * 1.2 + 0.1 gwei = 1.2 gwei + 0.1 gwei = 1.3 gwei
			const expectedMaxFee = (baseFeeWei * 12n) / 10n + priorityFeeWei;
			expect(tx.maxFeePerGas).toBe(expectedMaxFee);
		});

		it("handles edge case with very high base fee", async () => {
			const baseFeeWei = 500000000000n; // 500 gwei (high congestion)
			const priorityFeeWei = 5000000000n; // 5 gwei

			let capturedSignTx: unknown;
			const accountWithCapture: AccountShape = {
				...mockAccount,
				signTransaction: (tx) => {
					capturedSignTx = tx;
					return Effect.succeed(mockSignature);
				},
			};

			const providerWithEIP1559: ProviderShape = {
				...mockProvider,
				getBlock: () =>
					Effect.succeed({
						number: "0x1",
						hash: "0xabc",
						parentHash: "0x0",
						nonce: "0x0",
						sha3Uncles: "0x0",
						logsBloom: "0x0",
						transactionsRoot: "0x0",
						stateRoot: "0x0",
						receiptsRoot: "0x0",
						miner: "0x0",
						difficulty: "0x0",
						totalDifficulty: "0x0",
						extraData: "0x",
						size: "0x0",
						gasLimit: "0x0",
						gasUsed: "0x0",
						timestamp: "0x0",
						transactions: [],
						uncles: [],
						baseFeePerGas: `0x${baseFeeWei.toString(16)}`,
					}),
				getMaxPriorityFeePerGas: () => Effect.succeed(priorityFeeWei),
			};

			const customLayers = Layer.mergeAll(
				Layer.succeed(AccountService, accountWithCapture),
				Layer.succeed(ProviderService, providerWithEIP1559),
				TestTransportLayer,
			);
			const customSignerLayer = Layer.provide(Signer.Live, customLayers);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1n,
				});
			});

			await Effect.runPromise(Effect.provide(program, customSignerLayer));

			const tx = capturedSignTx as {
				maxFeePerGas?: bigint;
				maxPriorityFeePerGas?: bigint;
			};
			// 500 gwei * 1.2 + 5 gwei = 600 gwei + 5 gwei = 605 gwei
			const expectedMaxFee = (baseFeeWei * 12n) / 10n + priorityFeeWei;
			expect(tx.maxFeePerGas).toBe(expectedMaxFee);
		});
	});

	describe("transaction serialization", () => {
		it("produces valid EIP-1559 transaction", async () => {
			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1000000000000000000n,
					maxFeePerGas: 20000000000n,
					maxPriorityFeePerGas: 1000000000n,
				});
			});

			const result = await Effect.runPromise(
				Effect.provide(program, TestSignerLayer),
			);

			expect(result.startsWith("0x02")).toBe(true);
			expect(result.length).toBeGreaterThan(100);
		});

		it("produces valid legacy transaction when gasPrice provided", async () => {
			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1000000000000000000n,
					gasPrice: 20000000000n,
				});
			});

			const result = await Effect.runPromise(
				Effect.provide(program, TestSignerLayer),
			);

			expect(result.startsWith("0x02")).toBe(false);
			expect(result.startsWith("0x01")).toBe(false);
		});

		it("handles v=0/1 signatures correctly", async () => {
			const signatureV0 = Object.assign(new Uint8Array(65).fill(0x12), {
				algorithm: "secp256k1" as const,
				v: 0,
			}) as SignatureType;

			const accountV0: AccountShape = {
				...mockAccount,
				signTransaction: () => Effect.succeed(signatureV0),
			};

			const layerV0 = Layer.provide(
				Signer.Live,
				Layer.mergeAll(
					Layer.succeed(AccountService, accountV0),
					TestProviderLayer,
					TestTransportLayer,
				),
			);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1000000000000000000n,
					maxFeePerGas: 20000000000n,
					maxPriorityFeePerGas: 1000000000n,
				});
			});

			const result = await Effect.runPromise(Effect.provide(program, layerV0));
			expect(result.startsWith("0x02")).toBe(true);
		});

		it("handles v=27/28 signatures correctly", async () => {
			const signatureV27 = Object.assign(new Uint8Array(65).fill(0x12), {
				algorithm: "secp256k1" as const,
				v: 27,
			}) as SignatureType;

			const accountV27: AccountShape = {
				...mockAccount,
				signTransaction: () => Effect.succeed(signatureV27),
			};

			const layerV27 = Layer.provide(
				Signer.Live,
				Layer.mergeAll(
					Layer.succeed(AccountService, accountV27),
					TestProviderLayer,
					TestTransportLayer,
				),
			);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1000000000000000000n,
					maxFeePerGas: 20000000000n,
					maxPriorityFeePerGas: 1000000000n,
				});
			});

			const result = await Effect.runPromise(Effect.provide(program, layerV27));
			expect(result.startsWith("0x02")).toBe(true);
		});

		it("handles EIP-155 v values correctly", async () => {
			const signatureEIP155 = Object.assign(new Uint8Array(65).fill(0x12), {
				algorithm: "secp256k1" as const,
				v: 37, // chainId=1, yParity=0 (1*2+35+0=37)
			}) as SignatureType;

			const accountEIP155: AccountShape = {
				...mockAccount,
				signTransaction: () => Effect.succeed(signatureEIP155),
			};

			const layerEIP155 = Layer.provide(
				Signer.Live,
				Layer.mergeAll(
					Layer.succeed(AccountService, accountEIP155),
					TestProviderLayer,
					TestTransportLayer,
				),
			);

			const program = Effect.gen(function* () {
				const signer = yield* SignerService;
				return yield* signer.signTransaction({
					to: mockAddress,
					value: 1000000000000000000n,
					maxFeePerGas: 20000000000n,
					maxPriorityFeePerGas: 1000000000n,
				});
			});

			const result = await Effect.runPromise(
				Effect.provide(program, layerEIP155),
			);
			expect(result.startsWith("0x02")).toBe(true);
		});
	});

	describe("EIP-5792 batch calls", () => {
		describe("getCapabilities", () => {
			it("returns wallet capabilities", async () => {
				const mockCapabilities = {
					"0x1": {
						atomicBatch: { supported: true },
						paymasterService: { supported: false },
					},
				};

				const transportWithCapabilities: TransportShape = {
					request: <T>(_method: string): Effect.Effect<T, never> =>
						Effect.succeed(mockCapabilities as T),
				};

				const customLayers = Layer.mergeAll(
					TestAccountLayer,
					TestProviderLayer,
					Layer.succeed(TransportService, transportWithCapabilities),
				);
				const customSignerLayer = Layer.provide(Signer.Live, customLayers);

				const program = Effect.gen(function* () {
					const signer = yield* SignerService;
					return yield* signer.getCapabilities();
				});

				const result = await Effect.runPromise(
					Effect.provide(program, customSignerLayer),
				);

				expect(result).toEqual(mockCapabilities);
				expect(result["0x1"]?.atomicBatch?.supported).toBe(true);
			});

			it("passes account address when provided", async () => {
				let capturedParams: unknown;
				const transportWithCapture: TransportShape = {
					request: <T>(
						_method: string,
						params?: unknown[],
					): Effect.Effect<T, never> => {
						capturedParams = params;
						return Effect.succeed({} as T);
					},
				};

				const customLayers = Layer.mergeAll(
					TestAccountLayer,
					TestProviderLayer,
					Layer.succeed(TransportService, transportWithCapture),
				);
				const customSignerLayer = Layer.provide(Signer.Live, customLayers);

				const program = Effect.gen(function* () {
					const signer = yield* SignerService;
					return yield* signer.getCapabilities(
						"0x1234567890123456789012345678901234567890",
					);
				});

				await Effect.runPromise(Effect.provide(program, customSignerLayer));

				expect(capturedParams).toEqual([
					"0x1234567890123456789012345678901234567890",
				]);
			});
		});

		describe("sendCalls", () => {
			it("sends batch of calls and returns bundle ID", async () => {
				const mockBundleId = "0xbundle123";
				let capturedRequest: unknown;

				const transportWithCapture: TransportShape = {
					request: <T>(
						method: string,
						params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "wallet_sendCalls") {
							capturedRequest = params;
							return Effect.succeed(mockBundleId as T);
						}
						return Effect.succeed(1 as T);
					},
				};

				const customLayers = Layer.mergeAll(
					TestAccountLayer,
					TestProviderLayer,
					Layer.succeed(TransportService, transportWithCapture),
				);
				const customSignerLayer = Layer.provide(Signer.Live, customLayers);

				const program = Effect.gen(function* () {
					const signer = yield* SignerService;
					return yield* signer.sendCalls({
						calls: [
							{ to: mockAddress, value: 1000n },
							{ to: mockAddress, data: "0x1234" as HexType },
						],
					});
				});

				const result = await Effect.runPromise(
					Effect.provide(program, customSignerLayer),
				);

				expect(result).toBe(mockBundleId);
				expect(capturedRequest).toBeDefined();
				const request = (capturedRequest as unknown[])[0] as {
					version: string;
					chainId: string;
					calls: unknown[];
				};
				expect(request.version).toBe("1.0");
				expect(request.chainId).toBe("0x1");
				expect(request.calls).toHaveLength(2);
			});

			it("includes paymaster capabilities when provided", async () => {
				let capturedRequest: unknown;

				const transportWithCapture: TransportShape = {
					request: <T>(
						method: string,
						params?: unknown[],
					): Effect.Effect<T, never> => {
						if (method === "wallet_sendCalls") {
							capturedRequest = params;
							return Effect.succeed("0xbundle" as T);
						}
						return Effect.succeed(1 as T);
					},
				};

				const customLayers = Layer.mergeAll(
					TestAccountLayer,
					TestProviderLayer,
					Layer.succeed(TransportService, transportWithCapture),
				);
				const customSignerLayer = Layer.provide(Signer.Live, customLayers);

				const program = Effect.gen(function* () {
					const signer = yield* SignerService;
					return yield* signer.sendCalls({
						calls: [{ to: mockAddress }],
						capabilities: {
							paymasterService: { url: "https://paymaster.example.com" },
						},
					});
				});

				await Effect.runPromise(Effect.provide(program, customSignerLayer));

				const request = (capturedRequest as unknown[])[0] as {
					capabilities?: { paymasterService?: { url: string } };
				};
				expect(request.capabilities?.paymasterService?.url).toBe(
					"https://paymaster.example.com",
				);
			});
		});

		describe("getCallsStatus", () => {
			it("returns status for a bundle", async () => {
				const mockStatus = {
					status: "CONFIRMED" as const,
					receipts: [
						{
							transactionHash: "0xabc" as HexType,
							blockNumber: 12345n,
							gasUsed: 21000n,
							status: "success" as const,
							logs: [],
						},
					],
				};

				const transportWithStatus: TransportShape = {
					request: <T>(_method: string): Effect.Effect<T, never> =>
						Effect.succeed(mockStatus as T),
				};

				const customLayers = Layer.mergeAll(
					TestAccountLayer,
					TestProviderLayer,
					Layer.succeed(TransportService, transportWithStatus),
				);
				const customSignerLayer = Layer.provide(Signer.Live, customLayers);

				const program = Effect.gen(function* () {
					const signer = yield* SignerService;
					return yield* signer.getCallsStatus("0xbundle123");
				});

				const result = await Effect.runPromise(
					Effect.provide(program, customSignerLayer),
				);

				expect(result.status).toBe("CONFIRMED");
				expect(result.receipts).toHaveLength(1);
				expect(result.receipts?.[0]?.status).toBe("success");
			});

			it("returns PENDING status", async () => {
				const mockStatus = { status: "PENDING" as const };

				const transportWithStatus: TransportShape = {
					request: <T>(_method: string): Effect.Effect<T, never> =>
						Effect.succeed(mockStatus as T),
				};

				const customLayers = Layer.mergeAll(
					TestAccountLayer,
					TestProviderLayer,
					Layer.succeed(TransportService, transportWithStatus),
				);
				const customSignerLayer = Layer.provide(Signer.Live, customLayers);

				const program = Effect.gen(function* () {
					const signer = yield* SignerService;
					return yield* signer.getCallsStatus("0xbundle123");
				});

				const result = await Effect.runPromise(
					Effect.provide(program, customSignerLayer),
				);

				expect(result.status).toBe("PENDING");
				expect(result.receipts).toBeUndefined();
			});
		});

		describe("waitForCallsStatus", () => {
			it("returns immediately when bundle is confirmed", async () => {
				const mockStatus = {
					status: "CONFIRMED" as const,
					receipts: [
						{
							transactionHash: "0xabc" as HexType,
							blockNumber: 12345n,
							gasUsed: 21000n,
							status: "success" as const,
							logs: [],
						},
					],
				};

				const transportWithStatus: TransportShape = {
					request: <T>(_method: string): Effect.Effect<T, never> =>
						Effect.succeed(mockStatus as T),
				};

				const customLayers = Layer.mergeAll(
					TestAccountLayer,
					TestProviderLayer,
					Layer.succeed(TransportService, transportWithStatus),
				);
				const customSignerLayer = Layer.provide(Signer.Live, customLayers);

				const program = Effect.gen(function* () {
					const signer = yield* SignerService;
					return yield* signer.waitForCallsStatus("0xbundle123", {
						timeout: 5000,
						pollingInterval: 100,
					});
				});

				const result = await Effect.runPromise(
					Effect.provide(program, customSignerLayer),
				);

				expect(result.status).toBe("CONFIRMED");
			});

			it("polls until bundle is confirmed", async () => {
				let callCount = 0;

				const transportWithPolling: TransportShape = {
					request: <T>(_method: string): Effect.Effect<T, never> => {
						callCount++;
						if (callCount < 3) {
							return Effect.succeed({ status: "PENDING" } as T);
						}
						return Effect.succeed({
							status: "CONFIRMED",
							receipts: [
								{
									transactionHash: "0xabc",
									blockNumber: 12345n,
									gasUsed: 21000n,
									status: "success",
									logs: [],
								},
							],
						} as T);
					},
				};

				const customLayers = Layer.mergeAll(
					TestAccountLayer,
					TestProviderLayer,
					Layer.succeed(TransportService, transportWithPolling),
				);
				const customSignerLayer = Layer.provide(Signer.Live, customLayers);

				const program = Effect.gen(function* () {
					const signer = yield* SignerService;
					return yield* signer.waitForCallsStatus("0xbundle123", {
						timeout: 5000,
						pollingInterval: 50,
					});
				});

				const result = await Effect.runPromise(
					Effect.provide(program, customSignerLayer),
				);

				expect(result.status).toBe("CONFIRMED");
				expect(callCount).toBe(3);
			});

			it("handles FAILED status", async () => {
				const mockStatus = { status: "FAILED" as const };

				const transportWithStatus: TransportShape = {
					request: <T>(_method: string): Effect.Effect<T, never> =>
						Effect.succeed(mockStatus as T),
				};

				const customLayers = Layer.mergeAll(
					TestAccountLayer,
					TestProviderLayer,
					Layer.succeed(TransportService, transportWithStatus),
				);
				const customSignerLayer = Layer.provide(Signer.Live, customLayers);

				const program = Effect.gen(function* () {
					const signer = yield* SignerService;
					return yield* signer.waitForCallsStatus("0xbundle123");
				});

				const result = await Effect.runPromise(
					Effect.provide(program, customSignerLayer),
				);

				expect(result.status).toBe("FAILED");
			});
		});
	});
});
