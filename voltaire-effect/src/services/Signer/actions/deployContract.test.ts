import type {
	BrandedAddress,
	BrandedHex,
	BrandedSignature,
} from "@tevm/voltaire";
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
import { deployContract } from "./deployContract.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;

const mockAddress = new Uint8Array(20).fill(0xab) as AddressType;
const mockSignature = Object.assign(new Uint8Array(65).fill(0x12), {
	algorithm: "secp256k1" as const,
	v: 27,
}) as SignatureType;
const mockTxHashHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const mockTxHash: HashType = Hash.fromHex(mockTxHashHex);
const mockContractAddress = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

const simpleBytecode = "0x608060405234801561001057600080fd5b50";

const abiWithConstructor = [
	{
		type: "constructor",
		inputs: [
			{ name: "initialValue", type: "uint256" },
			{ name: "name", type: "string" },
		],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "getValue",
		inputs: [],
		outputs: [{ type: "uint256" }],
		stateMutability: "view",
	},
] as const;

const abiWithoutConstructor = [
	{
		type: "function",
		name: "getValue",
		inputs: [],
		outputs: [{ type: "uint256" }],
		stateMutability: "view",
	},
] as const;

const abiPayableConstructor = [
	{
		type: "constructor",
		inputs: [{ name: "initialValue", type: "uint256" }],
		stateMutability: "payable",
	},
] as const;

let capturedTx: unknown;

const mockAccount: AccountShape = {
	address: mockAddress,
	type: "local",
	signMessage: () => Effect.succeed(mockSignature),
	signTransaction: (tx) => {
		capturedTx = tx;
		return Effect.succeed(mockSignature);
	},
	signTypedData: () => Effect.succeed(mockSignature),
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
	waitForTransactionReceipt: () =>
		Effect.succeed({
			transactionHash: mockTxHashHex,
			blockNumber: "0x1",
			blockHash: "0xabc",
			transactionIndex: "0x0",
			from: "0xabababababababababababababababababababab",
			to: null,
			contractAddress: mockContractAddress,
			cumulativeGasUsed: "0x5208",
			gasUsed: "0x5208",
			logs: [],
			logsBloom: "0x0",
			status: "0x1",
			effectiveGasPrice: "0x3b9aca00",
			type: "0x2",
		}),
	call: () => Effect.succeed("0x"),
	estimateGas: () => Effect.succeed(100000n),
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
const FullTestLayer = Layer.merge(TestSignerLayer, TestProviderLayer);

describe("deployContract", () => {
	it("deploys contract without constructor args", async () => {
		const program = deployContract({
			abi: abiWithoutConstructor,
			bytecode: simpleBytecode as HexType,
		});

		const result = await Effect.runPromise(
			Effect.provide(program, FullTestLayer),
		);

		expect(Hash.equals(result.hash, mockTxHash)).toBe(true);
	});

	it("deploys contract with constructor args", async () => {
		capturedTx = undefined;

		const program = deployContract({
			abi: abiWithConstructor,
			bytecode: simpleBytecode as HexType,
			args: [1000n, "MyContract"],
		});

		const result = await Effect.runPromise(
			Effect.provide(program, FullTestLayer),
		);

		expect(Hash.equals(result.hash, mockTxHash)).toBe(true);

		const tx = capturedTx as { data?: string | Uint8Array; to?: unknown };
		expect(tx.to).toBeUndefined();
		expect(tx.data).toBeDefined();
		let dataStr: string;
		if (typeof tx.data === "string") {
			dataStr = tx.data;
		} else if (tx.data && typeof tx.data === "object" && "length" in tx.data) {
			dataStr = `0x${Buffer.from(tx.data as unknown as number[]).toString("hex")}`;
		} else {
			dataStr = "";
		}
		expect(dataStr.length).toBeGreaterThan(simpleBytecode.length);
	});

	it("deploys contract with value (payable constructor)", async () => {
		capturedTx = undefined;

		const program = deployContract({
			abi: abiPayableConstructor,
			bytecode: simpleBytecode as HexType,
			args: [500n],
			value: 1000000000000000000n,
		});

		await Effect.runPromise(Effect.provide(program, FullTestLayer));

		const tx = capturedTx as { value?: bigint };
		expect(tx.value).toBe(1000000000000000000n);
	});

	it("returns lazy address effect that resolves after confirmation", async () => {
		const program = deployContract({
			abi: abiWithoutConstructor,
			bytecode: simpleBytecode as HexType,
		});

		const result = await Effect.runPromise(
			Effect.provide(program, FullTestLayer),
		);

		const contractAddress = await Effect.runPromise(
			Effect.provide(result.address, TestProviderLayer),
		);

		expect(contractAddress).toBeDefined();
	});

	it("sends deployment transaction with no 'to' address", async () => {
		capturedTx = undefined;

		const program = deployContract({
			abi: abiWithoutConstructor,
			bytecode: simpleBytecode as HexType,
		});

		await Effect.runPromise(Effect.provide(program, FullTestLayer));

		const tx = capturedTx as { to?: unknown };
		expect(tx.to).toBeUndefined();
	});

	it("applies custom gas params", async () => {
		capturedTx = undefined;

		const program = deployContract({
			abi: abiWithoutConstructor,
			bytecode: simpleBytecode as HexType,
			gas: 200000n,
			maxFeePerGas: 50000000000n,
			maxPriorityFeePerGas: 3000000000n,
		});

		await Effect.runPromise(Effect.provide(program, FullTestLayer));

		const tx = capturedTx as {
			gasLimit?: bigint;
			maxFeePerGas?: bigint;
			maxPriorityFeePerGas?: bigint;
		};
		expect(tx.gasLimit).toBe(200000n);
		expect(tx.maxFeePerGas).toBe(50000000000n);
		expect(tx.maxPriorityFeePerGas).toBe(3000000000n);
	});

	it("applies nonce when provided", async () => {
		capturedTx = undefined;

		const program = deployContract({
			abi: abiWithoutConstructor,
			bytecode: simpleBytecode as HexType,
			nonce: 42n,
		});

		await Effect.runPromise(Effect.provide(program, FullTestLayer));

		const tx = capturedTx as { nonce?: bigint };
		expect(tx.nonce).toBe(42n);
	});

	it("uses legacy gas price when specified", async () => {
		capturedTx = undefined;

		const program = deployContract({
			abi: abiWithoutConstructor,
			bytecode: simpleBytecode as HexType,
			gasPrice: 30000000000n,
		});

		await Effect.runPromise(Effect.provide(program, FullTestLayer));

		const tx = capturedTx as { gasPrice?: bigint };
		expect(tx.gasPrice).toBe(30000000000n);
	});
});
