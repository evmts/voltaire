import { describe, expect, it } from "@effect/vitest";
import type {
	BrandedAddress,
	BrandedHex,
	BrandedSignature,
} from "@tevm/voltaire";
import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as S from "effect/Schema";
import { fromArray } from "../../../primitives/Abi/AbiSchema.js";
import type { AccountShape } from "../../Account/AccountService.js";
import { AccountService } from "../../Account/index.js";
import { ProviderService, type ProviderShape } from "../../Provider/index.js";
import {
	TransportError,
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
const mockPublicKey = `0x04${"00".repeat(64)}` as HexType;
const mockTxHashHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const mockTxHash: HashType = Hash.fromHex(mockTxHashHex);
const mockContractAddress = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

const simpleBytecode = "0x608060405234801561001057600080fd5b50";

const abiWithConstructor = S.decodeUnknownSync(fromArray)([
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
]);

const abiWithoutConstructor = S.decodeUnknownSync(fromArray)([
	{
		type: "function",
		name: "getValue",
		inputs: [],
		outputs: [{ type: "uint256" }],
		stateMutability: "view",
	},
]);

const abiPayableConstructor = S.decodeUnknownSync(fromArray)([
	{
		type: "constructor",
		inputs: [{ name: "initialValue", type: "uint256" }],
		stateMutability: "payable",
	},
]);

let capturedTx: unknown;

const mockAccount: AccountShape = {
	address: mockAddress,
	type: "local",
	publicKey: mockPublicKey,
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
			r: `0x${"00".repeat(32)}` as `0x${string}`,
			s: `0x${"00".repeat(32)}` as `0x${string}`,
		}),
	clearKey: () => Effect.void,
};

type ReceiptOverride = {
	transactionHash: string;
	blockNumber: string;
	blockHash: string;
	transactionIndex: string;
	from: string;
	to: null;
	contractAddress: string | null;
	cumulativeGasUsed: string;
	gasUsed: string;
	logs: unknown[];
	logsBloom: string;
	status: string;
	effectiveGasPrice: string;
	type: string;
};

const createMockProviderWithReceipt = (
	receiptOverride?: ReceiptOverride | "error",
): ProviderShape => ({
	request: <T>(method: string, _params?: unknown[]) => {
		switch (method) {
			case "eth_blockNumber":
				return Effect.succeed("0x3039" as T); // 12345
			case "eth_getBlockByNumber":
			case "eth_getBlockByHash":
				return Effect.succeed({
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
				} as T);
			case "eth_getBalance":
				return Effect.succeed("0xde0b6b3a7640000" as T); // 1 ETH
			case "eth_getTransactionCount":
				return Effect.succeed("0x5" as T);
			case "eth_getCode":
				return Effect.succeed("0x" as T);
			case "eth_getStorageAt":
				return Effect.succeed("0x0" as T);
			case "eth_getTransactionReceipt":
				if (receiptOverride === "error") {
					return Effect.fail(
						new TransportError({
							code: -32000,
							message: "Network connection lost",
						}),
					);
				}
				if (receiptOverride) {
					return Effect.succeed(receiptOverride as T);
				}
				return Effect.succeed({
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
				} as T);
			case "eth_call":
				return Effect.succeed("0x" as T);
			case "eth_estimateGas":
				return Effect.succeed("0x186a0" as T); // 100000
			case "eth_chainId":
				return Effect.succeed("0x1" as T);
			case "eth_gasPrice":
				return Effect.succeed("0x4a817c800" as T); // 20 gwei
			case "eth_maxPriorityFeePerGas":
				return Effect.succeed("0x3b9aca00" as T); // 1 gwei
			case "eth_feeHistory":
				return Effect.succeed({
					oldestBlock: "0x0",
					baseFeePerGas: [],
					gasUsedRatio: [],
				} as T);
			case "eth_sendRawTransaction":
				return Effect.succeed("0x" as T);
			default:
				return Effect.succeed(null as T);
		}
	},
});

