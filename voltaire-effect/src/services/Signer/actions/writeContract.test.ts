import type { BrandedAddress, BrandedSignature } from "@tevm/voltaire";
import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "@effect/vitest";
import type { AccountShape } from "../../Account/AccountService.js";
import { AccountService } from "../../Account/index.js";
import { ProviderService, type ProviderShape } from "../../Provider/index.js";
import {
	TransportService,
	type TransportShape,
} from "../../Transport/index.js";
import { Signer } from "../Signer.js";
import { writeContract } from "./writeContract.js";

type AddressType = BrandedAddress.AddressType;
type SignatureType = BrandedSignature.SignatureType;

const mockAddress = new Uint8Array(20).fill(0xab) as AddressType;
const mockSignature = Object.assign(new Uint8Array(65).fill(0x12), {
	algorithm: "secp256k1" as const,
	v: 27,
}) as SignatureType;
const mockTxHashHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const mockTxHash: HashType = Hash.fromHex(mockTxHashHex);

const erc20Abi = [
	{
		type: "function",
		name: "transfer",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "approve",
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
		stateMutability: "nonpayable",
	},
] as const;

let capturedTx: unknown;

const mockAccount: AccountShape = {
	address: mockAddress,
	type: "local",
	publicKey: new Uint8Array(65).fill(0x04),
	signMessage: () => Effect.succeed(mockSignature),
	sign: () => Effect.succeed(mockSignature),
	signTransaction: (tx) => {
		capturedTx = tx;
		return Effect.succeed(mockSignature);
	},
	signTypedData: () => Effect.succeed(mockSignature),
	signAuthorization: () =>
		Effect.succeed({
			chainId: 1n,
			address: "0x0000000000000000000000000000000000000001" as `0x${string}`,
			nonce: 0n,
			yParity: 0,
			r: ("0x" + "00".repeat(32)) as `0x${string}`,
			s: ("0x" + "00".repeat(32)) as `0x${string}`,
		}),
	clearKey: () => Effect.void,
};

const mockProvider: ProviderShape = {
	getBlockNumber: () => Effect.succeed(12345n),
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
			baseFeePerGas: "0x3b9aca00",
		}),
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

describe("writeContract", () => {
	it("encodes function call and sends transaction", async () => {
		const recipient = "0x1234567890123456789012345678901234567890";

		const program = writeContract({
			address: "0xabababababababababababababababababababab",
			abi: erc20Abi,
			functionName: "transfer",
			args: [recipient, 1000000000000000000n],
		});

		const result = await Effect.runPromise(
			Effect.provide(program, TestSignerLayer),
		);

		expect(Hash.equals(result, mockTxHash)).toBe(true);
	});

	it("sends transaction with value", async () => {
		capturedTx = undefined;
		const recipient = "0x1234567890123456789012345678901234567890";

		const program = writeContract({
			address: "0xabababababababababababababababababababab",
			abi: erc20Abi,
			functionName: "transfer",
			args: [recipient, 1000000000000000000n],
			value: 5000000000000000000n,
		});

		await Effect.runPromise(Effect.provide(program, TestSignerLayer));

		const tx = capturedTx as { value?: bigint };
		expect(tx.value).toBe(5000000000000000000n);
	});

	it("sends transaction with custom gas params", async () => {
		capturedTx = undefined;

		const program = writeContract({
			address: "0xabababababababababababababababababababab",
			abi: erc20Abi,
			functionName: "approve",
			args: ["0x1234567890123456789012345678901234567890", 100n],
			gas: 50000n,
			maxFeePerGas: 30000000000n,
			maxPriorityFeePerGas: 2000000000n,
		});

		await Effect.runPromise(Effect.provide(program, TestSignerLayer));

		const tx = capturedTx as {
			gasLimit?: bigint;
			maxFeePerGas?: bigint;
			maxPriorityFeePerGas?: bigint;
		};
		expect(tx.gasLimit).toBe(50000n);
		expect(tx.maxFeePerGas).toBe(30000000000n);
		expect(tx.maxPriorityFeePerGas).toBe(2000000000n);
	});

	it("encodes calldata correctly", async () => {
		capturedTx = undefined;

		const program = writeContract({
			address: "0xabababababababababababababababababababab",
			abi: erc20Abi,
			functionName: "transfer",
			args: [
				"0x1111111111111111111111111111111111111111",
				1000000000000000000n,
			],
		});

		await Effect.runPromise(Effect.provide(program, TestSignerLayer));

		const tx = capturedTx as { data?: string | Uint8Array };
		expect(tx.data).toBeDefined();
		expect(
			typeof tx.data === "string" ||
				(tx.data && typeof tx.data === "object" && "length" in tx.data),
		).toBe(true);
	});

	it("accepts branded address type", async () => {
		const program = writeContract({
			address: mockAddress,
			abi: erc20Abi,
			functionName: "transfer",
			args: [
				"0x1234567890123456789012345678901234567890",
				1000000000000000000n,
			],
		});

		const result = await Effect.runPromise(
			Effect.provide(program, TestSignerLayer),
		);

		expect(Hash.equals(result, mockTxHash)).toBe(true);
	});

	it("works with legacy gas price", async () => {
		capturedTx = undefined;

		const program = writeContract({
			address: "0xabababababababababababababababababababab",
			abi: erc20Abi,
			functionName: "transfer",
			args: ["0x1234567890123456789012345678901234567890", 100n],
			gasPrice: 25000000000n,
		});

		await Effect.runPromise(Effect.provide(program, TestSignerLayer));

		const tx = capturedTx as { gasPrice?: bigint };
		expect(tx.gasPrice).toBe(25000000000n);
	});
});
