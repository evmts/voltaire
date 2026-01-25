import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { BrandedAddress, BrandedHex, BrandedSignature } from "@tevm/voltaire";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;

import {
	WalletClientService,
	WalletClientError,
	type TransactionRequest,
} from "./WalletClientService.js";
import { WalletClientLive } from "./WalletClient.js";
import { AccountService } from "../Account/index.js";
import type { AccountShape } from "../Account/AccountService.js";
import {
	PublicClientService,
	type PublicClientShape,
} from "../PublicClient/index.js";
import {
	TransportService,
	type TransportShape,
} from "../Transport/index.js";

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
	getFeeHistory: () => Effect.succeed({ oldestBlock: "0x0", baseFeePerGas: [], gasUsedRatio: [] }),
};

const mockTransport: TransportShape = {
	request: <T>(_method: string, _params?: unknown[]): Effect.Effect<T, never> =>
		Effect.succeed(mockTxHash as T),
};

const TestAccountLayer = Layer.succeed(AccountService, mockAccount);
const TestPublicClientLayer = Layer.succeed(PublicClientService, mockPublicClient);
const TestTransportLayer = Layer.succeed(TransportService, mockTransport);

const TestLayers = Layer.mergeAll(
	TestAccountLayer,
	TestPublicClientLayer,
	TestTransportLayer,
);

const TestWalletClientLayer = Layer.provide(WalletClientLive, TestLayers);

describe("WalletClientService", () => {
	describe("signMessage", () => {
		it("signs a message and returns signature", async () => {
			const program = Effect.gen(function* () {
				const wallet = yield* WalletClientService;
				return yield* wallet.signMessage("0x48656c6c6f" as HexType);
			});

			const result = await Effect.runPromise(
				Effect.provide(program, TestWalletClientLayer),
			);

			expect(result).toBe(mockSignature);
		});
	});

	describe("signTransaction", () => {
		it("fills missing fields and signs transaction", async () => {
			const program = Effect.gen(function* () {
				const wallet = yield* WalletClientService;
				return yield* wallet.signTransaction({
					to: mockAddress,
					value: 1000000000000000000n,
				});
			});

			const result = await Effect.runPromise(
				Effect.provide(program, TestWalletClientLayer),
			);

			expect(typeof result).toBe("string");
			expect(result.startsWith("0x")).toBe(true);
		});

		it("uses provided nonce when specified", async () => {
			const program = Effect.gen(function* () {
				const wallet = yield* WalletClientService;
				return yield* wallet.signTransaction({
					to: mockAddress,
					value: 1000000000000000000n,
					nonce: 10n,
				});
			});

			const result = await Effect.runPromise(
				Effect.provide(program, TestWalletClientLayer),
			);

			expect(result.startsWith("0x")).toBe(true);
		});
	});

	describe("signTypedData", () => {
		it("signs EIP-712 typed data", async () => {
			const typedData = {
				types: {
					EIP712Domain: [
						{ name: "name", type: "string" },
						{ name: "version", type: "string" },
						{ name: "chainId", type: "uint256" },
					],
				},
				primaryType: "Message",
				domain: {
					name: "Test",
					version: "1",
					chainId: 1 as never,
				},
				message: { content: "Hello" },
			} as const;

			const program = Effect.gen(function* () {
				const wallet = yield* WalletClientService;
				return yield* wallet.signTypedData(typedData);
			});

			const result = await Effect.runPromise(
				Effect.provide(program, TestWalletClientLayer),
			);

			expect(result).toBe(mockSignature);
		});
	});

	describe("sendTransaction", () => {
		it("signs and sends transaction", async () => {
			const program = Effect.gen(function* () {
				const wallet = yield* WalletClientService;
				return yield* wallet.sendTransaction({
					to: mockAddress,
					value: 1000000000000000000n,
				});
			});

			const result = await Effect.runPromise(
				Effect.provide(program, TestWalletClientLayer),
			);

			expect(result).toBe(mockTxHash);
		});
	});

	describe("sendRawTransaction", () => {
		it("sends already-signed transaction", async () => {
			const signedTx = "0xf86c..." as HexType;

			const program = Effect.gen(function* () {
				const wallet = yield* WalletClientService;
				return yield* wallet.sendRawTransaction(signedTx);
			});

			const result = await Effect.runPromise(
				Effect.provide(program, TestWalletClientLayer),
			);

			expect(result).toBe(mockTxHash);
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
			const customWalletLayer = Layer.provide(WalletClientLive, customLayers);

			const program = Effect.gen(function* () {
				const wallet = yield* WalletClientService;
				return yield* wallet.requestAddresses();
			});

			const result = await Effect.runPromise(
				Effect.provide(program, customWalletLayer),
			);

			expect(result).toEqual(mockAddresses);
		});
	});

	describe("switchChain", () => {
		it("switches to a different chain", async () => {
			const program = Effect.gen(function* () {
				const wallet = yield* WalletClientService;
				yield* wallet.switchChain(137);
			});

			await expect(
				Effect.runPromise(Effect.provide(program, TestWalletClientLayer)),
			).resolves.not.toThrow();
		});
	});

	describe("error handling", () => {
		it("propagates WalletClientError from account", async () => {
			const failingAccount: AccountShape = {
				...mockAccount,
				signMessage: () =>
					Effect.fail(new WalletClientError({ action: 'signMessage' }, "Sign failed") as never),
			};

			const failingAccountLayer = Layer.succeed(AccountService, failingAccount);
			const failingLayers = Layer.mergeAll(
				failingAccountLayer,
				TestPublicClientLayer,
				TestTransportLayer,
			);
			const failingWalletLayer = Layer.provide(WalletClientLive, failingLayers);

			const program = Effect.gen(function* () {
				const wallet = yield* WalletClientService;
				return yield* wallet.signMessage("0x1234" as HexType);
			});

			const result = await Effect.runPromiseExit(
				Effect.provide(program, failingWalletLayer),
			);

			expect(result._tag).toBe("Failure");
		});
	});
});
