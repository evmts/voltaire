import {
	encodePacked,
	type AbiParameter,
	AbiType,
} from "../../src/primitives/abi.js";

// Test cases for packed encoding
const params: AbiParameter[] = [
	{ type: AbiType.Address, name: "addr" },
	{ type: AbiType.Uint256, name: "value" },
	{ type: AbiType.String, name: "text" },
];
const values = ["0x742d35cc6634c0532925a3b844bc9e7595f0beb1", 42n, "hello"];

// Additional test with bytes
const paramsWithBytes: AbiParameter[] = [
	{ type: AbiType.Uint8, name: "a" },
	{ type: AbiType.Uint16, name: "b" },
	{ type: AbiType.Uint32, name: "c" },
	{ type: AbiType.Bytes, name: "data" },
];
const valuesWithBytes = [255, 65535, 4294967295, new Uint8Array([1, 2, 3, 4])];

export function main(): void {
	// Encode packed data
	encodePacked(params, values);
	encodePacked(paramsWithBytes, valuesWithBytes);
}
