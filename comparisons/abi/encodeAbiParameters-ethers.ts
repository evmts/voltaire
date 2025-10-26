import { AbiCoder } from "ethers";

const abiCoder = AbiCoder.defaultAbiCoder();

// Simple test case: single uint256
const simpleTypes = ["uint256"];
const simpleValues = [42n];

// Complex test case: address, bytes32, uint256 array, and string
const complexTypes = ["address", "bytes32", "uint256[]", "string"];
const complexValues = [
	"0x742d35cc6634c0532925a3b844bc9e7595f0beb1",
	new Uint8Array(32).fill(0xff),
	[100n, 200n, 300n],
	"Hello, Ethereum!",
];

export function main(): void {
	// Run both simple and complex encodings
	abiCoder.encode(simpleTypes, simpleValues);
	abiCoder.encode(complexTypes, complexValues);
}
