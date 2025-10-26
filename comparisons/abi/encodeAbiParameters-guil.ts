import {
	encodeAbiParameters,
	type AbiParameter,
	AbiType,
} from "../../src/primitives/abi.js";

// Simple test case: single uint256
const simpleParams: AbiParameter[] = [{ type: AbiType.Uint256, name: "value" }];
const simpleValues = [42n];

// Complex test case: address, bytes32, uint256 array, and string
const complexParams: AbiParameter[] = [
	{ type: AbiType.Address, name: "to" },
	{ type: AbiType.Bytes32, name: "hash" },
	{ type: AbiType.Uint256Array, name: "amounts" },
	{ type: AbiType.String, name: "message" },
];
const complexValues = [
	"0x742d35cc6634c0532925a3b844bc9e7595f0beb1",
	new Uint8Array(32).fill(0xff),
	[100n, 200n, 300n],
	"Hello, Ethereum!",
];

export function main(): void {
	// Run both simple and complex encodings
	encodeAbiParameters(simpleParams, simpleValues);
	encodeAbiParameters(complexParams, complexValues);
}
