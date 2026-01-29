/**
 * ABI Encoding/Decoding Benchmarks - mitata format
 * Compares voltaire vs viem vs ethers ABI operations
 */

import { Interface as EthersInterface } from "ethers";
import { bench, run } from "mitata";
import {
	decodeAbiParameters,
	encodeAbiParameters,
	encodeFunctionData as viemEncodeFunctionData,
	decodeFunctionData as viemDecodeFunctionData,
	decodeFunctionResult as viemDecodeFunctionResult,
	encodeFunctionResult as viemEncodeFunctionResult,
} from "viem";
import { Address } from "../Address/index.js";
import * as Abi from "./index.js";
import type { FunctionType } from "./function/FunctionType.js";

// ============================================================================
// Test Data
// ============================================================================

const transferAbi = [
	{
		type: "function",
		name: "transfer",
		stateMutability: "nonpayable",
		inputs: [
			{ type: "address", name: "to" },
			{ type: "uint256", name: "amount" },
		],
		outputs: [{ type: "bool", name: "" }],
	},
] as const;

const transferFunc = transferAbi[0] as unknown as FunctionType;

const balanceOfAbi = [
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{ type: "address", name: "account" }],
		outputs: [{ type: "uint256", name: "" }],
	},
] as const;

const complexAbi = [
	{
		type: "function",
		name: "processOrder",
		stateMutability: "nonpayable",
		inputs: [
			{
				type: "tuple",
				name: "order",
				components: [
					{ type: "address", name: "maker" },
					{
						type: "tuple",
						name: "asset",
						components: [
							{ type: "address", name: "token" },
							{ type: "uint256", name: "amount" },
						],
					},
					{ type: "uint256[]", name: "fees" },
				],
			},
		],
		outputs: [],
	},
] as const;

const recipient = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
const amount = 1000000000000000000n;

// Pre-encode for decode benchmarks
const encodedTransfer = viemEncodeFunctionData({
	abi: transferAbi,
	functionName: "transfer",
	args: [recipient, amount],
});

const encodedResult = viemEncodeFunctionResult({
	abi: transferAbi,
	functionName: "transfer",
	result: true,
});

// Ethers interface
const ethersInterface = new EthersInterface([
	"function transfer(address to, uint256 amount) returns (bool)",
	"function balanceOf(address account) view returns (uint256)",
]);

// ============================================================================
// encodeFunctionData - transfer(address, uint256)
// ============================================================================

bench("encodeFunctionData(transfer) - voltaire", () => {
	Abi.encodeFunction(transferAbi, "transfer", [recipient, amount]);
});

bench("encodeFunctionData(transfer) - viem", () => {
	viemEncodeFunctionData({
		abi: transferAbi,
		functionName: "transfer",
		args: [recipient, amount],
	});
});

bench("encodeFunctionData(transfer) - ethers", () => {
	ethersInterface.encodeFunctionData("transfer", [recipient, amount]);
});

await run();

// ============================================================================
// decodeFunctionData - transfer(address, uint256)
// ============================================================================

bench("decodeFunctionData(transfer) - voltaire", () => {
	Abi.decodeFunction(transferAbi, encodedTransfer);
});

bench("decodeFunctionData(transfer) - viem", () => {
	viemDecodeFunctionData({
		abi: transferAbi,
		data: encodedTransfer,
	});
});

bench("decodeFunctionData(transfer) - ethers", () => {
	ethersInterface.decodeFunctionData("transfer", encodedTransfer);
});

await run();

// ============================================================================
// encodeFunctionResult - bool return
// ============================================================================

bench("encodeFunctionResult(bool) - voltaire", () => {
	Abi.Function.encodeResult(transferFunc, [true] as [boolean]);
});

bench("encodeFunctionResult(bool) - viem", () => {
	viemEncodeFunctionResult({
		abi: transferAbi,
		functionName: "transfer",
		result: true,
	});
});

await run();

// ============================================================================
// decodeFunctionResult - bool return
// ============================================================================

bench("decodeFunctionResult(bool) - voltaire", () => {
	Abi.Function.decodeResult(transferFunc, encodedResult);
});

bench("decodeFunctionResult(bool) - viem", () => {
	viemDecodeFunctionResult({
		abi: transferAbi,
		functionName: "transfer",
		data: encodedResult,
	});
});

bench("decodeFunctionResult(bool) - ethers", () => {
	ethersInterface.decodeFunctionResult("transfer", encodedResult);
});

await run();

// ============================================================================
// encodeAbiParameters - various types
// ============================================================================

const uint256Params = [{ type: "uint256" }] as const;
const addressParams = [{ type: "address" }] as const;
const mixedParams = [
	{ type: "uint256" },
	{ type: "address" },
	{ type: "bool" },
] as const;
const stringParams = [{ type: "string" }] as const;
const bytesParams = [{ type: "bytes" }] as const;
const arrayParams = [{ type: "uint256[]" }] as const;

const testArray = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n];
const testBytes = new Uint8Array(100).fill(0xab);

bench("encodeParameters(uint256) - voltaire", () => {
	Abi.encodeParameters(uint256Params, [amount]);
});

bench("encodeParameters(uint256) - viem", () => {
	encodeAbiParameters(uint256Params, [amount]);
});

await run();

bench("encodeParameters(address) - voltaire", () => {
	Abi.encodeParameters(addressParams, [recipient]);
});

