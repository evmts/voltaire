import { encodeAbiParameters } from "viem";

// Simple test case: single uint256
const simpleParams = [{ type: "uint256", name: "value" }] as const;
const simpleValues = [42n];

// Complex test case: address, bytes32, uint256 array, and string
const complexParams = [
	{ type: "address", name: "to" },
	{ type: "bytes32", name: "hash" },
	{ type: "uint256[]", name: "amounts" },
	{ type: "string", name: "message" },
] as const;
const complexValues = [
	"0x742d35cc6634c0532925a3b844bc9e7595f0beb1" as `0x${string}`,
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" as `0x${string}`,
	[100n, 200n, 300n],
	"Hello, Ethereum!",
];

export function main(): void {
	// Run both simple and complex encodings
	encodeAbiParameters(simpleParams, simpleValues);
	// biome-ignore lint/suspicious/noExplicitAny: viem type compatibility
	encodeAbiParameters(complexParams, complexValues as any);
}