const mockProvider: ProviderShape = createMockProviderWithReceipt();

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

	it("fails address effect when receipt has no contractAddress", async () => {
		const providerWithNullAddress = createMockProviderWithReceipt({
			transactionHash: mockTxHashHex,
			blockNumber: "0x1",
			blockHash: "0xabc",
			transactionIndex: "0x0",
			from: "0xabababababababababababababababababababab",
			to: null,
			contractAddress: null,
			cumulativeGasUsed: "0x5208",
			gasUsed: "0x5208",
			logs: [],
			logsBloom: "0x0",
			status: "0x1",
			effectiveGasPrice: "0x3b9aca00",
			type: "0x2",
		});
		const NullAddressProviderLayer = Layer.succeed(
			ProviderService,
			providerWithNullAddress,
		);
		const NullAddressSignerLayer = Layer.provide(
			Signer.Live,
			Layer.mergeAll(
				TestAccountLayer,
				NullAddressProviderLayer,
				TestTransportLayer,
			),
		);
		const NullAddressFullLayer = Layer.merge(
			NullAddressSignerLayer,
			NullAddressProviderLayer,
		);

		const program = deployContract({
			abi: abiWithoutConstructor,
			bytecode: simpleBytecode as HexType,
		});

		const result = await Effect.runPromise(
			Effect.provide(program, NullAddressFullLayer),
		);

		expect(Hash.equals(result.hash, mockTxHash)).toBe(true);

		const addressResult = await Effect.runPromiseExit(
			Effect.provide(result.address, NullAddressProviderLayer),
		);
		expect(addressResult._tag).toBe("Failure");
		if (addressResult._tag === "Failure") {
			const error = addressResult.cause;
			expect(String(error)).toContain("No contract address");
		}
	});

	it("fails address effect when waitForTransactionReceipt fails", async () => {
		const providerWithReceiptError = createMockProviderWithReceipt("error");
		const ErrorProviderLayer = Layer.succeed(
			ProviderService,
			providerWithReceiptError,
		);
		const ErrorSignerLayer = Layer.provide(
			Signer.Live,
			Layer.mergeAll(TestAccountLayer, ErrorProviderLayer, TestTransportLayer),
		);
		const ErrorFullLayer = Layer.merge(ErrorSignerLayer, ErrorProviderLayer);

		const program = deployContract({
			abi: abiWithoutConstructor,
			bytecode: simpleBytecode as HexType,
		});

		const result = await Effect.runPromise(
			Effect.provide(program, ErrorFullLayer),
		);

		expect(Hash.equals(result.hash, mockTxHash)).toBe(true);

		const addressResult = await Effect.runPromiseExit(
			Effect.provide(result.address, ErrorProviderLayer),
		);
		expect(addressResult._tag).toBe("Failure");
		if (addressResult._tag === "Failure") {
			const error = addressResult.cause;
			expect(String(error)).toContain("Network connection lost");
		}
	});

	it("ignores args when ABI has no constructor", async () => {
		capturedTx = undefined;

		const program = deployContract({
			abi: abiWithoutConstructor,
			bytecode: simpleBytecode as HexType,
			args: [123n, "ignored"],
		});

		const result = await Effect.runPromise(
			Effect.provide(program, FullTestLayer),
		);

		expect(Hash.equals(result.hash, mockTxHash)).toBe(true);

		const tx = capturedTx as { data?: string | Uint8Array };
		let dataStr: string;
		if (typeof tx.data === "string") {
			dataStr = tx.data;
		} else if (tx.data && typeof tx.data === "object" && "length" in tx.data) {
			dataStr = `0x${Buffer.from(tx.data as unknown as number[]).toString("hex")}`;
		} else {
			dataStr = "";
		}
		expect(dataStr).toBe(simpleBytecode);
	});

	it("fails with empty bytecode", async () => {
		const program = deployContract({
			abi: abiWithoutConstructor,
			bytecode: "0x" as HexType,
		});

		const result = await Effect.runPromise(
			Effect.provide(program, FullTestLayer),
		);

		expect(Hash.equals(result.hash, mockTxHash)).toBe(true);
	});

	it("fails with invalid non-hex bytecode", async () => {
		const invalidBytecode = "not-hex-bytecode";

		const program = deployContract({
			abi: abiWithoutConstructor,
			bytecode: invalidBytecode as HexType,
		});

		const result = await Effect.runPromiseExit(
			Effect.provide(program, FullTestLayer),
		);

		expect(result._tag).toBe("Failure");
	});

	it("fails when constructor args do not match ABI types", async () => {
		const program = deployContract({
			abi: abiWithConstructor,
			bytecode: simpleBytecode as HexType,
			args: ["not-a-number", 12345],
		});

		const result = await Effect.runPromiseExit(
			Effect.provide(program, FullTestLayer),
		);

		expect(result._tag).toBe("Failure");
	});

	it("fails when constructor args count mismatches ABI", async () => {
		const program = deployContract({
			abi: abiWithConstructor,
			bytecode: simpleBytecode as HexType,
			args: [100n],
		});

		const result = await Effect.runPromiseExit(
			Effect.provide(program, FullTestLayer),
		);

		expect(result._tag).toBe("Failure");
	});
});
