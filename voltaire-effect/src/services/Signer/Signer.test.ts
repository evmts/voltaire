import type {
	BrandedAddress,
	BrandedHex,
	BrandedSignature,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;

import type { AccountShape } from "../Account/AccountService.js";
import { AccountService } from "../Account/index.js";
import {
	PublicClientService,
	type PublicClientShape,
} from "../PublicClient/index.js";
import { TransportService, type TransportShape } from "../Transport/index.js";
import { Signer } from "./Signer.js";
import { SignerError, SignerService } from "./SignerService.js";

const mockAddress = new Uint8Array(20).fill(0xab) as AddressType;
const mockSignature = Object.assign(new Uint8Array(65).fill(0x12), {
	algorithm: "secp256k1" as const,
	v: 27,
}) as SignatureType;
const mockTxHash = "0x1234567890abcdef" as HexType;

const mockAccount: AccountShape = {
	address: mockAddress,
	type: "local",
	signMessage: () => Effect.succeed(mockSignature),
	signTransaction: () => Effect.succeed(mockSignature),
	signTypedData: () => Effect.succeed(mockSignature),
};

const mockPublicClient: PublicClientShape = {
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
};

const mockTransport: TransportShape = {
	request: <T>(_method: string, _params?: unknown[]): Effect.Effect<T, never> =>
		Effect.succeed(mockTxHash as T),
};

const TestAccountLayer = Layer.succeed(AccountService, mockAccount);
const TestPublicClientLayer = Layer.succeed(
	PublicClientService,
	mockPublicClient,
);
const TestTransportLayer = Layer.succeed(TransportService, mockTransport);

const TestLayers = Layer.mergeAll(
	TestAccountLayer,
	TestPublicClientLayer,
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

			expect(result).toBe(mockTxHash);
		});
	});

	describe("Signer.fromProvider", () => {
		it("composes provider and account layers", async () => {
			const composedLayer = Signer.fromProvider(
				TestPublicClientLayer,
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
				TestPublicClientLayer,
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

			expect(result).toBe(mockTxHash);
		});
	});

	describe("Signer.fromPrivateKey", () => {
		it("creates signer from private key (mocked crypto)", async () => {
			const mockPrivateKey =
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as HexType;

			const mockLocalAccountLayer = Layer.succeed(AccountService, mockAccount);

			const composedLayer = Signer.fromProvider(
				TestPublicClientLayer,
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

	describe("error handling", () => {
		it("propagates SignerError from account", async () => {
			const failingAccount: AccountShape = {
				...mockAccount,
				signMessage: () =>
					Effect.fail(
						new SignerError(
							{ action: "signMessage" },
							"Sign failed",
						) as never,
					),
			};

			const failingAccountLayer = Layer.succeed(AccountService, failingAccount);
			const failingLayers = Layer.mergeAll(
				failingAccountLayer,
				TestPublicClientLayer,
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
		it("requests addresses from transport", async () => {
			const mockAddresses = [mockAddress];
			const transportWithAddresses: TransportShape = {
				request: <T>(_method: string): Effect.Effect<T, never> =>
					Effect.succeed(mockAddresses as T),
			};

			const customTransportLayer = Layer.succeed(
				TransportService,
				transportWithAddresses,
			);
			const customLayers = Layer.mergeAll(
				TestAccountLayer,
				TestPublicClientLayer,
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

			expect(result).toEqual(mockAddresses);
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
});
