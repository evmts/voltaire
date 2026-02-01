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
	TransportService,
	type TransportShape,
} from "../../Transport/index.js";
import { Signer } from "../Signer.js";
import { writeContract } from "./writeContract.js";

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

const erc20Abi = S.decodeUnknownSync(fromArray)([
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

const mockProvider: ProviderShape = {
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
			case "eth_getTransactionCount":
				return Effect.succeed("0x5" as T);
			case "eth_estimateGas":
				return Effect.succeed("0x5208" as T); // 21000
			case "eth_chainId":
				return Effect.succeed("0x1" as T);
			case "eth_gasPrice":
				return Effect.succeed("0x4a817c800" as T); // 20 gwei
			case "eth_maxPriorityFeePerGas":
				return Effect.succeed("0x3b9aca00" as T); // 1 gwei
			default:
				return Effect.succeed(null as T);
		}
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