bench("encodeParameters(address) - viem", () => {
	encodeAbiParameters(addressParams, [recipient]);
});

await run();

bench("encodeParameters(uint256,address,bool) - voltaire", () => {
	Abi.encodeParameters(mixedParams, [amount, recipient, true]);
});

bench("encodeParameters(uint256,address,bool) - viem", () => {
	encodeAbiParameters(mixedParams, [amount, recipient, true]);
});

await run();

bench("encodeParameters(string) - voltaire", () => {
	Abi.encodeParameters(stringParams, ["Hello, World! This is a test string."]);
});

bench("encodeParameters(string) - viem", () => {
	encodeAbiParameters(stringParams, [
		"Hello, World! This is a test string.",
	]);
});

await run();

bench("encodeParameters(bytes) - voltaire", () => {
	Abi.encodeParameters(bytesParams, [testBytes]);
});

bench("encodeParameters(bytes) - viem", () => {
	encodeAbiParameters(bytesParams, [testBytes]);
});

await run();

bench("encodeParameters(uint256[]) - voltaire", () => {
	Abi.encodeParameters(arrayParams, [testArray]);
});

bench("encodeParameters(uint256[]) - viem", () => {
	encodeAbiParameters(arrayParams, [testArray]);
});

await run();

// ============================================================================
// decodeAbiParameters - various types
// ============================================================================

const encodedUint256 = encodeAbiParameters(uint256Params, [amount]);
const encodedAddress = encodeAbiParameters(addressParams, [recipient]);
const encodedMixed = encodeAbiParameters(mixedParams, [amount, recipient, true]);
const encodedString = encodeAbiParameters(stringParams, ["Hello, World!"]);
const encodedArray = encodeAbiParameters(arrayParams, [testArray]);

bench("decodeParameters(uint256) - voltaire", () => {
	Abi.decodeParameters(uint256Params, encodedUint256);
});

bench("decodeParameters(uint256) - viem", () => {
	decodeAbiParameters(uint256Params, encodedUint256);
});

await run();

bench("decodeParameters(address) - voltaire", () => {
	Abi.decodeParameters(addressParams, encodedAddress);
});

bench("decodeParameters(address) - viem", () => {
	decodeAbiParameters(addressParams, encodedAddress);
});

await run();

bench("decodeParameters(uint256,address,bool) - voltaire", () => {
	Abi.decodeParameters(mixedParams, encodedMixed);
});

bench("decodeParameters(uint256,address,bool) - viem", () => {
	decodeAbiParameters(mixedParams, encodedMixed);
});

await run();

bench("decodeParameters(string) - voltaire", () => {
	Abi.decodeParameters(stringParams, encodedString);
});

bench("decodeParameters(string) - viem", () => {
	decodeAbiParameters(stringParams, encodedString);
});

await run();

bench("decodeParameters(uint256[]) - voltaire", () => {
	Abi.decodeParameters(arrayParams, encodedArray);
});

bench("decodeParameters(uint256[]) - viem", () => {
	decodeAbiParameters(arrayParams, encodedArray);
});

await run();

// ============================================================================
// Function signature/selector operations
// ============================================================================

bench("getSelector(transfer) - voltaire", () => {
	Abi.Function.getSelector(transferFunc);
});

await run();

bench("getSignature(transfer) - voltaire", () => {
	Abi.Function.getSignature(transferFunc);
});

await run();

// ============================================================================
// Round-trip operations
// ============================================================================

bench("roundtrip - transfer encode+decode - voltaire", () => {
	const encoded = Abi.encodeFunction(transferAbi, "transfer", [
		recipient,
		amount,
	]);
	Abi.decodeFunction(transferAbi, encoded);
});

bench("roundtrip - transfer encode+decode - viem", () => {
	const encoded = viemEncodeFunctionData({
		abi: transferAbi,
		functionName: "transfer",
		args: [recipient, amount],
	});
	viemDecodeFunctionData({
		abi: transferAbi,
		data: encoded,
	});
});

bench("roundtrip - transfer encode+decode - ethers", () => {
	const encoded = ethersInterface.encodeFunctionData("transfer", [
		recipient,
		amount,
	]);
	ethersInterface.decodeFunctionData("transfer", encoded);
});

await run();

// ============================================================================
// encodePacked (tight packing)
// ============================================================================

bench("encodePacked(address,uint256) - voltaire", () => {
	Abi.encodePacked(["address", "uint256"], [recipient, amount]);
});

await run();

bench("encodePacked(string,uint256,address) - voltaire", () => {
	Abi.encodePacked(
		["string", "uint256", "address"],
		["Hello", amount, recipient],
	);
});

await run();

// ============================================================================
// ABI Item operations
// ============================================================================

bench("Item.format - function - voltaire", () => {
	Abi.Item.format(transferFunc);
});

await run();

const zeroAddr = Address.fromHex("0x0000000000000000000000000000000000000000");

bench("Item.formatWithArgs - function - voltaire", () => {
	Abi.Item.formatWithArgs(transferFunc, [zeroAddr, 100n]);
});

await run();

// ============================================================================
// getItem from ABI
// ============================================================================

const testAbi = [transferFunc, balanceOfAbi[0]] as const;

bench("Item.getItem - voltaire", () => {
	Abi.Item.getItem(testAbi, "transfer", "function");
});

await run();
