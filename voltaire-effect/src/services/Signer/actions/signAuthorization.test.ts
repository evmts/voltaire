import { describe, expect, it } from "@effect/vitest";
import type {
	BrandedAddress,
	BrandedHex,
	BrandedSignature,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type {
	AccountShape,
	SignAuthorizationParams,
} from "../../Account/AccountService.js";
import { AccountError, AccountService } from "../../Account/index.js";
import { ProviderService, type ProviderShape } from "../../Provider/index.js";
import { signAuthorization } from "./signAuthorization.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;

const mockAddress = new Uint8Array(20).fill(0xab) as AddressType;
const mockSignature = Object.assign(new Uint8Array(65).fill(0x12), {
	algorithm: "secp256k1" as const,
	v: 27,
}) as SignatureType;
const mockPublicKey = `0x04${"00".repeat(64)}` as HexType;

const mockSignedAuth = {
	chainId: 1n,
	address: "0x1234567890123456789012345678901234567890" as `0x${string}`,
	nonce: 5n,
	yParity: 0,
	r: `0x${"ab".repeat(32)}` as `0x${string}`,
	s: `0x${"cd".repeat(32)}` as `0x${string}`,
};

let capturedAuthorization: SignAuthorizationParams | undefined;

const mockAccount: AccountShape = {
	address: mockAddress,
	type: "local",
	publicKey: mockPublicKey,
	signMessage: () => Effect.succeed(mockSignature),
	sign: () => Effect.succeed(mockSignature),
	signTransaction: () => Effect.succeed(mockSignature),
	signTypedData: () => Effect.succeed(mockSignature),
	signAuthorization: (auth) => {
		capturedAuthorization = auth;
		const nonce = auth.nonce ?? 0n;
		return Effect.succeed({
			...mockSignedAuth,
			chainId: auth.chainId,
			nonce,
		});
	},
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

describe("signAuthorization", () => {
	it("signs authorization with fetched chain ID and nonce", async () => {
		capturedAuthorization = undefined;

		const program = signAuthorization({
			contractAddress: "0x1234567890123456789012345678901234567890",
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayers));

		expect(result.chainId).toBe(1n);
		expect(result.nonce).toBe(5n);
		expect(result.address).toBe("0x1234567890123456789012345678901234567890");
		expect(result.yParity).toBeDefined();
		expect(result.r).toMatch(/^0x[a-fA-F0-9]+$/);
		expect(result.s).toMatch(/^0x[a-fA-F0-9]+$/);
	});

	it("uses provided chain ID", async () => {
		capturedAuthorization = undefined;

		const program = signAuthorization({
			contractAddress: "0x1234567890123456789012345678901234567890",
			chainId: 137n,
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayers));

		expect(result.chainId).toBe(137n);
		expect(capturedAuthorization?.chainId).toBe(137n);
	});

	it("uses provided nonce", async () => {
		capturedAuthorization = undefined;

		const program = signAuthorization({
			contractAddress: "0x1234567890123456789012345678901234567890",
			nonce: 42n,
		});

		const result = await Effect.runPromise(Effect.provide(program, TestLayers));

		expect(result.nonce).toBe(42n);
		expect(capturedAuthorization?.nonce).toBe(42n);
	});

	it("passes correct authorization params to account", async () => {
		capturedAuthorization = undefined;

		const program = signAuthorization({
			contractAddress: "0xabcdef0123456789abcdef0123456789abcdef01",
			chainId: 10n,
			nonce: 100n,
		});

		await Effect.runPromise(Effect.provide(program, TestLayers));

		expect(capturedAuthorization).toEqual({
			chainId: 10n,
			contractAddress: "0xabcdef0123456789abcdef0123456789abcdef01",
			nonce: 100n,
		});
	});

	it("converts AddressType contract address", async () => {
		capturedAuthorization = undefined;
		const contractAddress = new Uint8Array(20).fill(0x12) as AddressType;

		const program = signAuthorization({ contractAddress });

		await Effect.runPromise(Effect.provide(program, TestLayers));

		expect(capturedAuthorization?.contractAddress.toLowerCase()).toBe(
			"0x1212121212121212121212121212121212121212",
		);
	});

	it("handles account signing errors", async () => {
		const accountWithError: AccountShape = {
			...mockAccount,
			signAuthorization: () =>
				Effect.fail(
					new AccountError(
						{ action: "signAuthorization" },
						"Hardware wallet disconnected",
					),
				),
		};

		const customLayers = Layer.mergeAll(
			Layer.succeed(AccountService, accountWithError),
			TestProviderLayer,
		);

		const program = signAuthorization({
			contractAddress: "0x1234567890123456789012345678901234567890",
		});

		const result = await Effect.runPromiseExit(
			Effect.provide(program, customLayers),
		);

		expect(result._tag).toBe("Failure");
		if (result._tag === "Failure") {
			expect(String(result.cause)).toContain("Failed to sign authorization");
		}
	});

	it("handles provider errors when fetching chain ID", async () => {
		const { ProviderError } = await import("../../Provider/index.js");

		const providerWithError: ProviderShape = {
			...mockProvider,
			getChainId: () => Effect.fail(new ProviderError({}, "Network error")),
		};

		const customLayers = Layer.mergeAll(
			TestAccountLayer,
			Layer.succeed(ProviderService, providerWithError),
		);

		const program = signAuthorization({
			contractAddress: "0x1234567890123456789012345678901234567890",
		});

		const result = await Effect.runPromiseExit(
			Effect.provide(program, customLayers),
		);

		expect(result._tag).toBe("Failure");
	});

	it("handles provider errors when fetching nonce", async () => {
		const { ProviderError } = await import("../../Provider/index.js");

		const providerWithError: ProviderShape = {
			...mockProvider,
			getTransactionCount: () =>
				Effect.fail(new ProviderError({}, "RPC timeout")),
		};

		const customLayers = Layer.mergeAll(
			TestAccountLayer,
			Layer.succeed(ProviderService, providerWithError),
		);

		const program = signAuthorization({
			contractAddress: "0x1234567890123456789012345678901234567890",
		});

		const result = await Effect.runPromiseExit(
			Effect.provide(program, customLayers),
		);

		expect(result._tag).toBe("Failure");
	});
});
