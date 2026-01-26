import { describe, expect, it } from "@effect/vitest";
import {
	Address,
	type BrandedAddress,
	type BrandedHex,
	type BrandedSignature,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { AccountShape } from "../../Account/AccountService.js";
import { AccountService } from "../../Account/index.js";
import { ProviderService, type ProviderShape } from "../../Provider/index.js";
import { prepareAuthorization } from "./prepareAuthorization.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;

const mockAddress = new Uint8Array(20).fill(0xab) as AddressType;
const mockSignature = Object.assign(new Uint8Array(65).fill(0x12), {
	algorithm: "secp256k1" as const,
	v: 27,
}) as SignatureType;
const mockPublicKey = `0x04${"00".repeat(64)}` as HexType;

const mockAccount: AccountShape = {
	address: mockAddress,
	type: "local",
	publicKey: mockPublicKey,
	signMessage: () => Effect.succeed(mockSignature),
	sign: () => Effect.succeed(mockSignature),
	signTransaction: () => Effect.succeed(mockSignature),
	signTypedData: () => Effect.succeed(mockSignature),
	signAuthorization: () =>
		Effect.succeed({
			chainId: 1n,
			address: "0x1234567890123456789012345678901234567890",
			nonce: 5n,
			yParity: 0,
			r: `0x${"ab".repeat(32)}` as `0x${string}`,
			s: `0x${"cd".repeat(32)}` as `0x${string}`,
		}),
	clearKey: () => Effect.void,
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
	createEventFilter: () => Effect.succeed("0x1" as any),
	createBlockFilter: () => Effect.succeed("0x1" as any),
	createPendingTransactionFilter: () => Effect.succeed("0x1" as any),
	getFilterChanges: () => Effect.succeed([]),
	getFilterLogs: () => Effect.succeed([]),
	uninstallFilter: () => Effect.succeed(true),
	getChainId: () => Effect.succeed(1),
	getGasPrice: () => Effect.succeed(20000000000n),
	getMaxPriorityFeePerGas: () => Effect.succeed(1000000000n),
	getFeeHistory: () =>
		Effect.succeed({ oldestBlock: "0x0", baseFeePerGas: [], gasUsedRatio: [] }),
	sendRawTransaction: () => Effect.succeed("0x" as `0x${string}`),
	getUncle: () => Effect.succeed({} as any),
	getProof: () => Effect.succeed({} as any),
	getBlobBaseFee: () => Effect.succeed(0n),
	getTransactionConfirmations: () => Effect.succeed(0n),
	watchBlocks: () => {
		throw new Error("Not implemented in mock");
	},
	backfillBlocks: () => {
		throw new Error("Not implemented in mock");
	},
};

const TestAccountLayer = Layer.succeed(AccountService, mockAccount);
const TestProviderLayer = Layer.succeed(ProviderService, mockProvider);
const TestLayers = Layer.mergeAll(TestAccountLayer, TestProviderLayer);

describe("prepareAuthorization", () => {
	it("prepares authorization with fetched chain ID and nonce", async () => {
		const program = prepareAuthorization({
			contractAddress: "0x1234567890123456789012345678901234567890",
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayers));

		expect(result.chainId).toBe(1n);
		expect(result.nonce).toBe(5n);
		expect(result.address).toBe("0x1234567890123456789012345678901234567890");
	});

	it("uses provided chain ID", async () => {
		const program = prepareAuthorization({
			contractAddress: "0x1234567890123456789012345678901234567890",
			chainId: 137n,
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayers));

		expect(result.chainId).toBe(137n);
	});

	it("fetches nonce with pending block tag", async () => {
		let capturedBlockTag: string | undefined;

		const providerWithCapture: ProviderShape = {
			...mockProvider,
			getTransactionCount: (_address, blockTag) => {
				capturedBlockTag = blockTag as string;
				return Effect.succeed(10n);
			},
		};

		const customLayers = Layer.mergeAll(
			TestAccountLayer,
			Layer.succeed(ProviderService, providerWithCapture),
		);

		const program = prepareAuthorization({
			contractAddress: "0x1234567890123456789012345678901234567890",
		});

		const result = await Effect.runPromise(
			Effect.provide(program, customLayers),
		);

		expect(capturedBlockTag).toBe("pending");
		expect(result.nonce).toBe(10n);
	});

	it("uses provided nonce without fetching", async () => {
		let getNonceCalled = false;
		const providerWithCapture: ProviderShape = {
			...mockProvider,
			getTransactionCount: () => {
				getNonceCalled = true;
				return Effect.succeed(10n);
			},
		};

		const customLayers = Layer.mergeAll(
			TestAccountLayer,
			Layer.succeed(ProviderService, providerWithCapture),
		);

		const program = prepareAuthorization({
			contractAddress: "0x1234567890123456789012345678901234567890",
			nonce: 42n,
		});

		const result = await Effect.runPromise(
			Effect.provide(program, customLayers),
		);

		expect(result.nonce).toBe(42n);
		expect(getNonceCalled).toBe(false);
	});

	it("converts AddressType contract address to hex", async () => {
		const contractAddress = new Uint8Array(20).fill(0x12) as AddressType;

		const program = prepareAuthorization({ contractAddress });

		const result = await Effect.runPromise(Effect.provide(program, TestLayers));

		expect(Address.toHex(result.address as AddressType).toLowerCase()).toBe(
			"0x1212121212121212121212121212121212121212",
		);
	});

	it("handles provider errors", async () => {
		const { ProviderError } = await import("../../Provider/index.js");

		const providerWithError: ProviderShape = {
			...mockProvider,
			getChainId: () => Effect.fail(new ProviderError({}, "Network error")),
		};

		const customLayers = Layer.mergeAll(
			TestAccountLayer,
			Layer.succeed(ProviderService, providerWithError),
		);

		const program = prepareAuthorization({
			contractAddress: "0x1234567890123456789012345678901234567890",
		});

		const result = await Effect.runPromiseExit(
			Effect.provide(program, customLayers),
		);

		expect(result._tag).toBe("Failure");
	});
});
