import {
	encodeFunctionData,
	decodeFunctionData,
	type FunctionDefinition,
	AbiType,
} from "../../src/primitives/abi.js";

// Simple function: transfer(address,uint256)
const transferFunction: FunctionDefinition = {
	name: "transfer",
	inputs: [
		{ type: AbiType.Address, name: "to" },
		{ type: AbiType.Uint256, name: "amount" },
	],
};
const transferArgs = ["0x742d35cc6634c0532925a3b844bc9e7595f0beb1", 1000n];
const transferEncoded = encodeFunctionData(transferFunction, transferArgs);

// Complex function: swapExactTokensForTokens
const swapFunction: FunctionDefinition = {
	name: "swapExactTokensForTokens",
	inputs: [
		{ type: AbiType.Uint256, name: "amountIn" },
		{ type: AbiType.Uint256, name: "amountOutMin" },
		{ type: AbiType.AddressArray, name: "path" },
		{ type: AbiType.Address, name: "to" },
		{ type: AbiType.Uint256, name: "deadline" },
	],
};
const swapArgs = [
	1000000000000000000n,
	900000000000000000n,
	[
		"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
	],
	"0x742d35cc6634c0532925a3b844bc9e7595f0beb1",
	1700000000n,
];
const swapEncoded = encodeFunctionData(swapFunction, swapArgs);

export function main(): void {
	// Decode both simple and complex function calls
	decodeFunctionData(transferFunction, transferEncoded);
	decodeFunctionData(swapFunction, swapEncoded);
}
