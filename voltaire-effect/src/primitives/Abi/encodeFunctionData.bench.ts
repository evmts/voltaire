/**
 * Benchmark: voltaire vs voltaire-effect vs viem encodeFunctionData
 */

import { Effect } from "effect";
import { bench, run } from "mitata";
import { encodeFunctionData as viemEncodeFunctionData } from "viem";
import * as Abi from "@tevm/voltaire/Abi";
import { encodeFunctionData } from "./encodeFunctionData.js";

const erc20Abi = [
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
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{ type: "address", name: "account" }],
		outputs: [{ type: "uint256", name: "" }],
	},
	{
		type: "function",
		name: "approve",
		stateMutability: "nonpayable",
		inputs: [
			{ type: "address", name: "spender" },
			{ type: "uint256", name: "amount" },
		],
		outputs: [{ type: "bool", name: "" }],
	},
] as const;

const recipient = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
const amount = 1000000000000000000n;

bench("encodeFunctionData - viem", () => {
	viemEncodeFunctionData({
		abi: erc20Abi,
		functionName: "transfer",
		args: [recipient, amount],
	});
});

bench("encodeFunctionData - voltaire", () => {
	Abi.encodeFunction(erc20Abi, "transfer", [recipient, amount]);
});

bench("encodeFunctionData - voltaire-effect (sync)", () => {
	Effect.runSync(encodeFunctionData(erc20Abi, "transfer", [recipient, amount]));
});

await run();

// Also test balanceOf (single param)
bench("balanceOf - viem", () => {
	viemEncodeFunctionData({
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [recipient],
	});
});

bench("balanceOf - voltaire", () => {
	Abi.encodeFunction(erc20Abi, "balanceOf", [recipient]);
});

bench("balanceOf - voltaire-effect (sync)", () => {
	Effect.runSync(encodeFunctionData(erc20Abi, "balanceOf", [recipient]));
});

await run();
